#!/usr/bin/env bash
set -euo pipefail

cat > .zip_project_temp.ps1 <<'PS1'
$ErrorActionPreference = "Stop"

$timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
$src = (Get-Location).Path
$folderName = Split-Path $src -Leaf
$dest = Join-Path $src "$folderName`_clean_$timestamp.zip"
$staging = Join-Path $env:TEMP "$folderName`_zip_$timestamp"

$excludeDirs = @(
    ".git",
    "__pycache__",
    ".pytest_cache",
    ".mypy_cache",
    ".ruff_cache",
    ".venv",
    "venv",
    "env",
    "node_modules",
    ".idea",
    ".vscode",
    "zip_check",
    "uploads",
    "build",
    "dist",
    "htmlcov",
    ".next",
    ".vite",
    ".cache"
)

$excludeFiles = @(
    ".env",
    ".env.local",
    ".env.production",
    "*.zip",
    "*.db",
    "*.sqlite",
    "*.sqlite3",
    ".coverage",
    "zip_project.sh",
    "zip_project_windows.sh",
    ".zip_project_temp.ps1"
)

if (Test-Path $staging) {
    Remove-Item $staging -Recurse -Force
}

New-Item -ItemType Directory -Path $staging | Out-Null

robocopy $src $staging /E /XD $excludeDirs /XF $excludeFiles /NFL /NDL /NJH /NJS /NP

if ($LASTEXITCODE -ge 8) {
    throw "Robocopy failed with exit code $LASTEXITCODE"
}

Compress-Archive -Path (Join-Path $staging "*") -DestinationPath $dest -Force

Remove-Item $staging -Recurse -Force

Write-Host ""
Write-Host "Created clean zip file:"
Write-Host $dest
Write-Host ""
PS1

powershell.exe -NoProfile -ExecutionPolicy Bypass -File ./.zip_project_temp.ps1

rm -f .zip_project_temp.ps1

echo ""
echo "ZIP FILES IN CURRENT FOLDER:"
ls -lh *.zip
