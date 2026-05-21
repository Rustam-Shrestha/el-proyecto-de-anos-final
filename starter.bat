@echo off
start powershell -NoExit -Command "cd backend-node; npm run dev"
start powershell -NoExit -Command "cd backend-fastapi; .\scripts\run_backend.ps1"
start powershell -NoExit -Command "cd frontend; npm run dev"
