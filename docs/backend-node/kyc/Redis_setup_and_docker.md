# PERN Stack with Redis - Docker Setup and Implementation Guide

## Prerequisites

- Docker Desktop or Docker Engine + Docker Compose
- Docker Compose v1.29+ (`service_healthy` support required)
- Minimum 2GB RAM allocated to Docker
- Available ports:
  - `5173`
  - `4000`
  - `8000`
  - `5432`
  - `6379`

---

# Quick Start

```bash
cd d:\el-proyecto-de-anos-final

cp .env.example .env

docker compose up -d
```

---

# Access Applications

| Service | URL |
|---|---|
| Frontend | http://localhost:5173 |
| Node Backend | http://localhost:4000 |
| API Docs | http://localhost:4000/docs |
| FastAPI Backend | http://localhost:8080 |
| PostgreSQL | localhost:5432 |
| Redis | localhost:6379 |

---

# Stop Services

```bash
docker compose down
```

Stops containers while preserving volumes and data.

```bash
docker compose down -v
```

Stops containers and removes all associated volumes and data.

---

# Services Overview

## PostgreSQL

- Image: `postgres:16-alpine`
- Port: `5432`
- Volume:
  ```text
  postgres_data:/var/lib/postgresql/data
  ```
- Healthcheck enabled
- Database migrations:
  - `001_init.sql`
  - `kyc/001_create_kyc_tables.sql`

---

## Redis

- Image: `redis:7-alpine`
- Port: `6379`
- Volume:
  ```text
  redis_data:/data
  ```
- Persistence:
  - AOF enabled
- Healthcheck enabled

### Features

- Auto reconnect
- TTL support
- Data persistence

---

## Node.js Backend

- Port: `4000`
- Dependencies:
  - PostgreSQL
  - Redis

### Features

- Redis caching middleware
- JWT authentication with Redis
- Rate limiting
- Session management
- User data caching
- Hot reload enabled

---

## FastAPI Backend

- Port: `8000`
- Dependencies:
  - PostgreSQL
  - Redis
- Hot reload enabled

---

## React Frontend

- Port: `5173`
- Vite development server
- Hot Module Reload (HMR) enabled

---

# Environment Configuration

## Root `.env`

```env
DB_PASSWORD=postgres

JWT_ACCESS_SECRET=your_secret_min_16_chars
JWT_REFRESH_SECRET=your_secret_min_16_chars

REDIS_URL=redis://redis:6379

DATABASE_URL=postgresql://postgres:postgres@postgres:5432/pern_baseline

PORT=4000

VITE_API_BASE_URL=http://localhost:4000/api/v1

CORS_ORIGIN=http://localhost:5173,http://localhost:5176
```

---

## `backend-node/.env`

```env
NODE_ENV=development

PORT=4000

DATABASE_URL=postgresql://postgres:postgres@postgres:5432/pern_baseline

REDIS_URL=redis://redis:6379

JWT_ACCESS_SECRET=dev_secret_min_16_chars
```

---

## `frontend/.env`

```env
VITE_API_BASE_URL=http://localhost:4000/api/v1
```

---

# Redis Integration

## Redis Client

**File:**

```text
src/config/redis.ts
```

### Features

- Auto reconnect with exponential backoff
- Error handling and logging
- Graceful connection management

---

## Cache Middleware

**File:**

```text
src/middleware/cache.ts
```

### Features

- Generic cache middleware for GET requests
- Configurable TTL
- Cache key prefixes
- Cache invalidation utilities

### Example

```typescript
app.get("/users", cacheMiddleware({ ttl: 600 }), controller);
```

---

## Cache Service

**File:**

```text
src/services/cacheService.ts
```

### Features

- Refresh token management
- Access token blacklisting
- User data caching
- Session management
- Rate limiting
- Email verification codes
- Password reset tokens
- Generic cache operations

### Example

```typescript
await storeRefreshToken(user.id, token, 604800);
```

---

# Rate Limiting Example

```typescript
const { allowed, remaining } = await checkRateLimit(req.ip, 60, 100);

if (!allowed) {
  return res.status(429).json({
    message: "Too many requests"
  });
}
```

---

# Database Management

## Initialize Database

```bash
docker compose exec postgres psql -U postgres -d pern_baseline

docker compose exec postgres \
psql -U postgres -d pern_baseline \
-f /migrations/001_init.sql
```

---

## Backup Database

```bash
docker compose exec postgres \
pg_dump -U postgres pern_baseline > backup.sql
```

---

## Restore Database

```bash
docker compose exec -T postgres \
psql -U postgres pern_baseline < backup.sql
```

---

## Reset Everything

