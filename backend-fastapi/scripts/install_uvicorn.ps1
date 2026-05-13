# Install uvicorn into the repository's venv (tries common .venv locations)
# Usage:
#   .\install_uvicorn.ps1            # install uvicorn into detected venv
#   .\install_uvicorn.ps1 -RunServer # install and start uvicorn

param(
    [switch]$RunServer
)

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Definition
$searchRoots = @(
    Join-Path $scriptDir "..\.venv\Scripts\python.exe",
    Join-Path $scriptDir "..\app\.venv\Scripts\python.exe",
    Join-Path $scriptDir "..\venv\Scripts\python.exe",
    Join-Path $scriptDir "..\..\.venv\Scripts\python.exe"
)

$python = $null
foreach ($p in $searchRoots) {
    $resolved = Resolve-Path -Path $p -ErrorAction SilentlyContinue
    if ($resolved) { $python = $resolved.Path; break }
}

if (-not $python) {
    Write-Host "No virtual environment python detected in common locations." -ForegroundColor Yellow
    Write-Host "Please create/activate a venv and re-run, or supply a full path to python.exe." -ForegroundColor Yellow
    exit 1
}

Write-Host "Using python: $python" -ForegroundColor Green
& $python -m pip install --upgrade pip setuptools wheel
if ($LASTEXITCODE -ne 0) { Write-Host "pip upgrade failed" -ForegroundColor Red; exit $LASTEXITCODE }

Write-Host "Installing uvicorn into venv..." -ForegroundColor Green
& $python -m pip install uvicorn
if ($LASTEXITCODE -ne 0) { Write-Host "uvicorn install failed" -ForegroundColor Red; exit $LASTEXITCODE }

Write-Host "Verification:" -ForegroundColor Green
& $python -m pip show uvicorn

if ($RunServer) {
    Write-Host "Starting uvicorn (main:app)..." -ForegroundColor Cyan
    & $python -m uvicorn main:app --host 0.0.0.0 --port 8080 --reload
}
