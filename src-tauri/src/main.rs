#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use tauri::{AppHandle, Manager, WebviewUrl, WindowUrl};

#[tauri::command]
async fn go_back(window: tauri::Window) -> Result<(), String> {
    let webview = window
        .get_webview_window("main")
        .ok_or("No webview found")?;
    webview.eval("window.history.back()").map_err(|e| e.to_string())
}

#[tauri::command]
async fn go_forward(window: tauri::Window) -> Result<(), String> {
    let webview = window
        .get_webview_window("main")
        .ok_or("No webview found")?;
    webview.eval("window.history.forward()").map_err(|e| e.to_string())
}

#[tauri::command]
async fn reload_page(window: tauri::Window) -> Result<(), String> {
    let webview = window
        .get_webview_window("main")
        .ok_or("No webview found")?;
    webview.eval("location.reload()").map_err(|e| e.to_string())
}

#[tauri::command]
async fn navigate(window: tauri::Window, url: String) -> Result<(), String> {
    let webview = window
        .get_webview_window("main")
        .ok_or("No webview found")?;
    let script = format!("window.location.href = '{}';", url.replace("'", "\\'"));
    webview.eval(&script).map_err(|e| e.to_string())
}

#[tauri::command]
async fn open_window(app: AppHandle) -> Result<(), String> {
    tauri::WebviewWindowBuilder::new(
        &app,
        "secondary",
        tauri::WebviewUrl::App("index.html".into())
    )
    .title("Zed Browser")
    .width(1200.0)
    .height(800.0)
    .min_width(800.0)
    .min_height(600.0)
    .resizable(true)
    .decorations(true)
    .build()
    .map_err(|e| e.to_string())?;
    Ok(())
}

#[tauri::command]
async fn toggle_devtools(window: tauri::Window) -> Result<(), String> {
    let webview = window
        .get_webview_window("main")
        .ok_or("No webview found")?;
    let _ = webview.open_devtools();
    Ok(())
}

fn main() {
    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .invoke_handler(tauri::generate_handler![
            go_back,
            go_forward,
            reload_page,
            navigate,
            open_window,
            toggle_devtools
        ])
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
