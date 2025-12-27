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
    #[allow(dead_code)] // Part of API, will be used when IPC is implemented
    pub fn toggle_sidebar(&mut self) {
        self.sidebar_visible = !self.sidebar_visible;
    }

    #[allow(dead_code)] // Part of API, will be used when IPC is implemented
    pub fn set_sidebar_visible(&mut self, visible: bool) {
        self.sidebar_visible = visible;
    }

    #[allow(dead_code)] // Part of API, will be used when IPC is implemented
    pub fn to_json(&self) -> String {
        serde_json::to_string(self).unwrap_or_else(|_| "{}".to_string())
    }
}
