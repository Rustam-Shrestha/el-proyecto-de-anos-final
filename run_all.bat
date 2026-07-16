@echo off
REM === Frontend ===
cd frontend
start cmd /k "npm run dev"

REM === Backend (Node) ===
cd ../backend-node
start cmd /k "npm run dev"

REM === Backend (FastAPI / Python) ===
cd ../backend-fastapi
call .venv\Scripts\activate
start powershell -NoExit -ExecutionPolicy Bypass -File ".\scripts\run_backend.ps1"

REM === Return to root ===
cd ..
