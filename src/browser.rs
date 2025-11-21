/// Lightweight browser core with efficient memory management

use serde::{Deserialize, Serialize};
use std::collections::VecDeque;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Tab {
    pub id: u32,
    pub url: String,
    pub title: String,
    pub history: VecDeque<String>, // Efficient deque for history
    pub history_index: usize,
}

impl Tab {
    pub fn new(id: u32, url: String) -> Self {
        let mut history = VecDeque::with_capacity(50); // Pre-allocate for efficiency
        history.push_back(url.clone());
        
        Self {
            id,
            url,
            title: String::new(),
            history,
            history_index: 0,
        }
    }

    pub fn navigate(&mut self, url: String) {
        // Truncate history if we're not at the end
        if self.history_index < self.history.len() - 1 {
            self.history.truncate(self.history_index + 1);
        }
        
        // Limit history size for memory efficiency
        if self.history.len() >= 100 {
            self.history.pop_front();
            self.history_index -= 1;
        }
        
        self.history.push_back(url.clone());
        self.history_index = self.history.len() - 1;
        self.url = url;
    }

    pub fn can_go_back(&self) -> bool {
        self.history_index > 0
    }

    pub fn can_go_forward(&self) -> bool {
        self.history_index < self.history.len() - 1
    }

    pub fn go_back(&mut self) -> Option<&str> {
        if self.can_go_back() {
            self.history_index -= 1;
            self.url = self.history[self.history_index].clone();
            Some(&self.url)
        } else {
            None
        }
    }

    pub fn go_forward(&mut self) -> Option<&str> {
        if self.can_go_forward() {
            self.history_index += 1;
            self.url = self.history[self.history_index].clone();
            Some(&self.url)
        } else {
            None
        }
    }
}

/// Efficient browser state with minimal memory footprint
pub struct Browser {
    tabs: Vec<Tab>,
    active_tab_id: u32,
    next_tab_id: u32,
}

impl Browser {
    pub fn new() -> Self {
        let mut browser = Self {
            tabs: Vec::with_capacity(10), // Pre-allocate for efficiency
            active_tab_id: 0,
            next_tab_id: 1,
        };
        
        // Create initial tab
        let initial_tab = Tab::new(0, "about:blank".to_string());
        browser.tabs.push(initial_tab);
        
        browser
    }

    pub fn add_tab(&mut self, url: String) -> u32 {
        let id = self.next_tab_id;
        self.next_tab_id += 1;
        
        let tab = Tab::new(id, url);
        self.tabs.push(tab);
        self.active_tab_id = id;
        
        id
    }

    pub fn close_tab(&mut self, id: u32) -> bool {
        if self.tabs.len() <= 1 {
            return false; // Can't close the last tab
        }

        if let Some(pos) = self.tabs.iter().position(|t| t.id == id) {
            self.tabs.remove(pos);
            
            // Switch to another tab if needed
            if self.active_tab_id == id {
                self.active_tab_id = self.tabs.first().map(|t| t.id).unwrap_or(0);
            }
            
            true
        } else {
            false
        }
    }

    pub fn get_active_tab(&self) -> Option<&Tab> {
        self.tabs.iter().find(|t| t.id == self.active_tab_id)
    }

    pub fn get_active_tab_mut(&mut self) -> Option<&mut Tab> {
        self.tabs.iter_mut().find(|t| t.id == self.active_tab_id)
    }

    pub fn set_active_tab(&mut self, id: u32) -> bool {
        if self.tabs.iter().any(|t| t.id == id) {
            self.active_tab_id = id;
            true
        } else {
            false
        }
    }

    pub fn tab_count(&self) -> usize {
        self.tabs.len()
    }
}

impl Default for Browser {
    fn default() -> Self {
        Self::new()
    }
}
