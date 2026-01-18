# Zed Browser

A minimal web browser built with [Tauri](https://tauri.app/), featuring a Zed-inspired dark theme design.

## Features

- Zed-inspired dark color scheme
- Multi-tab browsing with tab persistence
- Navigation controls (Back, Forward, Reload)
- Smart URL bar (auto-detects URLs vs search queries)
- Start page with web search and quick shortcuts
- Bookmarks and browsing history
- Downloads management
- Keyboard shortcuts:
  - `F5` - Reload page
  - `F6` or `Ctrl+L` - Focus URL bar
  - `Ctrl+T` - New tab
  - `Ctrl+W` - Close tab
  - `Ctrl+D` - Bookmark current page
  - `Ctrl+B` - Toggle sidebar
  - `F12` - Developer tools

## Installation

### Prerequisites

- [Rust](https://rustup.rs/) (latest stable)
- [Node.js](https://nodejs.org/) (v18 or later)
- [Python](https://python.org/) (for dev server)

### Setup

1. Install dependencies:

```bash
npm install
```

2. Install Tauri CLI:

```bash
cargo install tauri-cli
```

3. Run development build:

```bash
cargo tauri dev
```

## Build for Production

```bash
cargo tauri build
```

Output will be in `src-tauri/target/release/bundle/`.

## Tech Stack

- **Frontend**: HTML, CSS, JavaScript (ES2021)
- **Backend**: Rust + Tauri 2.0
- **Runtime**: WebView2 (Windows), WebKit (macOS/Linux)
- **Performance**: Optimized DOM rendering with throttling and document fragments

## License

MIT
