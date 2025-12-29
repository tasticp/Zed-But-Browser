use std::env;
use std::fs;
use std::io::Write;
use std::path::PathBuf;

/// Ensure both PNG and ICO icons exist. The ICO must be in a format that
/// Windows RC.EXE accepts (not "old DIB"). We use a simple 16-color format.
fn ensure_icons() {
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

    // Also create a minimal ICO file for Windows RC.EXE
    // Using a simple format that RC.EXE accepts (16-color, no compression)
    let mut ico_path = icon_dir.clone();
    ico_path.push("icon.ico");
    
    if !ico_path.exists() {
        // Generate a minimal valid 16x16 16-color ICO (most compatible with Windows RC)
        // Using a very simple 16-color format that RC.EXE should accept
        let mut ico = Vec::new();
        
        // ICO header
        ico.extend_from_slice(&[0x00, 0x00, 0x01, 0x00, 0x01, 0x00]);
        
        // Directory entry: 16x16, 16 colors (4-bit)
        ico.extend_from_slice(&[
            0x10, 0x10,       // 16x16
            0x10,             // 16 colors
            0x00,             // Reserved
            0x01, 0x00,       // Planes
            0x04, 0x00,       // 4 bits per pixel
            0xE8, 0x01, 0x00, 0x00, // Size (488 bytes)
            0x16, 0x00, 0x00, 0x00, // Offset (22 bytes)
        ]);
        
        // BMP header
        ico.extend_from_slice(&[
            0x42, 0x4D, 0xE8, 0x01, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x3E, 0x00, 0x00, 0x00,
        ]);
        
        // DIB header (40 bytes) - BITMAPINFOHEADER
        ico.extend_from_slice(&[
            0x28, 0x00, 0x00, 0x00, // Header size (40)
            0x10, 0x00, 0x00, 0x00, // Width (16)
            0x20, 0x00, 0x00, 0x00, // Height (32 = 16*2 for mask)
            0x01, 0x00,             // Planes
            0x04, 0x00,             // 4 bits per pixel
            0x00, 0x00, 0x00, 0x00, // Compression (none)
            0x00, 0x00, 0x00, 0x00, // Image size (can be 0 for uncompressed)
            0x00, 0x00, 0x00, 0x00, // X res
            0x00, 0x00, 0x00, 0x00, // Y res
            0x10, 0x00, 0x00, 0x00, // Colors used (16)
            0x00, 0x00, 0x00, 0x00, // Important colors
        ]);
        
        // Color palette: 16 entries * 4 bytes = 64 bytes (grayscale)
        for i in 0u8..=15 {
            let gray = i * 17; // 0, 17, 34, ..., 255
            ico.extend_from_slice(&[gray, gray, gray, 0x00]);
        }
        
        // XOR mask: 16x16 pixels, 4 bits per pixel = 128 bytes
        // Fill with index 0 (black)
        ico.resize(ico.len() + 128, 0x00);
        
        // AND mask: 16x16/8 = 32 bytes
        ico.resize(ico.len() + 32, 0x00);

        if let Ok(mut file) = fs::File::create(&ico_path) {
            let _ = file.write_all(&ico);
        }
    }
}

fn main() {
    // Ensure both PNG and ICO icons exist before calling tauri_build
    ensure_icons();
    
    // Call tauri_build to set up runtime context (required for Tauri 2)
    tauri_build::build()
}
