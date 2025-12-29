# Installing Rust on Windows

## Quick Installation

### Method 1: Using rustup (Recommended)

1. **Download rustup-init.exe:**
   - Visit: https://rustup.rs/
   - Or download directly: https://win.rustup.rs/x86_64
   - This will download `rustup-init.exe`

2. **Run the installer:**
   - Double-click `rustup-init.exe`
   - Follow the prompts (default options are usually fine)
   - Choose "1) Proceed with installation (default)"

3. **Restart your terminal:**
   - Close and reopen your PowerShell/Command Prompt
   - This ensures PATH is updated

4. **Verify installation:**
   ```powershell
   rustc --version
   cargo --version
   ```

### Method 2: Using Chocolatey (if you have it)

```powershell
choco install rust
```

### Method 3: Using Scoop (if you have it)

```powershell
scoop install rust
```

## After Installation

1. **Clone this project (if you haven’t already):**
   ```powershell
   git clone <your-git-url-for-zed-browser>
   cd Zed-But-Browser
   ```
   > If you already cloned the repo or downloaded a ZIP, just `cd` into that folder instead.

2. **Build the Rust project directly (wry version):**
   ```powershell
   cargo build --release
   ```

3. **Run the Rust browser directly:**
   ```powershell
   cargo run
   ```

## Troubleshooting

### If cargo is still not recognized after installation:

1. **Check if Rust was installed:**
   ```powershell
   Test-Path "$env:USERPROFILE\.cargo\bin\cargo.exe"
   ```
   Should return `True`

2. **Add to PATH manually (if needed):**
   - Add `%USERPROFILE%\.cargo\bin` to your system PATH
   - Or restart your computer

3. **Verify PATH:**
   ```powershell
   $env:PATH -split ';' | Select-String -Pattern 'cargo'
   ```

## System Requirements

- **Windows 10 or later**
- **Visual Studio Build Tools** (for compiling Rust code):
  - Download: https://visualstudio.microsoft.com/downloads/
  - Install "Desktop development with C++" workload
  - Or install "Build Tools for Visual Studio"

## Next Steps

Once Rust is installed, you can:
- Build the project: `cargo build --release`
- Run in development: `cargo run`
- Check for errors: `cargo check`
- Format code: `cargo fmt`
- Lint code: `cargo clippy`