```bash
docker compose down -v

docker compose up -d
```

---

# Redis Management

## Open Redis CLI

```bash
docker compose exec redis redis-cli
```

---

## Useful Redis Commands

```bash
PING

KEYS *

GET <key>

DEL <key>

FLUSHDB

DBSIZE
```

---

## Redis Monitoring

```bash
docker compose exec redis redis-cli MONITOR

docker compose exec redis redis-cli INFO memory
```

---

# Development Workflows

## View Logs

```bash
docker compose logs -f

docker compose logs -f backend-node

docker compose logs --tail=50 backend-node
```

---

## Hot Reload

### Frontend

- Vite HMR

### Node Backend

- `tsx watch`

### FastAPI Backend

- `uvicorn --reload`

---

## Rebuild Containers

```bash
docker compose build
```

### Rebuild Specific Service

```bash
docker compose build backend-node
```

### Rebuild Without Cache

```bash
docker compose build --no-cache backend-node
```

---

# Shell Access

## Backend Node Container

```bash
docker compose exec backend-node sh
```

---

## FastAPI Container

```bash
docker compose exec backend-fastapi bash
```

---

## PostgreSQL Shell

```bash
docker compose exec postgres psql -U postgres
```

---

## Redis CLI

```bash
docker compose exec redis redis-cli
```

---

# Performance Monitoring

## Docker Resource Usage

```bash
docker stats
```

---

## PostgreSQL Query Performance

```sql
SELECT *
FROM pg_stat_statements
ORDER BY mean_time DESC
LIMIT 10;
```

---

## Redis Memory Usage

```bash
docker compose exec redis redis-cli INFO memory
```

---

# Security Notes

- Change all default secrets:
  - `JWT_ACCESS_SECRET`
  - `JWT_REFRESH_SECRET`
  - `DB_PASSWORD`

- Enable Redis authentication:

```yaml
command: redis-server --requirepass <password> --appendonly yes
```

- Use HTTPS with Nginx reverse proxy
- Remove public ports in production
- Never commit `.env` files
- Use proper secrets management in production

---

# Troubleshooting

## Services Not Starting

```bash
docker compose ps

docker compose logs backend-node

netstat -ano | findstr :4000
```

### macOS / Linux

```bash
lsof -i :4000
```

### Cleanup Docker System

```bash
docker system prune -a
```

---

# Database Issues

```bash
docker compose exec postgres \
psql -U postgres -d pern_baseline
```

```bash
docker compose exec backend-node \
env | grep DATABASE_URL
```

---

# Redis Issues

```bash
docker compose exec backend-node \
redis-cli -u redis://redis:6379 PING
```

```bash
docker compose logs redis
```

---

# Frontend Issues

```bash
docker compose exec frontend cat .env
```

```bash
docker compose exec frontend \
curl http://backend-node:4000/api/v1/health
```

---

# Clear Everything

```bash
docker compose down -v
```

```bash
docker rmi pern_backend_node pern_frontend pern_backend_fastapi
```

```bash
docker compose up --build -d
```

---

# API Endpoints

## Health Check

```bash
curl http://localhost:4000/api/v1/health
```

---

## Authentication Login

```bash
curl -X POST http://localhost:4000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email":"user@example.com",
    "password":"password"
  }'
```

---

## Refresh Token

```bash
curl -X POST http://localhost:4000/api/v1/auth/refresh \
  -H "Authorization: Bearer <refresh_token>"
```

---

# Documentation Links

- Docker Compose:
  https://docs.docker.com/compose/

- Redis:
  https://redis.io/docs/

- PostgreSQL:
  https://www.postgresql.org/docs/

- Express.js:
  https://expressjs.com/

- FastAPI:
  https://fastapi.tiangolo.com/

- React:
  https://react.dev/

---

# Project Structure

```text
project-root/
├── docker-compose.yml
├── .env.example
├── DOCKER_SETUP.md
├── REDIS_INTEGRATION.md
├── IMPLEMENTATION_SUMMARY.md
├── docker-helper.ps1
├── docker-helper.sh
└── backend-node/
    └── src/
        ├── config/
        │   └── redis.ts
        ├── middleware/
        │   └── cache.ts
        └── services/
            └── cacheService.ts
```

---

# Helper Scripts

## Windows

```bash
.\docker-helper.ps1 up

.\docker-helper.ps1 down

.\docker-helper.ps1 logs backend-node

.\docker-helper.ps1 redis
```

---

## macOS / Linux

```bash
chmod +x docker-helper.sh
```

```bash
./docker-helper.sh up

./docker-helper.sh down

./docker-helper.sh logs backend-node

./docker-helper.sh redis
```

---