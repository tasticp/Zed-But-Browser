/// Sidebar management for file/folder navigation
/// Inspired by Zen Browser and Arc browser folder structures

use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SidebarItem {
    pub id: String,
    pub name: String,
    pub item_type: SidebarItemType,
    pub url: Option<String>,
    pub children: Vec<SidebarItem>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum SidebarItemType {
    Folder,
    Link,
    Bookmark,
    Separator,
}

pub struct SidebarManager {
    pub items: Vec<SidebarItem>,
}

impl Default for SidebarManager {
    fn default() -> Self {
        Self::new()
    }
}

impl SidebarManager {
    pub fn new() -> Self {
        Self {
            items: Self::default_items(),
        }
    }

    fn default_items() -> Vec<SidebarItem> {
        vec![
            SidebarItem {
                id: "home".to_string(),
                name: " Home".to_string(),
                item_type: SidebarItemType::Link,
                url: Some("https://www.example.com".to_string()),
                children: vec![],
            },
            SidebarItem {
                id: "bookmarks".to_string(),
                name: " Bookmarks".to_string(),
                item_type: SidebarItemType::Folder,
                url: None,
                children: vec![
                    SidebarItem {
                        id: "github".to_string(),
                        name: "GitHub".to_string(),
                        item_type: SidebarItemType::Link,
                        url: Some("https://github.com".to_string()),
                        children: vec![],
                    },
                    SidebarItem {
                        id: "rust".to_string(),
                        name: "Rust Docs".to_string(),
                        item_type: SidebarItemType::Link,
                        url: Some("https://doc.rust-lang.org".to_string()),
                        children: vec![],
                    },
                ],
            },
            SidebarItem {
                id: "work".to_string(),
                name: " Work".to_string(),
                item_type: SidebarItemType::Folder,
                url: None,
                children: vec![
                    SidebarItem {
                        id: "projects".to_string(),
                        name: "Projects".to_string(),
                        item_type: SidebarItemType::Link,
                        url: Some("https://github.com/tasks".to_string()),
                        children: vec![],
                    },
                ],
            },
        ]
    }

    pub fn add_item(&mut self, item: SidebarItem) {
        self.items.push(item);
    }

    pub fn remove_item(&mut self, id: &str) {
        self.items.retain(|item| item.id != id);
    }

    pub fn find_item(&self, id: &str) -> Option<&SidebarItem> {
        Self::find_recursive(&self.items, id)
    }

    fn find_recursive(items: &[SidebarItem], id: &str) -> Option<&SidebarItem> {
        for item in items {
            if item.id == id {
                return Some(item);
            }
            if let Some(found) = Self::find_recursive(&item.children, id) {
                return Some(found);
            }
        }
        None
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_sidebar_creation() {
        let sidebar = SidebarManager::new();
        assert!(!sidebar.items.is_empty());
    }

    #[test]
    fn test_find_item() {
        let sidebar = SidebarManager::new();
        let home = sidebar.find_item("home");
        assert!(home.is_some());
    }
}
