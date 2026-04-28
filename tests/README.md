# Testing Setup

## Backend tests
- Frameworks: Jest + Supertest
- Location: backend/tests
- Covers: auth payload validation and protected CRUD validation path

Command:
- npm run test -w backend

## Frontend E2E tests
- Framework: Playwright
- Location: tests/e2e/specs
- Sample specs:
  - login form rendering
  - user CRUD modal trigger path
  - modal rendering

Command:
- npm run test -w tests/e2e

Before running Playwright, start the app stack:
- npm run dev

## Notes
- E2E tests expect frontend to be available at E2E_BASE_URL or http://localhost:5173.
- For CI, you can extend workflow to boot frontend/backend before Playwright runs.
- npm workspaces hoist dependencies into root node_modules, which is expected in this monorepo.
