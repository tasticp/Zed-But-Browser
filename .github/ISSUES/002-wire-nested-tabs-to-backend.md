---
name: Wire nested-tabs prototype to backend
about: Tasks and checklist for wiring the nested tabs prototype to `src-tauri` backend and adding persistence, engine selection, and mobile notes.
---

# Wire nested-tabs prototype to backend

## Goals

- Persist nested-tabs state to disk via Tauri backend commands (`read_state` / `write_state`).
- Persist and expose preferred browsing engine via `get_config` / `set_config`.
- Add keyboard shortcuts and make sure synced tabs reflect each other's changes immediately.
- Document mobile (Android/iOS) considerations for engine selection.

## Checklist

- [x] Add `src-tauri` with basic Tauri commands: `read_state`, `write_state`, `get_config`, `set_config`.
- [x] Wire `public/browser.js` to call backend when available.
- [x] Add persistence and keyboard bindings in `public/nestedTabs.js`.
- [ ] Integrate engine UI into the frontend and allow switching engines (config persistence).
- [ ] Add mobile support plan and conditional build notes.

## Notes

- Actual runtime switching between engines (Chrome/Firefox/Ladybird/WebKit) depends on the platform and packaging. The backend stores the preferred engine and the UI exposes the choice; platform-specific building must install/use the target engine.
- For Android/iOS, consider using a WebView-binding that supports the chosen engine or ship a bundled engine where permitted.
