mod ui;
mod browser;
mod sidebar;

use log::info;

fn main() {
    env_logger::init();
    info!(" Starting Zed Browser...");

    // Initialize browser state
    let browser_state = browser::BrowserState::new();
    let sidebar_manager = sidebar::SidebarManager::new();
    let ui_state = ui::UIState::default();

    info!(" Browser state initialized");
    info!("  Active tab: {:?}", browser_state.get_active_tab());
    info!("  Sidebar items: {}", sidebar_manager.items.len());

    println!("\n Zed Browser v0.1.0");
    println!("  Current URL: {}", ui_state.current_url);
    println!("  Sidebar ready: {} items", sidebar_manager.items.len());
    println!("\n Features:");
    println!("   Minimalist UI inspired by Zed editor");
    println!("   Cross-platform (Windows/macOS/Linux)");
    println!("   Sidebar with folders & bookmarks");
    println!("   Tab management");
    println!("\n Next: implement egui + wry integration for full GUI");
}
