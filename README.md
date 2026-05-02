# PERN + TypeScript Baseline (Docker Toolbox Compatible)

This repository is a modular monorepo scaffold for an ERP-style academic project.

## Structure
- frontend: React + TypeScript + Redux Toolkit + TanStack Query + Zod
- backend: Express + TypeScript + Postgres + JWT/RBAC + optional OAuth2 hooks + OpenAPI docs
- tests/e2e: Playwright specs
- infra: Docker Toolbox helper scripts

## Why node_modules is at repository root
This project uses npm workspaces. Dependencies are installed once in root node_modules and shared by frontend/backend/tests to reduce duplication.

- Expected location: node_modules at project root.
- frontend/node_modules and backend/node_modules are not required in workspace mode.
- You still run package scripts with -w flags or from root scripts.

## Environment files
- Frontend template exists at frontend/.env.example
- Backend template exists at backend/.env.example

Create local env files:
1. Copy frontend/.env.example to frontend/.env
2. Copy backend/.env.example to backend/.env

## Quick Start (without Docker)
1. npm install
2. Configure env files as above
3. Start both apps:
   - npm run dev
4. Open:
   - frontend: http://localhost:5173 (or next free Vite port like 5174)
   - backend: http://localhost:4000
   - swagger docs: http://localhost:4000/docs

## Docker Toolbox Start
1. Ensure Docker Toolbox VM is running.
2. Run:
   - powershell -ExecutionPolicy Bypass -File infra/scripts/toolbox-up.ps1
3. Stop and cleanup:
   - powershell -ExecutionPolicy Bypass -File infra/scripts/toolbox-down.ps1

## ERP Frontend Status
- ERP header/footer and ERP-style dashboard are now the main frontend shell.
- Tailwind + ERP global stylesheet pipeline is enabled in frontend build.
- Active routes:
   - /auth
   - /app/dashboard
   - /app/users

Note: source files under frontend/src/legacy are retained as reference only and are not the main app shell.

## CI/CD
Workflow file: .github/workflows/ci.yml

Included jobs:
- frontend build
- backend build
- backend tests (Jest + Supertest)

## Future FastAPI Integration
- Backend has FASTAPI_URL env and route placeholder:
  - GET /api/v1/integrations/fastapi/ping
- Add a FastAPI service later and call it from backend services.

Read module-specific docs:
- frontend/README.md
- backend/README.md
- tests/README.md
