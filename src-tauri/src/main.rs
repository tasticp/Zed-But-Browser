// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use serde::{Deserialize, Serialize};

mod adblock;
mod browser;
mod search_index;

#[derive(Debug, Serialize, Deserialize, Clone)]
struct BrowserEngine {
    id: String,
    name: String,
    user_agent: String,
    description: String,
}

impl BrowserEngine {
    fn all() -> Vec<BrowserEngine> {
        vec![
            BrowserEngine {
                id: "chromium".to_string(),
                name: "Chromium".to_string(),
                user_agent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36".to_string(),
                description: "Fast and modern, used by Chrome and Edge".to_string(),
            },
            BrowserEngine {
                id: "firefox".to_string(),
                name: "Firefox (Gecko)".to_string(),
                user_agent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:121.0) Gecko/20100101 Firefox/121.0".to_string(),
                description: "Privacy-focused, used by Firefox".to_string(),
            },
            BrowserEngine {
                id: "webkit".to_string(),
                name: "WebKit".to_string(),
                user_agent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Safari/605.1.15".to_string(),
                description: "Lightweight, used by Safari".to_string(),
            },
            BrowserEngine {
                id: "edge".to_string(),
                name: "Microsoft Edge".to_string(),
                user_agent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 Edg/120.0.0.0".to_string(),
                description: "Microsoft Edge engine".to_string(),
            },
        ]
    }
}

#[tauri::command]
fn get_browser_engines() -> Vec<BrowserEngine> {
    BrowserEngine::all()
}

#[tauri::command]
fn has_completed_onboarding(app: tauri::AppHandle) -> bool {
    let state = browser::load_state(&app);
    state.onboarding_completed.unwrap_or(false)
}

#[tauri::command]
fn complete_onboarding(app: tauri::AppHandle) -> Result<bool, String> {
    let mut state = browser::load_state(&app);
    state.onboarding_completed = Some(true);
    browser::save_state(&app, &state)?;
    Ok(true)
}

fn main() {
    tauri::Builder::default()
        .setup(|_app| {
            // Onboarding check will be handled by frontend
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            get_browser_engines,
            has_completed_onboarding,
            complete_onboarding,
            // Browser module commands (lightweight state & tab/bookmark APIs)
            browser::list_tabs,
            browser::open_tab,
            browser::close_tab,
            browser::switch_tab,
            browser::navigate_tab,
            browser::tab_go_back,
            browser::tab_go_forward,
            browser::get_active_tab,
            browser::list_bookmark_folders,
            browser::add_bookmark,
            browser::remove_bookmark,
            browser::toggle_folder,
            browser::get_preferences,
            browser::get_selected_engine,
            browser::get_ad_blocking_enabled,
            browser::set_selected_engine,
            browser::set_ad_blocking_enabled,
            browser::set_center_search_on_new_tab,
            browser::get_center_search_enabled,
            browser::build_search_url,
            browser::ensure_at_least_one_tab,
            // Adblock commands
            adblock::should_block_url,
            adblock::reload_rules,
            adblock::add_rule,
            adblock::remove_rule,
            adblock::list_rules,
            adblock::reset_to_default_rules,
            // Search index commands
            search_index::index_page,
            search_index::remove_document,
            search_index::search,
            search_index::get_document,
            search_index::rebuild_index,
            search_index::index_count,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
