#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use serde::{Deserialize, Serialize};
use std::fs;
use std::path::PathBuf;
use tauri::{AppHandle, Manager};

#[derive(Serialize, Deserialize, Debug)]
struct ConfigEntry {
  key: String,
  value: String,
}

fn state_file_path(app: &AppHandle) -> PathBuf {
  let mut p = app.path().app_data_dir().unwrap_or_else(|_| PathBuf::from("."));
  p.push("zed_but_browser");
  std::fs::create_dir_all(&p).ok();
  p.push("state.json");
  p
}

fn config_file_path(app: &AppHandle) -> PathBuf {
  let mut p = app.path().app_data_dir().unwrap_or_else(|_| PathBuf::from("."));
  p.push("zed_but_browser");
  std::fs::create_dir_all(&p).ok();
  p.push("config.json");
  p
}

#[tauri::command]
fn read_state(app: AppHandle) -> Result<String, String> {
  let p = state_file_path(&app);
  match fs::read_to_string(&p) {
    Ok(s) => Ok(s),
    Err(_) => Ok(String::from("{}")),
  }
}

#[tauri::command]
fn write_state(app: AppHandle, json: String) -> Result<bool, String> {
  let p = state_file_path(&app);
  fs::write(&p, json).map_err(|e| e.to_string())?;
  Ok(true)
}

#[tauri::command]
fn get_config(app: AppHandle, key: String) -> Result<Option<String>, String> {
  let p = config_file_path(&app);
  let data = fs::read_to_string(&p).unwrap_or_else(|_| String::from("{}"));
  let map: serde_json::Value = serde_json::from_str(&data).map_err(|e| e.to_string())?;
  Ok(map.get(&key).and_then(|v| v.as_str().map(|s| s.to_string())))
}

#[tauri::command]
fn set_config(app: AppHandle, key: String, value: String) -> Result<bool, String> {
  let p = config_file_path(&app);
  let data = fs::read_to_string(&p).unwrap_or_else(|_| String::from("{}"));
  let mut map: serde_json::Map<String, serde_json::Value> = serde_json::from_str(&data).unwrap_or_default();
  map.insert(key, serde_json::Value::String(value));
  let json = serde_json::Value::Object(map);
  fs::write(&p, serde_json::to_string_pretty(&json).map_err(|e| e.to_string())?).map_err(|e| e.to_string())?;
  Ok(true)
}

fn main() {
  tauri::Builder::default()
    .plugin(tauri_plugin_shell::init())
    .plugin(tauri_plugin_dialog::init())
    .plugin(tauri_plugin_fs::init())
    .plugin(tauri_plugin_os::init())
    .invoke_handler(tauri::generate_handler![read_state, write_state, get_config, set_config])
    .run(tauri::generate_context!())
    .expect("error while running tauri application");
}
