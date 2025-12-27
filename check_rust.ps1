# Rust/Cargo Diagnostic Script
# This script checks for Rust installation and PATH configuration

Write-Host "=== Rust/Cargo Diagnostic ===" -ForegroundColor Cyan
Write-Host ""

# Check 1: Is cargo.exe in PATH?
Write-Host "[1] Checking if 'cargo' command is available..." -ForegroundColor Yellow
try {
    $cargoVersion = cargo --version 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Host "  ✓ Cargo found: $cargoVersion" -ForegroundColor Green
    } else {
        Write-Host "  ✗ Cargo command failed" -ForegroundColor Red
    }
} catch {
    Write-Host "  ✗ Cargo not found in PATH" -ForegroundColor Red
}

Write-Host ""

# Check 2: Check common Rust installation locations
Write-Host "[2] Checking common Rust installation locations..." -ForegroundColor Yellow
$commonPaths = @(
    "$env:USERPROFILE\.cargo\bin\cargo.exe",
    "$env:USERPROFILE\.rustup\toolchains\*\bin\cargo.exe",
    "C:\Users\$env:USERNAME\.cargo\bin\cargo.exe",
    "C:\Program Files\Rust\bin\cargo.exe"
)

$found = $false
foreach ($path in $commonPaths) {
    $resolved = Resolve-Path $path -ErrorAction SilentlyContinue
    if ($resolved) {
        Write-Host "  ✓ Found: $resolved" -ForegroundColor Green
        $found = $true
    }
}
if (-not $found) {
    Write-Host "  ✗ No Rust installation found in common locations" -ForegroundColor Red
}

Write-Host ""

# Check 3: Check PATH environment variable
Write-Host "[3] Checking PATH for Rust/Cargo entries..." -ForegroundColor Yellow
$pathEntries = $env:PATH -split ';'
$rustPaths = $pathEntries | Where-Object { $_ -like '*cargo*' -or $_ -like '*rust*' }
if ($rustPaths) {
    Write-Host "  ✓ Found Rust-related paths in PATH:" -ForegroundColor Green
    foreach ($p in $rustPaths) {
        Write-Host "    - $p" -ForegroundColor Gray
    }
} else {
    Write-Host "  ✗ No Rust/Cargo paths found in PATH" -ForegroundColor Red
}

Write-Host ""

# Check 4: Check for rustup
Write-Host "[4] Checking for rustup..." -ForegroundColor Yellow
try {
    $rustupVersion = rustup --version 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Host "  ✓ Rustup found: $rustupVersion" -ForegroundColor Green
    } else {
        Write-Host "  ✗ Rustup command failed" -ForegroundColor Red
    }
} catch {
    Write-Host "  ✗ Rustup not found in PATH" -ForegroundColor Red
}

Write-Host ""

# Check 5: Check for rustc
Write-Host "[5] Checking for rustc..." -ForegroundColor Yellow
try {
    $rustcVersion = rustc --version 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Host "  ✓ Rustc found: $rustcVersion" -ForegroundColor Green
    } else {
        Write-Host "  ✗ Rustc command failed" -ForegroundColor Red
    }
} catch {
    Write-Host "  ✗ Rustc not found in PATH" -ForegroundColor Red
}

Write-Host ""
Write-Host "=== Diagnostic Complete ===" -ForegroundColor Cyan
Write-Host ""
Write-Host "If Rust is not installed, visit: https://rustup.rs/" -ForegroundColor Yellow
Write-Host "If Rust is installed but not in PATH, you may need to:" -ForegroundColor Yellow
Write-Host "  1. Restart your terminal" -ForegroundColor Gray
Write-Host "  2. Run: rustup default stable" -ForegroundColor Gray
Write-Host "  3. Add C:\Users\$env:USERNAME\.cargo\bin to your PATH" -ForegroundColor Gray
