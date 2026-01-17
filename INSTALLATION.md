# Installation & Setup

## Prerequisites

Before you begin, ensure you have:

- **Rust** (stable channel) — Install via [rustup](https://rustup.rs/)
- **Node.js** (v16+) or **Bun** — Get from [nodejs.org](https://nodejs.org) or [bun.sh](https://bun.sh)
- **Git** — For cloning the repository
- **Platform-specific tools:**
  - **Windows:** Visual Studio Build Tools and WebView2 runtime
  - **macOS:** Xcode Command Line Tools (install via `xcode-select --install`)
  - **Linux:** libwebkit2gtk-4.0-dev, libssl-dev, libgtk-3-dev

## Quick Start

### 1. Clone the Repository

```bash
git clone https://github.com/tasticp/Zed-But-Browser.git
cd Zed-But-Browser
```

### 2. Install Dependencies

**Using Bun (recommended):**
```bash
bun install
```

**Or using npm:**
```bash
npm install
```

### 3. Run Development Server

**On macOS / Linux:**
```bash
bun run dev
# or npm run dev
```

**On Windows (PowerShell):**
```powershell
$env:CARGO_TARGET_DIR='C:\zed_target'
cd src-tauri
cargo tauri dev
```

The Tauri dev server will start, compile the Rust backend, and open the app window.

---

## Platform-Specific Setup

### Windows

1. **Install Visual Studio Build Tools:**
   - Download from [microsoft.com](https://visualstudio.microsoft.com/downloads/)
   - Select "Desktop development with C++" workload

2. **Install WebView2 Runtime:**
   - Download from [microsoft.com/webview2](https://developer.microsoft.com/en-us/microsoft-edge/webview2/)

3. **Run dev in PowerShell:**
   ```powershell
   $env:CARGO_TARGET_DIR='C:\zed_target'  # Avoids OneDrive file locks
   cd src-tauri
   cargo tauri dev
   ```

### macOS

1. **Install Xcode tools:**
   ```bash
   xcode-select --install
   ```

2. **Run dev:**
   ```bash
   bun run dev
   ```

### Linux (Ubuntu/Debian)

1. **Install dependencies:**
   ```bash
   sudo apt install libwebkit2gtk-4.0-dev libssl-dev libgtk-3-dev
   ```

2. **Run dev:**
   ```bash
   bun run dev
   ```

---

## Build for Production

### Create optimized bundle:

```bash
bun run build
# or npm run build
```

Output location:
- **Windows:** `src-tauri/target/release/Zed But Browser.exe`
- **macOS:** `src-tauri/target/release/bundle/macos/Zed But Browser.app`
- **Linux:** `src-tauri/target/release/bundle/deb/zed-but-browser_*.deb`

---

## Configuration

### Tauri Config (`src-tauri/tauri.conf.json`)

Customize app settings:
- Window size and minimum dimensions
- App icon
- Browser engine preferences
- Allowed Tauri commands

### Frontend Config (`public/config.js` or localStorage)

Setup via Settings panel in the app:
- Theme preference
- Engine selection (Chrome, Firefox, WebKit, Ladybird)
- Ad-blocking rules

---

## Testing

### Run tests:

```bash
# Rust backend tests
cargo test --manifest-path src-tauri/Cargo.toml

# Frontend tests (if configured)
bun test
```

---

## Troubleshooting

### "cargo tauri command not found"

Install Tauri CLI:
```bash
cargo install tauri-cli
```

### "WebView2 not found" (Windows)

Download and install from [microsoft.com/webview2](https://developer.microsoft.com/en-us/microsoft-edge/webview2/)

### "Build failed on OneDrive" (Windows)

Use external Cargo target directory:
```powershell
$env:CARGO_TARGET_DIR='C:\zed_target'
cargo tauri dev
```

### "Permission denied" errors (Linux)

Ensure you have write permissions in the project directory:
```bash
chmod +x -R .
```

---

## Next Steps

- [⌨️ Learn keyboard shortcuts](./SHORTCUTS.md)
- [📖 About the project](./ABOUT.md)
- [🔄 Contributing](./README.md#development)

---

**Need help?** Open an issue on GitHub or check the troubleshooting section above.
