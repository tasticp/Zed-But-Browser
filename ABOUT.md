# About Zed But Browser

## Vision

Zed But Browser is a **minimal, high-performance web browser** inspired by the Zed editor's UI and philosophy. Built with **Rust and Tauri**, it delivers a lightweight alternative to traditional browsers while maintaining full functionality.

## What is it?

A modern web browser that:
- Uses your system's native WebView (no bundled Chromium)
- Features a Zed editor-inspired left sidebar with nested tabs
- Keeps RAM usage minimal through smart tab management
- Provides keyboard-first navigation and shortcuts
- Supports multiple browser engine identities (Chrome, Firefox, WebKit, Ladybird)
- Includes built-in ad-blocking and local full-text search

## Key Features

### 🎨 UI/UX
- **Zed-inspired sidebar** — Clean, minimal left sidebar with breadcrumb history
- **Nested tabs** — Organize tabs hierarchically with multi-instance support
- **Keyboard shortcuts** — Power through browsing with intuitive shortcuts (Ctrl+T, Ctrl+W, Ctrl+D)
- **Lightweight animations** — Smooth, responsive interactions

### ⚡ Performance
- **Ultra-lightweight** — Uses system WebView (no bloated bundled browser engine)
- **Memory-optimized** — Single reused WebView across tabs minimizes RAM
- **Fast startup** — Small binary, instant launch
- **Cross-platform** — Windows, macOS, Linux via native WebView (WebView2 / WKWebView / WebKitGTK)

### 🔧 Smart Features
- **Tab persistence** — Your tabs and history are saved automatically
- **Bookmark organization** — Foldered bookmarks with sidebar access
- **Ad blocking** — Lightweight, built-in ad-blocker with customizable rules
- **Local search** — Full-text search index for offline page searching
- **Engine selection** — Choose your browser identity (Chromium, Firefox, WebKit, Ladybird)
- **Sync/duplicate tabs** — Linked tabs that stay synchronized

### 🔄 Upstream Sync
- Automatically syncs the Zed editor repository daily to stay up-to-date with upstream changes
- Independent copy kept in `vendor/zed/` without pushing changes back

## Architecture

### Frontend
- Pure JavaScript (no heavy frameworks)
- Nested tabs UI with breadcrumb navigation
- Keyboard binding system (Ctrl+T, Ctrl+W, Ctrl+D, etc.)
- localStorage-based or Tauri-backed persistence

### Backend
- **Rust + Tauri** — Lightweight desktop application framework
- **Persistent state** — Tab history, bookmarks, and preferences stored locally
- **Tauri commands** — Backend operations exposed to frontend via IPC
- **Ad-blocker engine** — Compact, fast URL matching
- **Search index** — Local full-text search with TF-IDF scoring

## Why Zed But Browser?

Zed editor revolutionized text editing with a modern, keyboard-friendly UI and minimal design. Zed But Browser applies the same philosophy to web browsing:
- **Keyboard-first** — Navigate without your mouse
- **Minimal** — No bloat, no ads in the UI itself
- **Fast** — Instant response and low resource usage
- **Extensible** — Open architecture for customization

## Compared to other browsers

| Feature | Zed But Browser | Chrome/Firefox | Safari | Edge |
|---------|-----------------|----------------|--------|------|
| Memory usage | ⭐⭐⭐ Low | ⭐ High | ⭐⭐ Medium | ⭐ High |
| Startup speed | ⭐⭐⭐ Fast | ⭐⭐ Medium | ⭐⭐⭐ Fast | ⭐⭐ Medium |
| UI customization | ⭐⭐⭐ Easy | ⭐ Limited | ⭐ Limited | ⭐ Limited |
| Keyboard shortcuts | ⭐⭐⭐ Extensive | ⭐⭐ Some | ⭐⭐ Some | ⭐⭐ Some |
| Built-in ad-blocker | ⭐⭐⭐ Yes | ⭐ No | ⭐ No | ⭐ No |
| System WebView | ⭐⭐⭐ Yes | ⭐ No | ⭐⭐⭐ Yes | ⭐ No |

## Next Steps

- [📦 Installation & Setup](./INSTALLATION.md) — Get started quickly
- [⌨️ Keyboard Shortcuts](./SHORTCUTS.md) — Master the keyboard
- [🔧 Development](./README.md#development) — Contribute or extend

---

**Built with ❤️ by the community. Inspired by Zed editor.**
