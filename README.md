# Zed Browser

A modern, ultra-lightweight browser built with **Rust and Tauri** that uses your system's native WebView. Choose your preferred browser engine identity and enjoy built-in ad blocking similar to uBlock Origin.

## Features

- **Zed-Inspired UI/UX** - Modern, minimal design with clean aesthetics and smooth interactions
- **Sidebar with Folders** - Zen/Arc-style vertical sidebar with bookmark folder organization (coming soon)
- **Ultra-lightweight** - Built with Rust/Tauri, uses system WebView (WKWebView/WebView2/WebKit) - no bundled Chromium!
- **Minimalist Design** - Helium-inspired clean interface with essential controls only
- **Efficient memory management** - Rust backend ensures minimal memory footprint
- **Cross-platform** - Windows, macOS, Linux support via system WebView
- **Fast startup** - Minimal initialization overhead, native performance
- **Tab management** - Efficient tab system with history tracking (coming soon)
- **Bookmark organization** - Folder-based bookmark management (coming soon)
- **System WebView** - Uses native OS rendering engine (WKWebView on macOS, WebView2 on Windows, WebKit on Linux)
- 🎯 **Customizable Browser Engine Identity**: Choose between Chromium, Firefox (Gecko), WebKit, or Microsoft Edge user agents
- 🛡️ **Built-in Ad Blocking**: uBlock-like ad blocking that blocks ads, trackers, and malicious content
- ⚙️ **Easy Settings**: Change your browser engine identity anytime from the settings panel

## Why Rust/Tauri Instead of Electron?

Unlike Electron (which VSCode uses and can be slow), Zed Browser uses:
- **Tauri**: Rust-based framework that's 10-100x smaller than Electron
- **System WebView**: Uses your OS's native web rendering engine instead of bundling Chromium
- **Native Performance**: Rust backend ensures fast, efficient operations
- **Smaller Binaries**: Typical app size is 5-15MB vs Electron's 100-200MB+
- **Lower Memory Usage**: Shares system WebView instead of running separate Chromium instances

## Installation

### Prerequisites

- **Rust**: Install from [rustup.rs](https://rustup.rs/)
- **System WebView**:
  - **Windows**: WebView2 (usually pre-installed with Windows 11, or install from Microsoft)
  - **macOS**: WKWebView (built-in)
  - **Linux**: WebKitGTK (install via package manager)

### Build from Source

1. **Clone this repository** (if you haven’t already):
```bash
git clone <your-git-url-for-zed-browser>
cd Zed-But-Browser
```
> If you downloaded a ZIP instead of using git, just `cd` into the extracted folder.

2. **Install JavaScript dependencies**:
```bash
bun install
```

3. **Run in development mode**:
```bash
bun run dev
```

4. **Build for production**:
```bash
bun run build
```

## Why "Microsoft Edge" Appears

When you see "Microsoft Edge" in error pages or browser detection, it's because:

1. **System WebView on Windows**: Windows uses WebView2, which is based on Edge's Chromium engine
2. **User Agent**: By default, WebView2 may identify as Edge
3. **Solution**: You can change this through the onboarding flow or settings panel to use a different browser engine's user agent string

The onboarding flow lets you choose which browser engine identity you want to use, and you can change it anytime from the settings panel (⚙ button in the toolbar).

## Browser Engine Identities

- **Chromium**: Fast and modern, used by Chrome and Edge
- **Firefox (Gecko)**: Privacy-focused, used by Firefox
- **WebKit**: Lightweight, used by Safari
- **Microsoft Edge**: Microsoft Edge engine

Note: These are user agent strings that change how websites identify your browser. The actual rendering engine depends on your OS (WebView2 on Windows, WKWebView on macOS, WebKit on Linux).

## Ad Blocking

The built-in ad blocker blocks:
- Common ad domains and patterns
- Tracking scripts and pixels
- Malicious content
- Analytics trackers

You can enable or disable ad blocking from the settings panel at any time.

## Development

- `bun run dev` - Start development server with hot reload
- `bun run build` - Build the production application
- `bun run tauri` - Run Tauri CLI commands

## Architecture

- **Frontend**: HTML/CSS/JavaScript (in `public/`)
- **Backend**: Rust (in `src-tauri/src/`)
- **Framework**: Tauri 1.5
- **Storage**: JSON-based config file in app data directory

## License

MIT
