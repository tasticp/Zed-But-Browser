# Zed Browser - Debug & Run Guide

## ✅ Compilation Status

The Rust/Tauri backend successfully compiles with no errors:
```
Finished `dev` profile [unoptimized + debuginfo] target(s)
```

All modules are properly linked:
- ✅ `src-tauri/src/browser.rs` — Tab/bookmark management + center-search preference
- ✅ `src-tauri/src/adblock.rs` — Ad-blocking rules & matching
- ✅ `src-tauri/src/search_index.rs` — Local search index
- ✅ `src-tauri/src/main.rs` — Command registration & app bootstrap

## Prerequisites

Install these before running the app:

### 1. Rust (stable toolchain)
```bash
# Install via rustup (if not already installed)
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
```
Verify installation:
```bash
rustc --version
cargo --version
```

### 2. JavaScript Runtime (Bun recommended)
```bash
# Install Bun
curl -fsSL https://bun.sh/install | bash

# Or use Node.js
node --version
npm --version
```

### 3. Platform WebView Runtime

**Windows:**
- Install Microsoft Edge WebView2 Runtime
  - Download: https://developer.microsoft.com/en-us/microsoft-edge/webview2
  - Or it comes pre-installed on Windows 11

**macOS:**
- Xcode Command Line Tools (includes WKWebView)
  ```bash
  xcode-select --install
  ```

**Linux:**
- Install WebKitGTK development libraries
  ```bash
  # Debian/Ubuntu
  sudo apt-get update
  sudo apt-get install libwebkit2gtk-4.0-dev
  
  # Fedora
  sudo dnf install webkit2gtk3-devel
  
  # Arch
  sudo pacman -S webkit2gtk
  ```

### 4. Build Tools

**Windows:**
- Visual Studio Build Tools (C++/MSVC)
  - Download: https://visualstudio.microsoft.com/downloads/ (Community or Build Tools)
  - Ensure "Desktop development with C++" workload is selected
  - Or use MinGW if you prefer (configure Rust to use `gnu` toolchain)

**macOS:**
- Already included with Xcode Command Line Tools

**Linux:**
- Standard build tools
  ```bash
  # Debian/Ubuntu
  sudo apt-get install build-essential pkg-config libssl-dev
  
  # Fedora
  sudo dnf install gcc pkg-config openssl-devel
  ```

## Quick Start (5 minutes)

### Step 1: Install dependencies
```bash
cd Zed-But-Browser
bun install
# or
npm install
```

### Step 2: Run the dev app
```bash
bun run dev
# This runs: @tauri-apps/cli dev
```

The app should launch in ~10-15 seconds. You'll see:
- A window with the Zed Browser UI
- The sidebar on the left with tabs
- The address bar and toolbar at the top
- A blank webview (iframe) in the center

### Step 3: Test features

#### Centered Omnibox (New Tab)
1. Click the `+` button in the left sidebar
2. The centered search overlay should appear focused in the center of the window
3. Type a URL (e.g., `github.com`) or search query (e.g., `rust async`)
4. Press Enter — the tab will navigate

#### Sidebar Tab Switching
1. Click any tab in the left sidebar to switch to it
2. Click the `×` on a tab row to close it

#### Settings
1. Click the ⚙ (gear) icon in the toolbar
2. Settings panel slides in from the right
3. Toggle "Center omnibox on New Tab" to disable/enable the feature
4. Change Browser Engine (Chromium, Firefox, WebKit, Edge)
5. Toggle Ad Blocking on/off
6. Manage Ad Block Rules (add/remove/reset)

## Troubleshooting

### Problem: "command not found: bun"
**Solution:** Install Bun or use npm instead
```bash
# Install Bun
curl -fsSL https://bun.sh/install | bash

# Or use npm
npm run dev
```

### Problem: WebView fails to start / app shows blank window
**Solution:** Ensure platform WebView runtime is installed
- **Windows:** Install WebView2 runtime
- **macOS:** Install Xcode command line tools (`xcode-select --install`)
- **Linux:** Install libwebkit2gtk-4.0-dev

### Problem: "error: linker `cc` not found" (Linux/macOS)
**Solution:** Install C compiler and build essentials
```bash
# macOS
xcode-select --install

# Linux (Debian/Ubuntu)
sudo apt-get install build-essential pkg-config

# Linux (Fedora)
sudo dnf install gcc pkg-config openssl-devel
```

### Problem: "error: Visual C++ build tools not found" (Windows)
**Solution:** Install Visual Studio Build Tools
1. Download from: https://visualstudio.microsoft.com/downloads/
2. Select "Desktop development with C++"
3. Complete installation
4. Restart your terminal/IDE
5. Retry `bun run dev`

### Problem: "WebView2 is not installed" (Windows)
**Solution:** Install Microsoft Edge WebView2 Runtime
1. Download from: https://developer.microsoft.com/en-us/microsoft-edge/webview2/
2. Run the installer
3. Restart the app

### Problem: File locking error during build (Windows)
**Solution:** Close the running app or any IDE holding the binary
```bash
# If the previous app is still running, kill it
taskkill /IM zed-browser.exe /F

# Then retry the build
bun run dev
```

