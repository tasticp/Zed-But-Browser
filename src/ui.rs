/// UI module for the Zed Browser
/// Implements a minimalist, Zed-inspired interface with sidebar and main content area

use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct UIState {
    pub sidebar_width: f32,
    pub show_sidebar: bool,
    pub current_url: String,
}

impl Default for UIState {
    fn default() -> Self {
        Self {
            sidebar_width: 250.0,
            show_sidebar: true,
            current_url: String::from("https://www.example.com"),
        }
    }
}

#[cfg(feature = "gui")]
pub fn render_ui(state: &mut UIState) {
    // This would use egui to render the full UI
    // For now, it's a placeholder for the GUI implementation
    println!(" Rendering UI with URL: {}", state.current_url);
}
