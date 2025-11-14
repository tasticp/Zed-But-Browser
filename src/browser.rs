/// Browser functionality and state management

use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct BrowserTab {
    pub id: String,
    pub title: String,
    pub url: String,
    pub can_go_back: bool,
    pub can_go_forward: bool,
}

pub struct BrowserState {
    pub tabs: Vec<BrowserTab>,
    pub active_tab_index: usize,
}

impl Default for BrowserState {
    fn default() -> Self {
        Self::new()
    }
}

impl BrowserState {
    pub fn new() -> Self {
        let mut tabs = vec![];
        tabs.push(BrowserTab {
            id: uuid::Uuid::new_v4().to_string(),
            title: "New Tab".to_string(),
            url: "https://www.example.com".to_string(),
            can_go_back: false,
            can_go_forward: false,
        });

        Self {
            tabs,
            active_tab_index: 0,
        }
    }

    pub fn add_tab(&mut self, url: String) {
        let tab = BrowserTab {
            id: uuid::Uuid::new_v4().to_string(),
            title: "New Tab".to_string(),
            url,
            can_go_back: false,
            can_go_forward: false,
        };
        self.tabs.push(tab);
        self.active_tab_index = self.tabs.len() - 1;
    }

    pub fn close_tab(&mut self, index: usize) {
        if index < self.tabs.len() {
            self.tabs.remove(index);
            if self.active_tab_index >= self.tabs.len() && self.active_tab_index > 0 {
                self.active_tab_index -= 1;
            }
        }
    }

    pub fn get_active_tab(&self) -> Option<&BrowserTab> {
        self.tabs.get(self.active_tab_index)
    }

    pub fn get_active_tab_mut(&mut self) -> Option<&mut BrowserTab> {
        self.tabs.get_mut(self.active_tab_index)
    }

    pub fn navigate(&mut self, url: String) {
        if let Some(tab) = self.get_active_tab_mut() {
            tab.url = url;
            tab.title = "Loading...".to_string();
        }
    }
}
