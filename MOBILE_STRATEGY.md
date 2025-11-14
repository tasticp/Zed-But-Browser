# Cross-Platform & Mobile Strategy

## Desktop (v0.1.0 - CURRENT)

### Current Support
-  Windows (10+)
-  macOS (11+)
-  Linux (Ubuntu 20.04+, Fedora 35+)

### Architecture
- **UI:** egui (Rust native)
- **Webview:** wry (system webview)
- **Build:** Single Rust codebase, platform-specific binaries

### Why System WebViews?
1. No Chromium bundling  smaller binary (20-40 MB vs 200+ MB)
2. Automatic security updates from OS
3. Licensing simplicity (no redistribution of Chromium binary)
4. Lower memory usage (shared OS libs)

## Mobile Strategy

### iOS (Planned for v2.0+)

#### Architecture
- **Engine:** WKWebView (mandatory on iOS 14.5+)
- **UI Layer:** Port egui to UIKit + SwiftUI
- **Language:** Rust + Swift interop (via FFI)
- **Build:** Xcode project + Cargo for Rust

#### Challenges
1. **Apple App Store Requirements**
   - Must use WKWebView (no Chromium embedding)
   - Extensions/plugins must be pre-approved
   - Cannot download & execute code at runtime (blocks ad-blockers, uBlock Origin)

2. **UI Adaptation**
   - Touch navigation (vs. keyboard/mouse)
   - Safe areas (notch, Dynamic Island)
   - Portrait/landscape responsiveness

3. **Permissions**
   - Camera, microphone, location (requires NSUserDescription in Info.plist)
   - Background sync (limited by iOS)

#### Implementation Path
```
Phase 1: Create wrapper iOS app (Swift)
  - Load wry webview via C FFI
  - Handle iOS-specific lifecycle

Phase 2: Adapt egui for touch
  - Pinch to zoom, long-press for context menu
  - Bottom tab bar instead of top

Phase 3: Submit to App Store
  - Code signing with Apple developer account
  - Privacy policy & EULA
  - Address review feedback
```

### Android (Planned for v2.0+)

#### Architecture
- **Engine:** Android WebView (Chromium-based, auto-updates)
- **UI Layer:** Jetpack Compose (modern Android UI toolkit)
- **Language:** Rust + Kotlin interop
- **Build:** Android Studio project + Cargo

#### Challenges
1. **WebView Fragmentation**
   - WebView versions differ across Android versions
   - Feature parity not guaranteed

2. **Extension Support**
   - More flexible than iOS
   - But still limited in WebView (no full Firefox extensions)

3. **Privacy/Permissions**
   - INTERNET, CAMERA, MICROPHONE, LOCATION (AndroidManifest.xml)
   - Runtime permissions (Android 6+)

#### Implementation Path
```
Phase 1: Create Android app wrapper (Kotlin)
  - Use wry + WebView bridge
  - Handle Android lifecycle (onPause, onResume, etc.)

Phase 2: Adapt UI for touch & mobile screens
  - Side drawer for sidebar (not left panel)
  - Bottom navigation for common actions
  - Responsive layout for 4"-6" screens

Phase 3: Submit to Google Play
  - Google Play Developer account ($25 one-time)
  - Privacy policy & data collection disclosure
  - Staged rollout (10%  50%  100%)
```

## Cross-Platform Considerations

### Shared Rust Core
All platforms use the same Rust backend for:
- Tab management
- Bookmark storage (JSON + local SQLite cache)
- Navigation history
- Settings/preferences

### Platform-Specific Layers

| Component | Windows | macOS | Linux | iOS | Android |
|-----------|---------|-------|-------|-----|---------|
| WebView | WebView2 | WKWebView | WebKit | WKWebView | Android WebView |
| UI | egui | egui | egui | SwiftUI | Compose |
| Backend | Rust | Rust | Rust | Rust | Rust |
| Build | MSVC | clang | gcc | Xcode | Android Studio |

### Bookmark & State Sync (Future)

**v1.5 Plan:** Cloud sync using:
- CouchDB-compatible local-first database (Pouchdb-rs)
- End-to-end encryption (AES-256 via `ring`)
- GitHub Gist API or self-hosted sync server option

## Mobile UI Mockup

### iOS Layout (Portrait)
```

       (Status)     Address bar

                      
                      
   WebView Content    
                      
                      

              Bottom tab bar

```

### Android Layout (Portrait)
```

                    Address bar + menu

                      
                      
   WebView Content    
                      
                      

              Bottom nav

```

## Timeline Estimate

| Phase | Target | Deliverables | Effort |
|-------|--------|--------------|--------|
| **v0.1** | Q4 2025 | Desktop scaffold |  In Progress |
| **v0.2** | Q1 2026 | egui + wry integration | 4-6 weeks |
| **v1.0** | Q2 2026 | Full desktop browser | 8-10 weeks |
| **v1.5** | Q3 2026 | Sync & mobile UI prep | 6-8 weeks |
| **v2.0** | Q4 2026 | iOS + Android | 12-16 weeks |

## Resources for Mobile Development

### iOS
- [Apple's WKWebView docs](https://developer.apple.com/documentation/webkit/wkwebview)
- [Rust FFI to Swift](https://rustyyato.github.io/type-level-programming/advanced-fields/swift-rust-ffi.html)
- [SwiftUI official guide](https://developer.apple.com/tutorials/swiftui)

### Android
- [Android WebView docs](https://developer.android.com/reference/android/webkit/WebView)
- [Jetpack Compose docs](https://developer.android.com/jetpack/compose)
- [Rust FFI to Kotlin](https://blog.logrocket.com/calling-kotlin-from-rust/)

### Common
- [wry webview library](https://github.com/tauri-apps/wry)
- [egui GUI library](https://github.com/emilk/egui)
- [Mobile security best practices](https://cheatsheetseries.owasp.org/cheatsheets/Mobile_Application_Security_Testing_Guide.html)

---

**Next Steps:**
1. Complete desktop UI integration (egui + wry) for v0.2
2. Test bookmark persistence on desktop
3. Begin iOS wrapper prototype
4. Community feedback on UI/UX before mobile launch
