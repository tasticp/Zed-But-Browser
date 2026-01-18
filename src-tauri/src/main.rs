// Prevents additional console messages in some environments
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use tauri::Manager;
use tauri_plugin_opener::OpenerExt;

#[tauri::command]
async fn open_url(url: String, app_handle: tauri::AppHandle) -> Result<(), String> {
    if url.trim().is_empty() {
        return Err("URL cannot be empty".to_string());
    }
    
    // Basic security check
    let lower_url = url.to_lowercase();
    let dangerous_schemes = [
        "javascript:", "data:", "vbscript:", "file:", "ftp:",
        "chrome:", "chrome-extension:", "moz-extension:", "edge:",
        "mailto:", "tel:", "sms:"
    ];
    
    for scheme in &dangerous_schemes {
        if lower_url.starts_with(scheme) {
            return Err(format!("URL scheme '{}' is not allowed", scheme));
        }
    }
    
    let final_url = if url.starts_with("http://") || url.starts_with("https://") {
        url
    } else {
        format!("https://{}", url)
    };
    
    // Open URL in default browser
    match app_handle.opener().open_url(&final_url, None::<&str>) {
        Ok(_) => Ok(()),
        Err(e) => Err(e.to_string()),
    }
}

fn main() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![open_url])
        .setup(|app| {
            #[cfg(debug_assertions)]
            {
                let window = app.get_webview_window("main");
                if let Some(win) = window {
                    win.open_devtools();
                }
            }
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}