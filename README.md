# Zed Inspired Browser

A modern, ultra-lightweight browser built with **Rust and Tauri** that uses your system's native WebView. This project is inspired by the Zed editor UI and focuses on power browsing with a minimal memory footprint and a fast, responsive UI.

This repository now includes:
- A compact Rust/Tauri backend with a small persistent state store for tabs, bookmarks, and preferences.
- A single-WebView strategy (reused iframe) to minimize memory usage while providing full-featured tab/history management.
- An integrated, lightweight ad-blocking engine with a small default rule set and runtime rule management.
- A local, Rust-based full-text search index for offline/local search of indexed pages.
- A Zed-style left sidebar with breadcrumb-like history crumbs, lightweight animations, and virtualization-ready tab list.

## Features (Updated)

- Zed-inspired UI/UX — Minimal, keyboard-friendly design with a left sidebar for tab navigation and breadcrumb history.
- Sidebar with Breadcrumb Tabs — Vertical sidebar showing tabs and a compact history breadcrumb for the active tab.
- Ultra-lightweight — Rust + Tauri, using the system WebView (no bundled Chromium).
- Memory-optimized tab model — single WebView reused for all tabs to reduce process/memory overhead.
- Integrated Ad Blocking — Small, fast adblock matcher with persistent rules and a UI for managing rules.
- Local Full-text Search — Local index (persisted in app data) for indexing and searching page content offline.
- Cross-platform — Windows, macOS, Linux support via system WebView (WebView2 / WKWebView / WebKitGTK).
- Fast startup — Minimal initialization and small binary size.
- Tab management — Open/close/switch tabs with history, persisted in a compact JSON format.
- Bookmark organization — Foldered bookmarks persisted and accessible via the sidebar.
- Configurable Browser Engine Identity — Select user-agent identity (Chromium, Firefox, WebKit, Edge) via onboarding or settings.
- Developer-friendly Tauri commands — Many backend features are exposed as Tauri commands for the frontend to call.

## What’s new (technical changes)

New backend modules (Tauri):
- `src-tauri/src/browser.rs` — Persistent, compact tab/bookmark state and commands:
  - Commands exposed: `list_tabs`, `open_tab`, `close_tab`, `switch_tab`, `navigate_tab`, `tab_go_back`, `tab_go_forward`, `get_active_tab`, `list_bookmark_folders`, `add_bookmark`, `remove_bookmark`, `toggle_folder`, `get_preferences`, `ensure_at_least_one_tab`, and more.
  - State persisted in `browser_state.json` inside the app data directory.
- `src-tauri/src/adblock.rs` — Lightweight ad-block matcher and rule manager:
  - Commands exposed: `should_block_url`, `list_rules`, `add_rule`, `remove_rule`, `reset_to_default_rules`, `reload_rules`.
  - Default small curated rule-set included; rules are persisted to `adblock_rules.json`.
  - Designed for low-memory and fast substring/domain matching; suitable to call from request interception hooks.
- `src-tauri/src/search_index.rs` — Local search index:
  - Commands exposed: `index_page`, `remove_document`, `search`, `get_document`, `rebuild_index`, `index_count`.
  - Stores a compact inverted index in `search_index.json`. Uses simple tokenization and TF-IDF-like scoring to return relevant pages.

Frontend changes:
- `public/browser.js` updated to integrate with Tauri commands:
  - Sidebar with tab list and breadcrumb history (lightweight DOM + virtualization-ready structure).
  - Omnibox uses `build_search_url` backend command so the selected engine affects search URLs.
  - Settings panel now includes ad-block rules UI (list, add, remove, reset).
- `public/index.html` markup/CSS updated to host the sidebar and breadcrumbs while keeping the UI minimal and responsive.

Wry (native) path:
- The wry-based binary (`src/main.rs`) includes minimal IPC glue and shows how to add request interception hooks. For full ad-blocking at the native/webview level, use the platform-specific request hook to call `should_block_url` to decide whether to block a resource request.

## Ad Blocking (how it works now)

- The ad-blocker uses a compact set of domain/substring/wildcard rules and runs in the Tauri backend.
- Rules are persisted in the app data directory (`adblock_rules.json`).
- The frontend provides a small UI to inspect/add/remove/reset rules (Settings → Ad Block Rules).
- To actually block requests early, the platform-specific request interceptor should invoke the `should_block_url` command and, if true, return an empty/403 response for that request. The repository contains a minimal example of how to add such a hook in the wry path; for the Tauri path, add request interception and call `should_block_url` in your native hook.

Example rule operations (frontend calls backend via Tauri invoke):
- List rules: `invoke('list_rules')`
- Add rule: `invoke('add_rule', { kind: 'Domain', pattern: 'doubleclick.net' })`
- Remove rule: `invoke('remove_rule', { kind: 'Domain', pattern: 'doubleclick.net' })`
- Reset to defaults: `invoke('reset_to_default_rules')`

## Local search (how to use)

- Index a page:
  - `invoke('index_page', { url: 'https://example.com', title: 'Example', content: '...' })`
- Search:
  - `invoke('search', { query: 'example search', limit: 10 })`
- The local index is persisted to `search_index.json` in the app data directory.

Use cases:
- Offline search of previously visited or user-indexed pages.
- Fast, private lookups without remote dependencies.

## UI notes

- The left sidebar provides a compact, Zed-inspired style:
  - Tab entries are lightweight DOM nodes with small controls.
  - Active tab shows a breadcrumb history area (last N history entries) for quick navigation.
  - The sidebar uses a virtualizable layout (the current implementation is ready to be extended with virtualization to handle thousands of tabs with minimal DOM cost).

