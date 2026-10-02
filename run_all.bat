@echo off
REM ============================================================
REM  FinGuard Full-Stack Launcher - runs the whole project
REM  Usage: run_all.bat [--seed] [--fresh]
REM    --seed   run "npm run seed" (Node) before starting servers
REM    --fresh  drop + migrate + seed the DB from ground up first
REM  Services:
REM    FastAPI  http://localhost:8000  (ML + NLU + OCR)
REM    Node API http://localhost:4000  (/api/v1/...)
REM    Frontend http://localhost:5173  (Vite)
REM ============================================================
setlocal
cd /d "%~dp0"

if "%~1"=="--fresh" goto dofresh
if "%~1"=="--seed" goto doseed
goto checkvenv

:dofresh
call "%~dp0seed-fresh-db.bat"
if errorlevel 1 goto failed
goto checkvenv

:doseed
echo [1/4] Seeding database (npm run seed)...
pushd "%~dp0backend-node"
call npm run seed
popd
if errorlevel 1 goto failed

:checkvenv
echo [2/4] Checking FastAPI venv...
if not exist "%~dp0backend-fastapi\.venv\Scripts\python.exe" goto makevenv
echo   venv OK.
goto checknode

:makevenv
echo   venv missing - creating with system Python 3.11...
py -3.11 -m venv "%~dp0backend-fastapi\.venv"
if errorlevel 1 goto failed
"%~dp0backend-fastapi\.venv\Scripts\python.exe" -m pip install --upgrade pip
"%~dp0backend-fastapi\.venv\Scripts\pip.exe" install -r "%~dp0backend-fastapi\requirements.txt"
if errorlevel 1 goto failed

:checknode
echo [3/4] Checking node_modules...
if not exist "%~dp0backend-node\node_modules" goto backenddeps
if not exist "%~dp0frontend\node_modules" goto frontenddeps
echo   node_modules OK.
goto launch

:backenddeps
echo   installing backend-node deps...
pushd "%~dp0backend-node"
call npm install
popd
if errorlevel 1 goto failed
if not exist "%~dp0frontend\node_modules" goto frontenddeps
goto launch

:frontenddeps
echo   installing frontend deps...
pushd "%~dp0frontend"
call npm install
popd
if errorlevel 1 goto failed
goto launch

:launch
echo [4/4] Starting all services in new windows...
start "FinGuard FastAPI :8000" /d "%~dp0backend-fastapi" cmd /k ""%~dp0backend-fastapi\.venv\Scripts\python.exe" -m uvicorn main:app --host 0.0.0.0 --port 8000"
start "FinGuard Node API :4000" /d "%~dp0backend-node" cmd /k npm run dev
start "FinGuard Frontend :5173" /d "%~dp0frontend" cmd /k npm run dev

echo.
echo ============================================================
echo  All services launched:
echo    FastAPI  http://localhost:8000/docs
echo    Node API http://localhost:4000/api/v1
echo    Frontend http://localhost:5173
echo ============================================================
endlocal
exit /b 0

:failed
echo [ERROR] run_all.bat failed. See messages above.
endlocal
exit /b 1
