use std::env;
use std::fs;
use std::io::Write;
use std::path::PathBuf;

/// Minimal build script used only to ensure a valid PNG icon exists for Tauri's
/// `generate_context!` macro. We deliberately avoid generating a Windows
/// resource/ICO because RC.EXE is very strict and has been failing with
/// `old DIB` errors.
fn ensure_png_icon() {
    let manifest_dir = env::var("CARGO_MANIFEST_DIR").unwrap_or_else(|_| ".".into());
    let mut icon_dir = PathBuf::from(manifest_dir);
    icon_dir.push("icons");
    if let Err(_) = fs::create_dir_all(&icon_dir) {
        return;
    }

    let mut icon_path = icon_dir.clone();
    icon_path.push("icon.png");

    if icon_path.exists() {
        return;
    }

    // 1x1 transparent PNG (standard, valid PNG header & chunks)
    const ICON_PNG: &[u8] = &[
        0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A,
        0x00, 0x00, 0x00, 0x0D, 0x49, 0x48, 0x44, 0x52,
        0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01,
        0x08, 0x06, 0x00, 0x00, 0x00, 0x1F, 0x15, 0xC4,
        0x89, 0x00, 0x00, 0x00, 0x0A, 0x49, 0x44, 0x41,
        0x54, 0x78, 0x9C, 0x63, 0x00, 0x01, 0x00, 0x00,
        0x05, 0x00, 0x01, 0x0D, 0x0A, 0x2D, 0xB4, 0x00,
        0x00, 0x00, 0x00, 0x49, 0x45, 0x4E, 0x44, 0xAE,
        0x42, 0x60, 0x82,
    ];

    if let Ok(mut file) = fs::File::create(&icon_path) {
        let _ = file.write_all(ICON_PNG);
    }
}

fn main() {
    // Ensure PNG icon exists; avoid tauri_build/tauri-winres entirely.
    ensure_png_icon();
}
