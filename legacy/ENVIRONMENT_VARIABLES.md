# Environment Variables Reference

---

## Frontend (`frontend/.env`)

| Variable | Used In | Purpose | Required |
|---|---|---|---|
| `VITE_API_BASE_URL` | `shared/lib/env.ts`, `services/apiService.ts`, `features/kyc/api/kycApi.ts` | Backend API base URL (e.g. `http://localhost:4000/api/v1`) | **Required** |

---

## Backend Node (`backend-node/.env`)

| Variable | Used In | Purpose | Required |
|---|---|---|---|
| `NODE_ENV` | `config/env.ts`, `config/logger.ts` | Runtime environment (`development`, `production`, `test`) | Optional (default: `development`) |
| `PORT` | `config/env.ts`, `server.ts` | Server port number | Optional (default: `3000`) |
| `DATABASE_URL` | `config/env.ts`, `config/database.ts`, `prisma.config.ts` | PostgreSQL connection string | **Required** |
| `DB_USER` | `.env` (informational) | PostgreSQL username | Optional |
| `DB_PASSWORD` | `.env` (informational) | PostgreSQL password | Optional |
| `DB_HOST` | `.env` (informational) | PostgreSQL host | Optional |
| `DB_PORT` | `.env` (informational) | PostgreSQL port | Optional |
| `DB_NAME` | `.env` (informational) | PostgreSQL database name | Optional |
| `DB_URL` | `.env` (informational) | PostgreSQL URL alias | Optional |
| `JWT_ACCESS_SECRET` | `config/env.ts`, `services/tokenService.ts`, `middleware/auth.ts` | Secret for signing access tokens | **Required** |
| `JWT_REFRESH_SECRET` | `config/env.ts`, `services/tokenService.ts` | Secret for signing refresh tokens | **Required** |
| `JWT_ACCESS_TTL` | `config/env.ts`, `services/tokenService.ts` | Access token expiry (e.g. `15m`, `2h`) | Optional (default: `2h`) |
| `JWT_REFRESH_TTL` | `config/env.ts`, `services/tokenService.ts` | Refresh token expiry (e.g. `7d`) | Optional (default: `7d`) |
| `FRONTEND_URL` | `config/env.ts` | Frontend URL for CORS/redirects | Optional (default: `http://localhost:5173`) |
| `CORS_ORIGIN` | `config/env.ts`, `app.ts` | Comma-separated allowed CORS origins | Optional (default: `http://localhost:5173`) |
| `LOG_LEVEL` | `config/env.ts`, `config/logger.ts` | Logging level (`info`, `debug`, `warn`, `error`) | Optional (default: `info`) |
| `SMTP_HOST` | `config/env.ts` | SMTP server hostname | Optional |
| `SMTP_PORT` | `config/env.ts` | SMTP server port | Optional |
| `SMTP_USER` | `config/env.ts` | SMTP username | Optional |
| `SMTP_PASS` | `config/env.ts` | SMTP password | Optional |
| `UPLOAD_DIR` | `config/env.ts`, `routes/documentRoutes.ts` | Directory for KYC document uploads | Optional (default: `uploads/kyc`) |
| `FASTAPI_URL` | `.env` (informational) | FastAPI KYC service URL | Optional |
| `OAUTH_CLIENT_ID` | `.env` (extension point) | OAuth2 client ID | Optional |
| `OAUTH_CLIENT_SECRET` | `.env` (extension point) | OAuth2 client secret | Optional |
| `OAUTH_AUTH_URL` | `.env` (extension point) | OAuth2 authorization URL | Optional |
| `OAUTH_TOKEN_URL` | `.env` (extension point) | OAuth2 token URL | Optional |
| `OAUTH_CALLBACK_URL` | `.env` (extension point) | OAuth2 callback URL | Optional |

---

## Backend FastAPI (`backend-fastapi/.env`)

| Variable | Used In | Purpose | Required |
|---|---|---|---|
| `DATABASE_URL` | `app/config.py` | PostgreSQL async connection string | **Required** |
| `NODE_ENV` | `app/config.py` | Runtime environment | Optional (default: `development`) |
| `LOG_LEVEL` | `app/config.py` | Logging level | Optional (default: `INFO`) |

---

## Docker Environment

| Variable | Used In | Purpose | Required |
|---|---|---|---|
| `VITE_API_BASE_URL` | Docker Compose | Frontend container API URL | Varies |
| Port mappings | `docker-compose.toolbox.yml` | 4000:4000 (backend-node), 8000:8000 (fastapi), 5173:5173 (frontend) | Varies |

---

## Notes

- Frontend `VITE_API_BASE_URL` should include the `/api/v1` prefix
- Backend Node `.env` `PORT=4000` is used in Docker; `.env.example` defaults to `3000`
- JWT secrets should be at least 32 characters in production
- DB `DATABASE_URL` uses `?schema=auth` suffix in `.env.example`
- FastAPI DB URL uses `postgresql+asyncpg://` driver prefix
