/// Minimalist UI state - kept lightweight

use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct UIState {
    pub sidebar_visible: bool,
    pub sidebar_width: f32,
    pub dark_mode: bool,
    pub theme: String,
}

impl Default for UIState {
    fn default() -> Self {
        Self {
            sidebar_visible: true, // Visible by default for Zen/Arc-like experience
            sidebar_width: 240.0,
            dark_mode: true, // Dark mode by default (Zed-inspired)
            theme: "dark".to_string(),
        }
    }
}

impl UIState {
    pub fn toggle_sidebar(&mut self) {
        self.sidebar_visible = !self.sidebar_visible;
    }

    pub fn set_sidebar_visible(&mut self, visible: bool) {
        self.sidebar_visible = visible;
    }

    pub fn to_json(&self) -> String {
        serde_json::to_string(self).unwrap_or_else(|_| "{}".to_string())
    }
}
