# Zed Browser  A Minimalist Cross-Platform Browser

A **GPL-3.0-licensed** Rust-based web browser with a minimalist, code-editor-inspired UI (styled after Zed editor) combined with folder/link organization inspired by **Zen Browser** and **Arc Browser**.

## Features

- **Minimalist UI** inspired by Zed editor with a collapsible sidebar for bookmarks/folders
- **Cross-platform** desktop support: Windows, macOS, Linux
- **Rust-native** for speed and security
- **System WebView** integration (WKWebView on macOS, WebView2 on Windows, WebKit on Linux)
- **Tab management** and navigation history
- **Sidebar organization** with folders, bookmarks, and custom links

## Architecture

### Technology Stack

- **UI Framework:** egui (Rust native immediate-mode GUI) + winit (event loop)
- **WebView Embedding:** wry (cross-platform webview library)
- **Async Runtime:** tokio
- **Serialization:** serde/serde_json (for bookmarks, sidebar state)

### Project Structure

```
zed-browser/
 Cargo.toml                 # Rust project manifest
 src/
    main.rs               # Application entry point
    ui.rs                 # UI state and rendering stubs
    browser.rs            # Browser state (tabs, navigation)
    sidebar.rs            # Sidebar items and management
 README.md                 # This file
 LICENSE                   # GPL-3.0 license text
```

## Installation & Building

### Prerequisites

- **Rust 1.70+** ([Install](https://rustup.rs/))
- **Cargo** (included with Rust)

### Platform-Specific Requirements

#### macOS
```bash
# No additional dependencies needed; WKWebView is built-in
```

#### Windows
```bash
# Requires Visual Studio Build Tools or MSVC toolchain
# Automatic with Rust; WebView2 runtime is bundled
```

#### Linux
```bash
# Install WebKit2 development files:
sudo apt-get install libwebkit2gtk-4.1-dev  # Debian/Ubuntu
# or
sudo dnf install webkit2-gtk3-devel         # Fedora
```

### Building

```bash
# Clone the repository
git clone https://github.com/tasticp/Zed-But-Browser.git
cd Zed-But-Browser

# Build in debug mode
cargo build

# Build in release mode (optimized)
cargo build --release

# Run directly
cargo run
```

### Running

```bash
# Development
cargo run

# Release (optimized binary)
./target/release/zed-browser
```

## License

**GPL-3.0-or-later**

This project is licensed under the GNU General Public License v3.0 or later. You are free to:
- Use, modify, and distribute this software
- **Obligation:** Provide source code to downstream users and maintain GPL-3.0 licensing

### Third-Party Licenses

- **wry:** Apache-2.0 or MIT
- **egui:** MIT
- **tokio:** MIT
- **serde:** MIT or Apache-2.0
- **System WebViews:** Chromium/WebKit (Blink/WebCore)  see respective projects

## Architecture Notes & Design Decisions

### Why Rust?

1. **Memory Safety:** No null-pointer dereference or buffer overflows
2. **Performance:** Comparable to C++, minimal overhead
3. **Concurrency:** tokio async runtime for responsive UI
4. **Cross-platform:** Single codebase for Windows, macOS, Linux

### Why egui + wry (not Tauri)?

1. **Pure Rust UI:** No JavaScript layer; UI code is native Rust
2. **Direct control:** egui is immediate-mode, giving us fine-grained control over UI rendering
3. **Minimal overhead:** wry is lighter than Tauri's full web stack
4. **Consistent look:** We own the entire UI, not delegating to HTML/CSS

### Why System WebViews?

1. **Smaller binary:** No Chromium bundled; leverages OS-provided engines
2. **Simpler licensing:** Avoid complexities of redistributing Chromium
3. **Updated security:** System updates keep the engine secure
4. **Lower resource usage:** Shared system libraries

## Development Roadmap

### v0.1.0 (Current)
- [x] Basic scaffold and module structure
- [x] Browser state management
- [x] Sidebar management with recursive folder support
- [ ] Functional webview integration with egui/wry

### v0.2.0
- [ ] Full keyboard navigation
- [ ] Bookmark import/export (JSON)
- [ ] Dark/light themes
- [ ] Settings UI

### v1.0.0
- [ ] Extension API (basic JavaScript)
- [ ] Sync across devices
- [ ] Search integration
- [ ] Responsive mobile layout

### v2.0.0
- [ ] iOS support (WKWebView wrapper)
- [ ] Android support (custom WebView)
- [ ] Full extension ecosystem
- [ ] Cross-device sync

## Contributing

We welcome contributions! Please see guidelines for:
- Reporting bugs via GitHub Issues
- Submitting feature requests via GitHub Discussions
- All contributors must agree to GPL-3.0 licensing

## Quick Start for Developers

```bash
# Set up logging
export RUST_LOG=debug

# Run with verbose output
cargo run

# Run tests
cargo test

# Check code quality
cargo clippy

# Format code
cargo fmt
```

## FAQ

**Q: Why GPL-3.0 and not MIT/Apache?**
A: GPL ensures community-driven development and prevents proprietary forks.

**Q: Can I use this in a commercial project?**
A: Yes, but your derivative must also be GPL-3.0 and include source code.

**Q: How is this different from Arc/Zen Browser?**
A: Zed Browser is written in Rust (vs. Arc's TypeScript/Zen's Firefox codebase) and targets minimal, editor-inspired UX.

---

**Status:** Alpha (v0.1.0)  Not production-ready. Use at your own risk.
