//! Browser runtime state and Tauri commands for tab/bookmark/search management.
//!
//! This module provides a lightweight, file-backed browser state intended to be used
//! by the Tauri backend. It exposes commands for managing tabs, simple navigation,
//! bookmarks, and constructing search URLs (configurable engines). The state is
//! intentionally small and uses JSON files under the app data directory to keep
//! memory and runtime footprint minimal.

use serde::{Deserialize, Serialize};
use std::{
    collections::HashMap,
    fs,
    io::{Read, Write},
    path::PathBuf,
    time::{SystemTime, UNIX_EPOCH},
};
use tauri::AppHandle;

/// Representation of a single tab. Keep it compact for memory efficiency.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TabInfo {
    pub id: u32,
    pub url: String,
    pub title: String,
    pub history: Vec<String>,
    pub history_index: usize,
    pub created_at: u64,
}

impl TabInfo {
    pub fn new(id: u32, url: String) -> Self {
        let now = SystemTime::now()
            .duration_since(UNIX_EPOCH)
            .map(|d| d.as_secs())
            .unwrap_or(0);
        Self {
            id,
            url: url.clone(),
            title: String::new(),
            history: vec![url],
            history_index: 0,
            created_at: now,
        }
    }

    /// Navigate to a URL in this tab (append to history, trim if necessary).
    pub fn navigate(&mut self, url: String) {
        // If not at end, truncate forward history
        if self.history_index + 1 < self.history.len() {
            self.history.truncate(self.history_index + 1);
        }
        // Keep history bounded to avoid excessive memory use
        const MAX_HISTORY: usize = 100;
        if self.history.len() >= MAX_HISTORY {
            // remove front entries until we can push one more
            let to_remove = self.history.len() + 1 - MAX_HISTORY;
            self.history.drain(0..to_remove);
            // adjust history index
            if self.history_index >= to_remove {
                self.history_index -= to_remove;
            } else {
                self.history_index = 0;
            }
        }
        self.history.push(url.clone());
        self.history_index = self.history.len() - 1;
        self.url = url;
    }

