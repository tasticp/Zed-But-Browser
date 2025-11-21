mod browser;
mod ui;

use browser::Browser;
use std::path::PathBuf;
use wry::{
    application::{
        event::{Event, WindowEvent},
        event_loop::{ControlFlow, EventLoop},
        window::WindowBuilder,
    },
    webview::WebViewBuilder,
};

fn main() -> wry::Result<()> {
    // Initialize browser state
    let _browser = Browser::new();
    
    // Create event loop
    let event_loop = EventLoop::new();
    
    // Get HTML file path
    let html_path = get_html_path();
    
    // Create window with minimal configuration
    let window = WindowBuilder::new()
        .with_title("Zed Browser")
        .with_inner_size(wry::application::dpi::LogicalSize::new(1280, 720))
        .with_min_inner_size(wry::application::dpi::LogicalSize::new(800, 600))
        .build(&event_loop)?;

    // Create webview
    let _webview = WebViewBuilder::new(window)?
        .with_url(&html_path)?
        .with_devtools(true)
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
