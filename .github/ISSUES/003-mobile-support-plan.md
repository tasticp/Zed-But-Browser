## Mobile Support Plan

### Overview

This project uses Tauri for cross-platform desktop apps, but mobile (Android/iOS) support is experimental and limited. Engine selection on mobile requires platform-specific WebView implementations or embedding custom engines, which isn't directly supported by Tauri's standard WebView abstraction.

### Current Status

- **Desktop**: Engine preference is stored via config; runtime uses the platform's default WebView (WKWebView on macOS, WebView2 on Windows, WebKitGTK on Linux).
- **Mobile**: Tauri can target Android/iOS, but switching engines requires native code changes (e.g., using Android's WebView vs. Chromium, or iOS WKWebView). The config stores the preference, but actual switching needs custom WebView hosts.

### Plan for Mobile

1. **Conditional Builds**: Use Tauri's mobile targets to build separate APKs/IPAs with different WebView configurations.
2. **Engine Embedding**: For alternative engines like Ladybird or Chromium, integrate via native plugins or custom WebView implementations.
3. **Limitations**: Runtime switching isn't possible; build-time selection only. Mobile apps may need separate builds per engine.

### Build Steps (Conditional)

#### Prerequisites (Mobile)

- Android: Android Studio, JDK, Android SDK.
- iOS: macOS with Xcode, iOS Simulator.
- Tauri CLI with mobile support: `cargo install tauri-cli --features mobile`.

#### Android Build

```bash
# For default WebView (Android System WebView)
bun run tauri android init
bun run tauri android dev  # or build

# For Chromium-based (requires custom plugin or embedding)
# Modify src-tauri/src/main.rs to use a Chromium WebView host
# Then build as above
```

#### iOS Build

```bash
# For WKWebView (default)
bun run tauri ios init
bun run tauri ios dev  # or build

# For alternative engines: requires native iOS code to embed (e.g., via UIWebView or custom engine)
# Adapt src-tauri/src/main.rs and iOS project files
```

### Platform-Specific Engine Embedding

#### Android

1. **Default WebView**: Use `android.webkit.WebView` in native code.
2. **Chromium**: Integrate Chromium via `androidx.webkit.WebViewCompat` or embed a full Chromium instance using `chromium_android` crate.
3. **Ladybird**: Not natively supported; would require building Ladybird as a shared library and loading it in a custom View.

Steps:
- In `src-tauri/src/main.rs`, add conditional compilation for Android.
- Use Tauri's plugin system to inject custom WebView.

#### iOS

1. **WKWebView**: Default, use `WKWebView` in Swift/Objective-C.
2. **Chromium**: Embed via `WKWebView` with Chromium backend or use a custom engine.
3. **Ladybird**: Build Ladybird for iOS and integrate as a custom UIView.

Steps:
- Modify iOS project in `src-tauri/gen/apple/` to use custom WebView.
- Use Tauri's iOS plugin API.

### Next Steps

- Implement custom WebView hosts for engines like Ladybird/Chromium.
- Add mobile-specific UI adjustments.
- Test on devices/simulators.