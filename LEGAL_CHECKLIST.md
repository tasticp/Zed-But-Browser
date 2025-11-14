# Legal Compliance & License Checklist

## Project Licensing

### Our License: GPL-3.0-or-later

**Obligations:**
-  All source code must be made available to users
-  Derived works must use GPL-3.0 or compatible license
-  Include full license text in distribution
-  State changes made to original code
-  Provide copyright attribution

**Files to maintain:**
```
LICENSE                    # Full GPL-3.0 text
COPYING                    # (Optional) Additional licensing info
NOTICE                     # Third-party attribution
CONTRIBUTING.md            # Contributor agreement reminder
```

## Dependency Compliance Checklist

### Current Dependencies

#### Direct Rust Dependencies
- [ ] **wry** (0.24)
  - License: Apache-2.0 or MIT  Compatible with GPL-3.0
  - Action: Include wry license text in NOTICE
  
- [ ] **tokio** (1.x)
  - License: MIT  Compatible
  - Action: Include in NOTICE

- [ ] **egui** (0.27)
  - License: MIT  Compatible
  - Action: Include in NOTICE

- [ ] **serde** (1.0)
  - License: MIT or Apache-2.0  Compatible
  - Action: Include in NOTICE

- [ ] **uuid** (1.6)
  - License: MIT or Apache-2.0  Compatible
  - Action: Include in NOTICE

#### Build-time Dependencies
- [ ] **rustc** / **cargo**
  - License: MIT or Apache-2.0  Compatible

#### System WebViews (Redistributed)
- [ ] **WebView2** (Windows)
  - License: Various (Chromium-based)
  - Source: microsoft/webview2-src
  - Action: Include Chromium NOTICE in distribution

- [ ] **WKWebView** (macOS/iOS)
  - License: Proprietary Apple
  - Action: Comply via App Store terms

- [ ] **WebKit** (Linux)
  - License: LGPL-2.1+ or BSD
  - Action: Include license text in NOTICE

## Compliance Checklist

### Before Each Release

- [ ] **Code Review**
  - [ ] No proprietary code included
  - [ ] No unattributed code from other projects
  - [ ] All new files have GPL header comment

- [ ] **Dependency Audit**
  - [ ] Run `cargo license` or `cargo about` to generate license report
  - [ ] Verify no GPL-incompatible licenses (e.g., AGPL without acceptance)
  - [ ] Document any dual-licensed crates

- [ ] **Attribution**
  - [ ] Update `NOTICE` file with all third-party licenses
  - [ ] Include links to original projects
  - [ ] Document any modifications to dependencies

- [ ] **Documentation**
  - [ ] README mentions GPL-3.0 licensing
  - [ ] Contributing guidelines mention GPL
  - [ ] Developers must sign-off on GPL when contributing (e.g., `git commit -s`)

### Example GPL Header for New Files

```rust
// Zed Browser
// Copyright (C) 2025 Zed Browser Contributors
//
// This program is free software: you can redistribute it and/or modify
// it under the terms of the GNU General Public License as published by
// the Free Software Foundation, either version 3 of the License, or
// (at your option) any later version.
//
// This program is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
// GNU General Public License for more details.
```

## Distribution Compliance

### For Packaged Releases

- [ ] **Windows Installer (.exe/.msi)**
  - Include `LICENSE` file
  - Include `NOTICE` file with WebView2 attribution
  - Uninstaller must not remove licenses

- [ ] **macOS App Bundle (.app)**
  - Include `LICENSE` in app bundle
  - Include `NOTICE` with WKWebView attribution
  - Comply with App Store terms if distributed there

- [ ] **Linux Packages (.deb/.rpm/.AppImage)**
  - Include `LICENSE` file
  - Include `NOTICE` file
  - Debian: populate `debian/copyright` file
  - RPM: include license files in `%files` section

### For Web Distribution

- [ ] **GitHub Releases**
  - Tag release with license: `v1.0.0 (GPL-3.0)`
  - Include full source code (.zip/.tar.gz)
  - Include `LICENSE` + `NOTICE` in archive

- [ ] **Package Repositories**
  - AUR (Arch User Repository): Mention `GPL-3.0-or-later`
  - Homebrew: Include license metadata
  - Snap/Flatpak: Provide license file

## Third-Party Code Integration

### Inspired by (No Code Copied)
-  **Zed Editor UI**  Only UI/UX inspiration, no code copied
-  **Zen Browser sidebar**  Only design inspiration, no code copied
-  **Arc Browser layout**  Only design inspiration, no code copied

### Using Dependencies (Properly Licensed)
-  **wry**  MIT/Apache-2.0 compatible
-  **egui**  MIT compatible
-  **tokio**  MIT compatible

### NOT Using (Avoided)
-  Chromium source (Too large, complex licensing)
-  Firefox source (MPL-2.0, would require licensing review)
-  Proprietary browser engines (Anti-GPL)

## Contributor Guidelines

### For Contributors

Before submitting a pull request:

1. **Sign-off:** Commit with `git commit -s` (Developer Certificate of Origin)
2. **License Agreement:** By submitting, you agree to GPL-3.0 licensing
3. **Attribution:** Include your name in commit message or file header
4. **No External Code:** Do not copy code without proper attribution and license compatibility

### CLA (Contributor License Agreement)  Optional

We recommend a simple DCO (Developer Certificate of Origin) rather than full CLA. See `CONTRIBUTING.md`.

## Tools for Compliance

### Automated License Checking

```bash
# Check licenses of dependencies
cargo license

# Generate detailed license report
cargo about generate about.hbs > licenses.html

# Check for GPL compatibility issues
cargo tree | grep -i agpl  # No AGPL should appear without explicit acceptance

# Scan source code for uncommented/unlicensed files
find src -name "*.rs" ! -exec grep -l "Copyright\|License" {} \;
```

### Manual Checks

1. **New Dependency Added**
   ```bash
   # Before adding to Cargo.toml:
   cargo search <package>  # Check license info
   ```

2. **External Code Integration**
   - Identify original source URL
   - Check original license
   - Verify GPL compatibility
   - Add comment in code with source + license

## Escalation & Legal Review

### When to Consult a Lawyer

- [ ] If considering a non-GPL license option
- [ ] If a dependency has AGPL or proprietary license
- [ ] If redistributing modified Chromium/WebView binaries
- [ ] If commercializing or bundling with proprietary software
- [ ] If legal cease-and-desist received

### Resources

- [GPL-3.0 Official Text](https://www.gnu.org/licenses/gpl-3.0.txt)
- [Free Software Foundation Licensing Guide](https://www.gnu.org/licenses/gpl-faq.html)
- [SPDX License Identifiers](https://spdx.org/licenses/)
- [Compatibility Matrix](https://www.gnu.org/licenses/license-list.en.html)

## Related Files

- `LICENSE`  Full GPL-3.0 text
- `NOTICE`  Third-party attributions (TBD)
- `CONTRIBUTING.md`  Contributor guidelines
- `CODE_OF_CONDUCT.md`  Community standards

---

**Last Updated:** 2025-11-14
**Next Review:** Before each major release (v1.0, v2.0, etc.)

**Maintainer Checklist Before Release:**
- [ ] All dependency licenses verified
- [ ] NOTICE file updated
- [ ] No unattributed code
- [ ] GPL headers present in new files
- [ ] CI/CD license check passes
