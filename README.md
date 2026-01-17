# Zed Inspired Browser

> A modern, ultra-lightweight browser built with **Rust and Tauri** that uses your system's native WebView. Inspired by the Zed editor UI.

## 📚 Documentation Hub

Quick navigation to all guides:

| Topic | Purpose |
|-------|---------|
| **[📖 About](./ABOUT.md)** | What is this project? Features, architecture, and philosophy |
| **[📦 Installation](./INSTALLATION.md)** | Setup guide for Windows, macOS, and Linux |
| **[⌨️ Shortcuts](./SHORTCUTS.md)** | Keyboard bindings and pro tips |
| **[🔧 Development](./README.md#development)** | Contributing, building, and extending |

## Features

**Key highlights:**
- 🎨 Zed-inspired sidebar with breadcrumb tabs
- 🚀 Ultra-lightweight Rust + Tauri with system WebView (no bundled Chromium)
- 💾 Memory-optimized single-WebView across all tabs
- 🛡️ Integrated ad-blocking with runtime rule management
- 🔍 Local full-text search for offline page indexing
- 🌐 Cross-platform: Windows, macOS, Linux
- ⌨️ **[Learn keyboard shortcuts →](./SHORTCUTS.md)**

See **[📖 About](./ABOUT.md)** for detailed feature comparison and architecture overview.

## Installation & Setup

**👉 [Full installation guide →](./INSTALLATION.md)**

### Quick start (all platforms)

```bash
# Install dependencies
bun install
# or: npm install

# Start development
bun run dev
# or: npm run dev
```

### Build for production

```bash
bun run build
# or: npm run build
```

### Requirements

- Rust (stable) — install via [rustup](https://rustup.rs)
- Node.js or Bun
- Platform-specific build tools:
  - **Windows**: Visual Studio Build Tools + WebView2 runtime
  - **macOS**: Xcode Command Line Tools
  - **Linux**: GCC/Clang + WebView development libraries

See [INSTALLATION.md](./INSTALLATION.md) for detailed setup instructions per platform.

## Development

### Architecture

- **Backend**: Tauri v2.9.5 with Rust core handling state, persistence, and commands
- **Frontend**: Vanilla JavaScript with localStorage persistence
- **Build**: Cargo with target directory external to OneDrive (avoids file locks)
- **Dev Server**: Python HTTP server (port 3000) for hot-reload

### Key files

- `src-tauri/src/main.rs` — Tauri window setup and command routing
- `src-tauri/Cargo.toml` — Rust dependencies and build configuration
- `public/index.html` — UI markup with sidebar and breadcrumbs
- `public/nestedTabs.js` — Tab model, persistence, keyboard bindings
- `public/browser.js` — Tauri IPC glue and state management
- `public/styles.css` — Zed-inspired styling

### Run tests

```bash
cargo test --manifest-path src-tauri/Cargo.toml
```

### Commands

All core browser features are exposed as Tauri commands from the backend:
- Tab management: `list_tabs`, `open_tab`, `close_tab`, `switch_tab`, `navigate_tab`, `tab_go_back`, `tab_go_forward`
- Bookmarks: `list_bookmark_folders`, `add_bookmark`, `remove_bookmark`
- Ad-blocking: `list_rules`, `add_rule`, `remove_rule`, `reset_to_default_rules`, `should_block_url`
- Search: `index_page`, `search`, `rebuild_index`
- Configuration: `get_config`, `set_config`

See [ABOUT.md](./ABOUT.md) for detailed command documentation and architecture.

## Upstream Zed Sync

This repository keeps a copy of the [Zed editor](https://github.com/zed-industries/zed) in `vendor/zed` and syncs it automatically via GitHub Actions daily (or on-demand).

**Why?** To maintain an independent reference copy without pushing changes back to upstream.

**How:** The sync workflow clones the upstream repo, updates `vendor/zed`, and commits changes to this repository.

To manually sync:

```bash
# Unix/macOS
rm -rf tmp_zed
git clone --depth 1 https://github.com/zed-industries/zed.git tmp_zed
rsync -a --delete tmp_zed/ vendor/zed/
rm -rf vendor/zed/.git
git add vendor/zed
git commit -m "chore(sync): update vendor/zed from upstream"
git push
```

```powershell
# Windows
Remove-Item -Recurse -Force tmp_zed -ErrorAction SilentlyContinue
git clone --depth 1 https://github.com/zed-industries/zed.git tmp_zed
robocopy tmp_zed vendor\zed /mir
Remove-Item -Recurse -Force vendor\zed\.git
git add vendor/zed
git commit -m "chore(sync): update vendor/zed from upstream"
git push
```

To trigger the workflow manually: GitHub → Actions → `Sync upstream zed` → Run workflow.

## Contributing

Contributions are welcome! Areas for enhancement:
- **Request interception**: Implement `should_block_url` in native layer for true ad-blocking
- **UI polish**: Match Zed editor styling more closely
- **Virtualization**: Lazy-load tabs for very large tab lists
- **Search improvements**: Implement BM25 ranking for better relevance
- **Mobile support**: Add iOS/Android builds with platform-specific WebView integration

See [ABOUT.md](./ABOUT.md#next-steps) for the full roadmap.

## License

This project is dual-licensed:
- **AGPL-3.0** — See LICENSE-AGPL
- **Apache-2.0** — See LICENSE-APACHE
- **GPL-3.0** — See LICENSE-GPL

Choose the license that best fits your use case.

---

**Questions?** Check [INSTALLATION.md](./INSTALLATION.md) for setup help or [SHORTCUTS.md](./SHORTCUTS.md) for keyboard tips. Found a bug? Open an issue!
