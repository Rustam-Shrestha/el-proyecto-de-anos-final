# Frontend Setup (React + TypeScript)

## Tech stack
- React 18 + TypeScript
- Tailwind CSS + ERP global stylesheet
- Redux Toolkit for global state
- TanStack Query for server state and API caching
- Zod + React Hook Form for validation
- React Router with lazy-loaded routes

## Key folders
- src/app: app-wide router/store/query client
- src/features: feature-first slices, hooks, APIs, pages
- src/components: ERP UI components used by the main shell
- src/hooks: reusable hooks
- src/helper: formatting and utility helpers
- src/services: API/data services
- src/assets: ERP assets and styles
- src/shared: shared layout/provider/module utilities

## Environment
- Template file: .env.example
- Required variable:
	- VITE_API_BASE_URL=http://localhost:4000/api/v1

## Run locally
1. npm install
2. Copy .env.example to .env
3. npm run dev -w frontend

Note: this repo uses npm workspaces, so dependencies are hoisted to root node_modules by design.

## Build
- npm run build -w frontend

## Main frontend routes
- /auth
- /app/dashboard
- /app/users

## Performance choices
- React.lazy for route/code splitting
- Suspense in main entry
- React.memo for reusable UI like modal and user page
- Shared hooks and API client to reduce repetition

## Notes
- Vite may choose another port if 5173 is occupied.
- src/legacy exists as reference material while migration hardening continues, but the app now renders ERP-first UI from active src/* folders.
