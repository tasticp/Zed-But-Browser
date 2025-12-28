// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::fs;
use std::path::PathBuf;
use tauri::{Manager, Window};

#[derive(Debug, Serialize, Deserialize, Clone)]
struct BrowserEngine {
    id: String,
    name: String,
    user_agent: String,
    description: String,
}

impl BrowserEngine {
    fn all() -> Vec<BrowserEngine> {
        vec![
            BrowserEngine {
                id: "chromium".to_string(),
                name: "Chromium".to_string(),
                user_agent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36".to_string(),
                description: "Fast and modern, used by Chrome and Edge".to_string(),
            },
            BrowserEngine {
                id: "firefox".to_string(),
                name: "Firefox (Gecko)".to_string(),
                user_agent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:121.0) Gecko/20100101 Firefox/121.0".to_string(),
                description: "Privacy-focused, used by Firefox".to_string(),
            },
            BrowserEngine {
                id: "webkit".to_string(),
                name: "WebKit".to_string(),
                user_agent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Safari/605.1.15".to_string(),
                description: "Lightweight, used by Safari".to_string(),
            },
            BrowserEngine {
                id: "edge".to_string(),
                name: "Microsoft Edge".to_string(),
                user_agent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 Edg/120.0.0.0".to_string(),
                description: "Microsoft Edge engine".to_string(),
            },
        ]
    }
}

struct AppState {
    config_path: PathBuf,
}

fn get_config_path(app: &tauri::AppHandle) -> PathBuf {
    let app_data_dir = app.path_resolver()
        .app_data_dir()
        .expect("Failed to get app data directory");
    
    if !app_data_dir.exists() {
        fs::create_dir_all(&app_data_dir).expect("Failed to create app data directory");
    }
    
    app_data_dir.join("config.json")
}

fn load_config(config_path: &PathBuf) -> HashMap<String, serde_json::Value> {
    if config_path.exists() {
        let content = fs::read_to_string(config_path).unwrap_or_else(|_| "{}".to_string());
        serde_json::from_str(&content).unwrap_or_else(|_| HashMap::new())
    } else {
        HashMap::new()
    }
}

fn save_config(config_path: &PathBuf, config: &HashMap<String, serde_json::Value>) {
    let content = serde_json::to_string_pretty(config).expect("Failed to serialize config");
    fs::write(config_path, content).expect("Failed to write config");
}

#[tauri::command]
fn get_browser_engines() -> Vec<BrowserEngine> {
    BrowserEngine::all()
}

#[tauri::command]
fn get_selected_engine(app: tauri::AppHandle) -> String {
    let config_path = get_config_path(&app);
    let config = load_config(&config_path);
    config
        .get("selectedEngine")
        .and_then(|v| v.as_str())
        .map(|s| s.to_string())
        .unwrap_or_else(|| "chromium".to_string())
}

#[tauri::command]
fn set_selected_engine(engine_id: String, app: tauri::AppHandle) -> bool {
    let config_path = get_config_path(&app);
    let mut config = load_config(&config_path);
    config.insert("selectedEngine".to_string(), serde_json::Value::String(engine_id));
    save_config(&config_path, &config);
    true
}

#[tauri::command]
fn has_completed_onboarding(app: tauri::AppHandle) -> bool {
    let config_path = get_config_path(&app);
    let config = load_config(&config_path);
    config
        .get("hasCompletedOnboarding")
        .and_then(|v| v.as_bool())
        .unwrap_or(false)
}

#[tauri::command]
fn complete_onboarding(app: tauri::AppHandle) -> bool {
    let config_path = get_config_path(&app);
    let mut config = load_config(&config_path);
    config.insert("hasCompletedOnboarding".to_string(), serde_json::Value::Bool(true));
    save_config(&config_path, &config);
    true
}

#[tauri::command]
fn get_ad_blocking_enabled(app: tauri::AppHandle) -> bool {
    let config_path = get_config_path(&app);
    let config = load_config(&config_path);
    config
        .get("adBlockingEnabled")
        .and_then(|v| v.as_bool())
        .unwrap_or(true)
}

#[tauri::command]
fn set_ad_blocking_enabled(enabled: bool, app: tauri::AppHandle) -> bool {
    let config_path = get_config_path(&app);
    let mut config = load_config(&config_path);
    config.insert("adBlockingEnabled".to_string(), serde_json::Value::Bool(enabled));
    save_config(&config_path, &config);
    true
}

fn main() {
    tauri::Builder::default()
        .setup(|app| {
            // Onboarding check will be handled by frontend
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            get_browser_engines,
            get_selected_engine,
            set_selected_engine,
            has_completed_onboarding,
            complete_onboarding,
            get_ad_blocking_enabled,
            set_ad_blocking_enabled,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