## Development


Backend development tips:
 The browsing core uses a single iframe/WebView reused across tabs to keep RAM low. Tab state (history, title, URL) is stored in the Rust backend.

## Installation & Setup

### Prerequisites

- Rust (stable) — install via `rustup`.
- Node.js or Bun — this repo's examples use `bun`; `npm`/`yarn` are acceptable alternatives.
- Tauri platform build tools. On Windows install Visual Studio Build Tools and the WebView2 runtime.

### Quick start (Unix / macOS)

```bash
# install frontend deps (bun)
bun install

# start dev server with Tauri dev wrapper
bun run dev
```

### Quick start (Windows / PowerShell)

1. Install Visual Studio Build Tools and WebView2 runtime (see Microsoft documentation).
2. From repository root (PowerShell):

```powershell
# install deps (bun)
bun install

# start development
bun run dev
```

If you do not have `bun`, use `npm install` and `npm run dev` / `npm run build` as appropriate.

### Build (production)

```bash
bun run build
```

### Run tests

```bash
# Rust backend tests
cargo test --manifest-path src-tauri/Cargo.toml

# Frontend tests (if configured)
bun test
```

### Local upstream sync (what the GitHub Action does)

Unix/macOS (requires `rsync`):

```bash
rm -rf tmp_zed
git clone --depth 1 https://github.com/zed-industries/zed.git tmp_zed
rsync -a --delete tmp_zed/ vendor/zed/
rm -rf vendor/zed/.git
git add vendor/zed
git commit -m "chore(sync): update vendor/zed from zed-industries/zed"
git push
```

PowerShell (Windows) alternative using `robocopy`:

```powershell
Remove-Item -Recurse -Force tmp_zed -ErrorAction SilentlyContinue
git clone --depth 1 https://github.com/zed-industries/zed.git tmp_zed
robocopy tmp_zed vendor\zed /mir
Remove-Item -Recurse -Force vendor\zed\.git
git add vendor/zed
git commit -m "chore(sync): update vendor/zed from zed-industries/zed"
git push
```

### Trigger GitHub Action manually

Open the repository on GitHub → Actions → `Sync upstream zed` workflow → Run workflow (choose branch). The workflow also runs daily via cron.

### Notes

- The sync updates only `vendor/zed` in this repository and never pushes to `zed-industries/zed`.
- To use a different sync strategy (subtree/submodule), adapt the workflow as needed.


## Engine selection & mobile notes

- This project persists a preferred browsing engine (e.g., `webkit`, `edge`, `chromium`, `ladybird`) in the Tauri config via `get_config` / `set_config` commands exposed by the `src-tauri` backend. The frontend prototype persists the choice; runtime switching requires platform/runtime support.
- Desktop availability:
  - macOS: WKWebView (WebKit)
  - Windows: WebView2 (Edge)
  - Linux: WebKitGTK or other native WebView
  - Chromium-based engines require bundling or a runtime that exposes them.
  - Ladybird and other alternative engines require platform-specific integration; this repo stores the preference but you must supply a runtime that uses the engine.
- Mobile (Android/iOS): switching engines on mobile is platform-limited. To support alternative engines on mobile, target platform-specific WebView implementations or embed a separate engine; this typically requires native work and different packaging. See `.github/ISSUES/002-wire-nested-tabs-to-backend.md` for notes.

## Where to look in the code
  - `public/browser.js` — UI logic, tab/sidebar glue, adblock UI
  - `public/onboarding.html` — onboarding engine selection
- Native/wry path:
  - `src/main.rs` — alternative wry-based binary with request-interception glue examples

## Next steps / suggestions

- Improve ad-block rule matching performance with Aho-Corasick for large rule sets (optional).
- Add request interception in the Tauri/wry native layer that calls `should_block_url` for each resource request to block early.
- Improve visuals of the sidebar to match Zed editor more closely (fine-grained styling and animations).
- Implement virtualization (lazy rendering) in the sidebar for very large tab lists; the current structure is prepared for it.
- Expand the local search index with more sophisticated ranking (e.g., BM25) if needed.

## License

APGL
APACHE
GPL

## Upstream sync: vendor/zed

- **What:** This repository keeps a copy of `https://github.com/zed-industries/zed` inside `vendor/zed` and automatically syncs it on a schedule (or on-demand via the Actions UI).
- **Why:** keep an independent copy inside this project without pushing changes back to the upstream project.
- **How it works:** a GitHub Actions workflow clones the upstream repo, rsyncs its contents into `vendor/zed` (removing `tmp_zed/.git`), commits any changes to this repository, and pushes them. The workflow runs daily and can be triggered manually.

Notes:
- This sync only updates files inside `vendor/zed` in this repository; it never pushes to `zed-industries/zed`.
- If you prefer a subtree/submodule strategy, you can change the workflow to use `git subtree` or submodules, but the current approach keeps history in this repository's commits.

Local clone:
- A local clone of upstream was also created at `vendor/zed/` for local development convenience. The GitHub Action will update that directory on the remote repository when it detects upstream changes.

Security:
- The workflow uses the repository token to push commits back to this repo. No secrets for upstream access are required for public repositories.

Next steps (UI features):
- Implement nested tabs (tabs inside tabs) and multi-instance file locations. This is a larger UI/architecture change; see the new issue/plan in the repo for details.