    pub fn can_go_back(&self) -> bool {
        self.history_index > 0
    }
    pub fn can_go_forward(&self) -> bool {
        self.history_index + 1 < self.history.len()
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

/// Bookmark and folder structures
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Bookmark {
    pub name: String,
    pub url: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct BookmarkFolder {
    pub id: String,
    pub name: String,
    pub expanded: bool,
    pub bookmarks: Vec<Bookmark>,
}

/// Core persisted browser state (keeps it small).
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct BrowserState {
    pub tabs: Vec<TabInfo>,
    pub active_tab_id: u32,
    pub next_tab_id: u32,
    pub folders: HashMap<String, BookmarkFolder>,
    pub selected_engine: Option<String>,
    pub ad_blocking_enabled: Option<bool>,
    /// Whether the omnibox/search should appear centered on new tabs.
    /// Stored as Option<bool> for forward compatibility with older state files.
    pub center_search_on_new_tab: Option<bool>,
}

impl BrowserState {
    pub fn new() -> Self {
        let mut folders = HashMap::new();
        folders.insert(
            "favorites".to_string(),
            BookmarkFolder {
                id: "favorites".to_string(),
                name: "Favorites".to_string(),
                expanded: true,
                bookmarks: vec![
                    Bookmark {
                        name: "GitHub".to_string(),
                        url: "https://github.com".to_string(),
                    },
                    Bookmark {
                        name: "Zed Editor".to_string(),
                        url: "https://zed.dev".to_string(),
                    },
                ],
            },
        );

        folders.insert(
            "work".to_string(),
            BookmarkFolder {
                id: "work".to_string(),
                name: "Work".to_string(),
                expanded: false,
                bookmarks: vec![Bookmark {
                    name: "Stack Overflow".to_string(),
                    url: "https://stackoverflow.com".to_string(),
                }],
            },
        );

        // Start with a single about:blank tab with id 0
        let initial_tab = TabInfo::new(0, "about:blank".to_string());

        Self {
            tabs: vec![initial_tab],
            active_tab_id: 0,
            next_tab_id: 1,
            folders,
            selected_engine: Some("chromium".to_string()),
            ad_blocking_enabled: Some(true),
            // Default: show centered search on new tab
            center_search_on_new_tab: Some(true),
        }
    }

    pub fn tab_count(&self) -> usize {
        self.tabs.len()
    }

    pub fn find_tab_pos(&self, id: u32) -> Option<usize> {
        self.tabs.iter().position(|t| t.id == id)
    }
}

/// Return a path under the app's app_data_dir to store the browser state.
fn browser_state_path(app: &AppHandle) -> PathBuf {
    let app_data_dir = app
        .path()
        .app_data_dir()
        .expect("Failed to get app data directory");
    if !app_data_dir.exists() {
        fs::create_dir_all(&app_data_dir).ok();
    }
    app_data_dir.join("browser_state.json")
}

/// Load state from disk. If missing or invalid, return a default state.
fn load_state(app: &AppHandle) -> BrowserState {
    let config_path = browser_state_path(app);
    if config_path.exists() {
        match fs::File::open(&config_path) {
            Ok(mut f) => {
                let mut s = String::new();
                if f.read_to_string(&mut s).is_ok() {
                    if let Ok(state) = serde_json::from_str::<BrowserState>(&s) {
                        return state;
                    }
                }
            }
            Err(_) => {}
        }
    }
    BrowserState::new()
}

/// Persist state to disk. Swaps atomically by writing to a temp file then renaming.
fn save_state(app: &AppHandle, state: &BrowserState) -> Result<(), String> {
    let config_path = browser_state_path(app);
    let tmp_path = config_path.with_extension("tmp");
    match serde_json::to_string_pretty(state) {
        Ok(serialized) => {
            match fs::File::create(&tmp_path) {
                Ok(mut f) => {
                    if f.write_all(serialized.as_bytes()).is_err() {
                        return Err("Failed to write to temp file".to_string());
                    }
                    // atomic rename where supported
                    if fs::rename(&tmp_path, &config_path).is_err() {
                        // fallback: try to remove and write
                        if fs::write(&config_path, serialized.as_bytes()).is_err() {
                            return Err("Failed to write state file".to_string());
                        }
                    }
                    Ok(())
                }
                Err(_) => Err("Failed to create temp file".to_string()),
            }
        }
        Err(_) => Err("Failed to serialize state".to_string()),
    }
}

/// Return the list of tabs (lightweight representation).
#[tauri::command]
pub fn list_tabs(app: AppHandle) -> Vec<TabInfo> {
    let state = load_state(&app);
    state.tabs
}

/// Open a new tab with the given URL. Returns the new tab id.
#[tauri::command]
pub fn open_tab(app: AppHandle, url: String) -> Result<u32, String> {
    let mut state = load_state(&app);
    let id = state.next_tab_id;
    state.next_tab_id = state.next_tab_id.saturating_add(1);
    let tab = TabInfo::new(id, url);
    state.tabs.push(tab);
    state.active_tab_id = id;
    save_state(&app, &state)?;
    Ok(id)
}

/// Close a tab. Returns true if closed.
#[tauri::command]
pub fn close_tab(app: AppHandle, id: u32) -> Result<bool, String> {
    let mut state = load_state(&app);
    if state.tabs.len() <= 1 {
        // never close the last tab
        return Ok(false);
    }
    if let Some(pos) = state.find_tab_pos(id) {
        state.tabs.remove(pos);
        if state.active_tab_id == id {
            state.active_tab_id = state.tabs.first().map(|t| t.id).unwrap_or(0);
        }
        save_state(&app, &state)?;
        Ok(true)
    } else {
        Ok(false)
    }
}

/// Switch active tab. Returns true if the tab existed and was selected.
#[tauri::command]
pub fn switch_tab(app: AppHandle, id: u32) -> Result<bool, String> {
    let mut state = load_state(&app);
    if state.find_tab_pos(id).is_some() {
        state.active_tab_id = id;
        save_state(&app, &state)?;
        Ok(true)
    } else {
        Ok(false)
    }
}

/// Navigate a tab (add to history and set URL). Returns true if tab found.
#[tauri::command]
pub fn navigate_tab(app: AppHandle, id: u32, url: String) -> Result<bool, String> {
    let mut state = load_state(&app);
    if let Some(pos) = state.find_tab_pos(id) {
        if let Some(tab) = state.tabs.get_mut(pos) {
            tab.navigate(url);
            save_state(&app, &state)?;
            return Ok(true);
        }
    }
    Ok(false)
}

/// Go back in a tab's history.
#[tauri::command]
pub fn tab_go_back(app: AppHandle, id: u32) -> Result<Option<String>, String> {
    let mut state = load_state(&app);
    if let Some(pos) = state.find_tab_pos(id) {
        if let Some(tab) = state.tabs.get_mut(pos) {
            if tab.can_go_back() {
                tab.go_back();
                let url = tab.url.clone();
                save_state(&app, &state)?;
                return Ok(Some(url));
            }
        }
    }
    Ok(None)
}

/// Go forward in a tab's history.
#[tauri::command]
pub fn tab_go_forward(app: AppHandle, id: u32) -> Result<Option<String>, String> {
    let mut state = load_state(&app);
    if let Some(pos) = state.find_tab_pos(id) {
        if let Some(tab) = state.tabs.get_mut(pos) {
            if tab.can_go_forward() {
                tab.go_forward();
                let url = tab.url.clone();
                save_state(&app, &state)?;
                return Ok(Some(url));
            }
        }
    }
    Ok(None)
}

/// Get the active tab info.
#[tauri::command]
pub fn get_active_tab(app: AppHandle) -> Option<TabInfo> {
    let state = load_state(&app);
    state.tabs.into_iter().find(|t| t.id == state.active_tab_id)
}

/// List bookmark folders
#[tauri::command]
pub fn list_bookmark_folders(app: AppHandle) -> Vec<BookmarkFolder> {
    let state = load_state(&app);
    state.folders.values().cloned().collect()
}

/// Add a bookmark to a folder. Returns true on success.
#[tauri::command]
pub fn add_bookmark(app: AppHandle, folder_id: String, bookmark: Bookmark) -> Result<bool, String> {
    let mut state = load_state(&app);
    if let Some(folder) = state.folders.get_mut(&folder_id) {
        folder.bookmarks.push(bookmark);
        save_state(&app, &state)?;
        return Ok(true);
    }
    Err("Folder not found".to_string())
}

/// Remove a bookmark by URL. Returns true if removed.
#[tauri::command]
pub fn remove_bookmark(
    app: AppHandle,
    folder_id: String,
    bookmark_url: String,
) -> Result<bool, String> {
    let mut state = load_state(&app);
    if let Some(folder) = state.folders.get_mut(&folder_id) {
        if let Some(pos) = folder.bookmarks.iter().position(|b| b.url == bookmark_url) {
            folder.bookmarks.remove(pos);
            save_state(&app, &state)?;
            return Ok(true);
        }
        return Ok(false);
    }
    Err("Folder not found".to_string())
}

/// Toggle folder expanded state.
#[tauri::command]
pub fn toggle_folder(app: AppHandle, folder_id: String) -> Result<bool, String> {
    let mut state = load_state(&app);
    if let Some(folder) = state.folders.get_mut(&folder_id) {
        folder.expanded = !folder.expanded;
        save_state(&app, &state)?;
        return Ok(folder.expanded);
    }
    Err("Folder not found".to_string())
}

/// Get engine selection and ad-blocking preference.
#[tauri::command]
pub fn get_preferences(app: AppHandle) -> (Option<String>, Option<bool>, Option<bool>) {
    let state = load_state(&app);
    (
        state.selected_engine,
        state.ad_blocking_enabled,
        state.center_search_on_new_tab,
    )
}

/// Set selected engine.
#[tauri::command]
pub fn set_selected_engine(app: AppHandle, engine_id: String) -> Result<bool, String> {
    let mut state = load_state(&app);
    state.selected_engine = Some(engine_id);
    save_state(&app, &state)?;
    Ok(true)
}

/// Get/Set ad blocking preference.
#[tauri::command]
pub fn set_ad_blocking_enabled(app: AppHandle, enabled: bool) -> Result<bool, String> {
    let mut state = load_state(&app);
    state.ad_blocking_enabled = Some(enabled);
    save_state(&app, &state)?;
    Ok(true)
}

/// Set whether the omnibox/search should appear centered on new tabs.
/// This is persisted to the browser state so the frontend can read the value
/// and show the center-search UI when a new tab is opened.
#[tauri::command]
pub fn set_center_search_on_new_tab(app: AppHandle, enabled: bool) -> Result<bool, String> {
    let mut state = load_state(&app);
    state.center_search_on_new_tab = Some(enabled);
    save_state(&app, &state)?;
    Ok(true)
}

/// Build a search URL based on a selected engine or fallback. Keeps it minimal
/// (we store only engine id in state and create URLs here).
#[tauri::command]
pub fn build_search_url(app: AppHandle, query: String) -> String {
    let state = load_state(&app);
    let engine = state
        .selected_engine
        .as_deref()
        .unwrap_or("chromium")
        .to_lowercase();

    let encoded = urlencoding::encode(&query);

    match engine.as_str() {
        "duckduckgo" => format!("https://duckduckgo.com/?q={}", encoded),
        "bing" => format!("https://www.bing.com/search?q={}", encoded),
        "brave" => format!("https://search.brave.com/search?q={}", encoded),
        "bingnoredirect" => format!("https://www.bing.com/search?q={}&FORM=ANNTH1", encoded),
        // default to Google-like query
        _ => format!("https://www.google.com/search?q={}", encoded),
    }
}

/// Simple function to ensure there's always at least one tab (defensive).
#[tauri::command]
pub fn ensure_at_least_one_tab(app: AppHandle) -> Result<u32, String> {
    let mut state = load_state(&app);
    if state.tabs.is_empty() {
        let id = state.next_tab_id;
        state.next_tab_id = state.next_tab_id.saturating_add(1);
        state.tabs.push(TabInfo::new(id, "about:blank".to_string()));
        state.active_tab_id = id;
        save_state(&app, &state)?;
        Ok(id)
    } else {
        Ok(state.active_tab_id)
    }
}
