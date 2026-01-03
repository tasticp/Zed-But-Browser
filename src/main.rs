mod browser;
mod ui;

use browser::{BookmarkManager, Browser};
use std::sync::{Arc, Mutex};
use ui::UIState;
use wry::{
    application::{
        event::{Event, WindowEvent},
        event_loop::{ControlFlow, EventLoop},
        window::WindowBuilder,
    },
    webview::WebViewBuilder,
};

fn main() -> wry::Result<()> {
    // Initialize browser state (prepared for future IPC integration)
    let _browser = Arc::new(Mutex::new(Browser::new()));
    let _bookmark_manager = Arc::new(Mutex::new(BookmarkManager::new()));
    let _ui_state = Arc::new(Mutex::new(UIState::default()));

    // Create event loop
    let event_loop = EventLoop::new();

    // Get HTML file path
    let html_path = get_html_path();

    // Create window with Zed-inspired minimal configuration
    let window = WindowBuilder::new()
        .with_title("Zed Browser")
        .with_inner_size(wry::application::dpi::LogicalSize::new(1400, 900))
        .with_min_inner_size(wry::application::dpi::LogicalSize::new(800, 600))
        .build(&event_loop)?;

    // Create webview
    // Note: IPC integration and request-interception glue for wry can be added here.
    //
    // Below we register a lightweight IPC handler that the web content can use
    // to ask the native side about blocking decisions (e.g. ad-block checks).
    // The actual request interception (blocking network requests) is platform / webview
    // specific: use the platform's request hook to call into the adblock commands
    // exposed by the Tauri backend. This handler is a minimal glue point so the
    // frontend can ask the native process whether a URL should be blocked.
    //
    // For a production integration you should combine this with wry's request
    // interception APIs (custom protocol / resource loader hooks) and call the
    // adblock Tauri commands (e.g. `should_block_url`) from that interception hook.
    //
    // Keep this handler intentionally small to avoid pulling heavy logic into the UI thread.
    let _webview = WebViewBuilder::new(window)?
        .with_url(&html_path)?
        .with_devtools(true)
        .with_ipc_handler(|_window, payload| {
            // Expect simple messages in the form:
            // "shouldBlock:<url>" -> log/forward the query
            // The real blocking decision should be performed in the backend interception hook.
            if let Some(url) = payload.strip_prefix("shouldBlock:") {
                // For now just log the request. A request interceptor should call
                // the adblock commands registered in the Tauri backend and act accordingly.
                println!("IPC request to test blocking for URL: {}", url);
                // Example: in a real setup you might call back into the webview or
                // dispatch a message with the result. Keep this minimal here.
            } else {
                // Other IPC messages can be handled here.
                println!("IPC payload: {}", payload);
            }
        })
        .build()?;

    // Run event loop
    event_loop.run(move |event, _, control_flow| {
        *control_flow = ControlFlow::Wait;

        match event {
            Event::WindowEvent {
                event: WindowEvent::CloseRequested,
                ..
            } => {
                *control_flow = ControlFlow::Exit;
            }
            _ => {}
        }
    })
}

fn get_html_path() -> String {
    // Try to find the HTML file relative to the executable
    let possible_paths = vec![
        "public/index.html",
        "./public/index.html",
        "../public/index.html",
        "index.html",
    ];

    for path in possible_paths {
        if std::path::Path::new(path).exists() {
            if let Ok(canonical) = std::fs::canonicalize(path) {
                #[cfg(windows)]
                {
                    return format!("file:///{}", canonical.to_string_lossy().replace('\\', "/"));
                }
                #[cfg(not(windows))]
                {
                    return format!("file://{}", canonical.to_string_lossy());
                }
            }
        }
    }

    // Fallback to a minimal HTML embedded
    "data:text/html,<!DOCTYPE html><html><head><meta charset='utf-8'><title>Zed Browser</title><style>body{margin:0;font-family:system-ui;background:#0d1117;color:#c9d1d9;display:flex;flex-direction:column;height:100vh}#toolbar{height:48px;background:#161b22;border-bottom:1px solid #30363d;display:flex;align-items:center;padding:0 8px;gap:6px}.btn{height:32px;min-width:32px;padding:0 10px;background:#21262d;border:1px solid #30363d;border-radius:6px;color:#c9d1d9;cursor:pointer;font-size:13px}.btn:hover{background:#30363d}#urlbar{flex:1;height:32px;background:#0d1117;border:1px solid #30363d;border-radius:6px;padding:0 12px;color:#c9d1d9;font-size:13px;outline:none}#urlbar:focus{border-color:#58a6ff}webview{flex:1;border:none}</style></head><body><div id='toolbar'><button class='btn' onclick='history.back()'>←</button><button class='btn' onclick='history.forward()'>→</button><button class='btn' onclick='location.reload()'>↻</button><input type='text' id='urlbar' placeholder='Enter URL...' onkeydown='if(event.key===\"Enter\"){let u=event.target.value;if(!u.startsWith(\"http\"))u=\"https://\"+u;window.location.href=u}'/></div><webview id='wv' src='about:blank' style='flex:1'></webview></body></html>".to_string()
}
