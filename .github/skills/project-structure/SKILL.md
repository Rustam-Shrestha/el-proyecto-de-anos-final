# Project Structure Skill

Purpose: Provide a concise, machine-readable summary of the repository layout and key conventions for Copilot and other automated agents.

Location: .github/copilot-instructions.md is the authoritative human-facing guide. This SKILL complements it with a compact mapping used by automation.

Summary (as of 2026-05-26):

- Root folders:
  - `backend-node/` — Express.js + TypeScript backend (path aliases, direct SQL via `pg`, tests with Jest/Supertest, migrations in `migrations/` and `prisma/`).
  - `backend-fastapi/` — FastAPI Python backend (async SQLAlchemy), entry at `main.py`, `app/` package.
  - `frontend/` — React + TypeScript + Vite frontend (Tailwind CSS, Redux Toolkit, TanStack Query).
  - `docs/` — Design & architecture docs for each service.
  - `infra/` — helper scripts for environment and toolbox orchestration.
  - `tests/` — e2e and Playwright specs.

- Important files and scripts:
  - `docker-compose.toolbox.yml`, `docker-helper.*` — local dev tooling.
  - `starter.bat`, `setup.bat` — Windows convenience scripts.
  - `backend-node/src/app.ts`, `server.ts` — express app and server.
  - `backend-fastapi/main.py` — FastAPI entrypoint.
  - `frontend/src/main.tsx` — React entrypoint.

- Conventions:
  - Use path aliases in `backend-node` imports (e.g., `@services/*`, `@config/*`).
  - Controller → Service → DB pattern for `backend-node`.
  - Parameterized SQL only; use `RETURNING` for inserts.
  - Zod for validation in Node backend; Pydantic for FastAPI.
  - Tests: Jest + Supertest (backend-node), Playwright e2e under `tests/e2e`.

- Usage for Copilot/agents:
  - Prefer concise modifications that follow existing patterns (path aliases, controller-service separation, strict typings).
  - When adding features, prefer feature folders under `features/` in `frontend` and corresponding controllers/services in `backend-node`.

References:
- Human-facing guide: .github/copilot-instructions.md

Last updated: 2026-05-26
