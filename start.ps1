# CareNexus one-click launcher for Windows.
# Right-click > "Run with PowerShell", or from a terminal: .\start.ps1
# Installs/updates dependencies when they change, starts the API and the
# web app, and opens http://localhost:3000 in the default browser.

$ErrorActionPreference = "Stop"
Set-Location -Path $PSScriptRoot

$python = Get-Command python -ErrorAction SilentlyContinue
if (-not $python) {
    Write-Host "Python 3.12+ is required: https://www.python.org/downloads/" -ForegroundColor Red
    Read-Host "Press Enter to exit"
    exit 1
}
if (-not (Get-Command npm -ErrorAction SilentlyContinue)) {
    Write-Host "Node.js 20+ is required: https://nodejs.org/" -ForegroundColor Red
    Read-Host "Press Enter to exit"
    exit 1
}

python run.py @args
