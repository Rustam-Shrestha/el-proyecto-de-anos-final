# Backend Setup (Express + TypeScript + Postgres)

## Tech stack
- Express + TypeScript
- PostgreSQL (pg)
- JWT auth + RBAC middleware
- Optional OAuth2 strategy wiring (passport-oauth2)
- Zod for env/config and request validation
- Pino logging
- OpenAPI docs via swagger-jsdoc/swagger-ui

## Folder architecture
- src/routes: route registration and schemas
- src/controllers: HTTP layer logic
- src/services: business logic
- src/middleware: auth/rbac/validation/errors
- src/config: env and logging
- src/db: connection layer
- migrations: starter SQL schema

## Database starter schema
- roles
- users
- sessions
- audit_logs

## Run locally
1. npm install
2. Copy .env.example to .env
3. Ensure Postgres is available and DATABASE_URL is valid
4. Apply SQL migration manually once:
   - psql "$env:DATABASE_URL" -f migrations/001_init.sql
5. Start API:
   - npm run dev -w backend

Local development falls back from the Docker-only `postgres` hostname to `localhost` automatically so Windows runs work without Docker Toolbox networking.

If you see EADDRINUSE on port 4000, stop the process currently using that port or run backend with a different PORT value in backend/.env.

Note: dependencies may appear in root node_modules because npm workspaces hoist shared packages.

## API conventions included
- Pagination query format: page, limit
- Request validation via Zod middleware
- Centralized error handler and logger
- Auth middleware and role checks

## Docs
- Swagger UI: /docs

## Testing
- Jest + Supertest tests in tests/
- Run: npm run test -w backend

## Build
- npm run build -w backend
