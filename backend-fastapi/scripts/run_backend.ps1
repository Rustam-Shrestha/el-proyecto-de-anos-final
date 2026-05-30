# Run FastAPI backend from a stable working directory.
# This avoids: ModuleNotFoundError: No module named 'backend'
# Usage (from anywhere):
#   .\backend\scripts\run_backend.ps1

param(
    [string]$BindHost = "0.0.0.0",
    [int]$Port = 8000,
    [switch]$Reload
)

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Definition
$repoRoot = Resolve-Path (Join-Path $scriptDir "..\..")

$pythonCandidates = @(
    (Join-Path $repoRoot ".venv\Scripts\python.exe"),
    (Join-Path $repoRoot "backend-fastapi\.venv\Scripts\python.exe"),
    (Join-Path $repoRoot "backend-fastapi\venv\Scripts\python.exe")
)

$pythonExe = $null
foreach ($candidate in $pythonCandidates) {
    if (Test-Path $candidate) {
        $pythonExe = $candidate
        break
    }
}

if (-not $pythonExe) {
    $pythonExe = "python"
}

$backendFastApiRoot = Join-Path $repoRoot "backend-fastapi"

Push-Location $backendFastApiRoot
try {
    Write-Host "Using Python interpreter: $pythonExe" -ForegroundColor Green
    if ($Reload) {
        & $pythonExe -m uvicorn main:app --host $BindHost --port $Port --reload
    } else {
        & $pythonExe -m uvicorn main:app --host $BindHost --port $Port
    }
}
finally {
    Pop-Location
}
