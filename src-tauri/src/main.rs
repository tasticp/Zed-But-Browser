#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use tauri::Manager;

#[tauri::command]
async fn open_url(url: String) -> Result<(), String> {
    if url.starts_with("http://") || url.starts_with("https://") {
        tauri_plugin_shell::shell::open(&tauri_plugin_shell::ShellOpenArgs::url(url))
            .map_err(|e: Box<dyn std::error::Error>| e.to_string())?;
    }
    Ok(())
}

fn main() {
    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .invoke_handler(tauri::generate_handler![open_url])
        .setup(|app| {
            #[cfg(debug_assertions)]
            {
                let window = app.get_webview_window("main");
                if let Some(win) = window {
                    let _ = win.open_devtools();
                }
            }
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}