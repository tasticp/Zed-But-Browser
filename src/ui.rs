/// Minimalist UI state - kept lightweight

#[derive(Debug, Clone)]
pub struct UIState {
    pub sidebar_visible: bool,
    pub sidebar_width: f32,
    pub dark_mode: bool,
}

impl Default for UIState {
    fn default() -> Self {
        Self {
            sidebar_visible: false, // Hidden by default for minimalism
            sidebar_width: 200.0,
            dark_mode: true, // Dark mode by default
        }
    }
}

impl UIState {
    pub fn toggle_sidebar(&mut self) {
        self.sidebar_visible = !self.sidebar_visible;
    }
}
