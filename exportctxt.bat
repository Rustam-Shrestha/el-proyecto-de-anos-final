@echo off
setlocal EnableExtensions
title Repomix Export - wawmats -> finguard_ctxt

set "SRC=C:\Users\shres\Desktop\wawmats"
set "CTX=C:\Users\shres\Desktop\finguard_ctxt"
set "CTX_FILE=%CTX%\finguard_ctxt.md"
set "LOG=%~dp0exportctxt.log"

echo. > "%LOG%"
echo === Repomix export started %DATE% %TIME% === >>"%LOG%"
echo Source: %SRC% >>"%LOG%"
echo Output: %CTX_FILE% >>"%LOG%"
echo. >>"%LOG%"

echo ============================================================
echo  Source: %SRC%
echo  Output: %CTX_FILE%
echo ============================================================
echo.

REM ---------- Sanity ----------
if not exist "%SRC%" (
    echo [ERROR] Source not found: %SRC%
    echo [ERROR] Source not found: %SRC% >>"%LOG%"
    goto :finish
)

where npx >nul 2>&1
if errorlevel 1 (
    echo [ERROR] npx not found. Install Node.js first.
    echo [ERROR] npx not found. >>"%LOG%"
    goto :finish
)

if not exist "%CTX%" mkdir "%CTX%" 2>nul

REM ---------- Run repomix ----------
echo Running repomix... (first run may take 30-60s)
echo Running repomix... >>"%LOG%"

pushd "%SRC%"
call npx --yes repomix@latest ^
    --output "%CTX_FILE%" ^
    --style markdown ^
    --compress ^
    --remove-comments ^
    --ignore "**/node_modules/**,**/dist/**,**/build/**,**/.next/**,**/.venv/**,**/venv/**,**/__pycache__/**,**/.pytest_cache/**,**/.mypy_cache/**,**/.ruff_cache/**,**/.ipynb_checkpoints/**,**/*.ipynb,**/*.pkl,**/*.pickle,**/*.joblib,**/*.h5,**/*.pt,**/*.pth,**/*.onnx,**/*.ckpt,**/*.csv,**/*.parquet,**/*.feather,**/*.arrow,**/*.log,**/*.lock,**/package-lock.json,**/yarn.lock,**/pnpm-lock.yaml,**/.DS_Store,**/Thumbs.db,**/coverage/**,**/.turbo/**,**/.parcel-cache/**,**/*.log" >>"%LOG%" 2>&1
set "RC=%ERRORLEVEL%"
popd

if not "%RC%"=="0" (
    echo [WARN] repomix exited with code %RC%. Check log.
    echo [WARN] repomix exit code %RC% >>"%LOG%"
) else (
    echo [OK] Context written.
    echo [OK] Context written. >>"%LOG%"
)

:finish
echo.
echo ============================================================
if exist "%CTX_FILE%" (
    for %%F in ("%CTX_FILE%") do (
        set "SZ=%%~zF"
        set /a "KB=!SZ!/1024"
        echo  Output: %CTX_FILE%
        echo  Size:   !KB! KB
    )
) else (
    echo  Output file not created.
)
echo  Log:    %LOG%
echo ============================================================
echo.
pause >nul
endlocal
exit /b 0