### Problem: Changes to Rust code don't reflect in dev mode
**Solution:** The Tauri dev server should auto-reload, but if not:
1. Close the app window
2. Wait for the terminal to show recompilation (watch mode)
3. Or manually stop (`Ctrl+C`) and restart `bun run dev`

### Problem: Settings/state not persisting
**Debugging:**
- State files are stored in the Tauri `app_data_dir`:
  - **Windows:** `%APPDATA%\zed-browser\`
  - **macOS:** `~/Library/Application Support/zed-browser/`
  - **Linux:** `~/.config/zed-browser/` or `~/.local/share/zed-browser/`
- Look for `browser_state.json`, `adblock_rules.json`, `search_index.json`
- You can manually inspect/edit these JSON files to debug state
- Delete them to reset to defaults

## Developer Console & Debugging

### Open DevTools in the App
- Press **F12** in the app window (or right-click → Inspect)
- View frontend console logs, network, DOM inspector

### Test Tauri Commands from Console
In the DevTools console, you can invoke backend commands directly:

```javascript
// Check if center-search is enabled
window.__TAURI__.invoke('get_center_search_enabled').then(console.log)

// Disable center-search
window.__TAURI__.invoke('set_center_search_on_new_tab', { enabled: false })

// List all tabs
window.__TAURI__.invoke('list_tabs').then(console.log)

// Open a new tab
window.__TAURI__.invoke('open_tab', { url: 'https://github.com' }).then(console.log)

// Test ad-blocking
window.__TAURI__.invoke('should_block_url', { url: 'https://doubleclick.net/ads.js' }).then(console.log)

// Index a page for search
window.__TAURI__.invoke('index_page', {
  url: 'https://example.com',
  title: 'Example Site',
  content: 'This is example content for the local search index'
}).then(console.log)

// Search the local index
window.__TAURI__.invoke('search', { query: 'example', limit: 10 }).then(console.log)

// List ad-block rules
window.__TAURI__.invoke('list_rules').then(console.log)

// Add an ad-block rule
window.__TAURI__.invoke('add_rule', {
  kind: 'Domain',
  pattern: 'ads.example.com'
}).then(console.log)
```

### Check Backend Logs
The Tauri backend logs appear in the terminal where you ran `bun run dev`.

To increase verbosity:
```bash
RUST_LOG=debug bun run dev
```

This will show detailed logs from the Rust backend including command invocations, state loading/saving, and more.

## File Structure (Key Files)

```
Zed-But-Browser/
├── src-tauri/
│   ├── src/
│   │   ├── main.rs              ← Tauri bootstrap & command registration
│   │   ├── browser.rs           ← Tab/bookmark state & commands
│   │   ├── adblock.rs           ← Ad-block engine
│   │   └── search_index.rs      ← Local search index
│   ├── Cargo.toml               ← Rust dependencies
│   └── tauri.conf.json          ← Tauri config
├── public/
│   ├── index.html               ← Main UI (polished CSS)
│   ├── browser.js               ← Frontend logic & Tauri invokes
│   ├── onboarding.html          ← First-run flow
│   └── onboarding.js
├── package.json                 ← JS dependencies & scripts
└── bun.lock / package-lock.json

Data stored at runtime (platform-dependent `app_data_dir`):
├── browser_state.json           ← Tabs, bookmarks, settings
├── adblock_rules.json           ← Ad-block rules
└── search_index.json            ← Local search index
```

## Building for Production

```bash
# Build the release binary
bun run build

# Output:
# - Windows: src-tauri/target/release/zed-browser.exe
# - macOS: src-tauri/target/release/zed-browser
# - Linux: src-tauri/target/release/zed-browser
```

The release binary is ~20-50MB (much smaller than Electron apps).

## Common Tasks

### Run with verbose Rust logging
```bash
RUST_LOG=debug bun run dev
```

### Verify Rust compiles (without running)
```bash
cargo check --manifest-path src-tauri/Cargo.toml
```

### Format Rust code
```bash
cargo fmt --manifest-path src-tauri/Cargo.toml
```

### Lint Rust code
```bash
cargo clippy --manifest-path src-tauri/Cargo.toml
```

### Clean build artifacts
```bash
cargo clean --manifest-path src-tauri/Cargo.toml
```

## Next Features to Implement

Based on your earlier requirements:
1. **Full virtualization** — Render only visible tabs in sidebar (for 1000s of tabs)
2. **Keyboard shortcuts** — Cmd/Ctrl+T (new tab), Cmd/Ctrl+L (focus omnibox), Cmd/Ctrl+W (close tab)
3. **Zed visual parity** — Exact color/spacing/animation matching
4. **Platform request interception** — Actually block ads at the network level

See `README.md` for feature status and architecture details.

## Support & Further Help

- Check the terminal output where you ran `bun run dev` for backend errors
- Press F12 in the app to open DevTools and check frontend console
- Check the platform-specific `app_data_dir` for persisted JSON state files
- Ensure all prerequisites (Rust, Node, WebView, build tools) are installed and up-to-date