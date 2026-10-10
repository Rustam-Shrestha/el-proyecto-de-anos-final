# AGENT.md (Backend Node API Gateway)

> Canonical knowledge for autonomous coding agents modifying `backend-node`.
> Read once per session before making modifications in this service.

## 1. Tech Stack
- **Runtime**: Node.js >= 22.0.0
- **Framework**: Express.js 5.2.1
- **Language**: TypeScript 6.0.3 (`tsc` + `tsc-alias`)
- **Database ORM**: Prisma 7.8.0 (`@prisma/client`, `@prisma/adapter-pg`)
- **Database Engine**: PostgreSQL 16 (schemas: `auth`, `public`)
- **Cache Engine**: Redis 6.0 / `ioredis` with high-performance `InMemoryFallback` (LRU, 10k capacity, active TTL sweep)
- **Real-Time Sockets**: Socket.io 4.8.1 with socket-level token & presence cache (`socketCache`)
- **Logging**: Pino 10.3 / `pino-http`
- **Validation**: Zod 4.4.3
- **Security**: Helmet, CORS origin validation, bcryptjs, jsonwebtoken

---

## 2. Boot Flow (`src/server.ts`)
1. **Config Validation**: `src/config/env.ts` parses and validates process environment variables.
2. **Server Creation**: `http.createServer(app)` created; bound to Socket.io server instance (`src/config/socket.ts`).
3. **Socket Handshake Guard**: `io.use()` validates JWTs against `socketCache` fast-path (120s TTL) before falling back to `jwt.verify()`.
4. **Socket Connection Setup**: On connection, registers user presence (`registerConnection`), joins rooms (`user:<userId>`), emits cached unread notification counts.
5. **Database Connection Probe**: `prisma.$queryRaw\`SELECT 1\`` checks DB liveness.
6. **Recovery Jobs**:
   - `resetStaleOcrJobs()` recovers jobs stuck in `PROCESSING` state from prior server reboots.
   - `auditService.trimOldLogs(180)` prunes rows older than 180 days.
7. **Port Listener**: Binds to `env.PORT` (default 4000).

---

## 3. Architecture Rules
1. **Always enforce Tenant Scope**: Any operation touching tenant-scoped tables (`users`, `kyc_applications`, `loan_applications`, `transactions`, `financial_profiles`) MUST include `tenantId` in queries.
2. **Prisma Exclusivity**: Never execute ad-hoc raw SQL string concatenation. Use Prisma client methods.
3. **Stampede Protected Caching**: Wrap expensive computations or aggregates in `cacheManager.getOrSet(key, fallback, ttl)`.
4. **Path Aliases**: Always use `@/*`, `@services/*`, `@routes/*`, `@controllers/*`, `@middleware/*`, `@config/*`.
5. **Clean Invalidation**: Every mutating controller/service method MUST invalidate its associated cache keys (`cacheManager.delete()`, `socketCache.invalidateUnreadCount()`).

---

## 4. Directory Layout
```
backend-node/
├── prisma/
│   ├── schema.prisma             # Canonical database schema & migrations
│   └── migrations/
├── src/
│   ├── app.ts                    # Express application configuration & root middleware
│   ├── server.ts                 # Server entry point, sockets & bootstrap jobs
│   ├── config/                   # env.ts, database.ts, logger.ts, socket.ts
│   ├── controllers/              # HTTP request handlers
│   ├── jobs/                     # ocrProcessingJob.ts
│   ├── middleware/               # auth.ts, rbac.ts, tenantContext.ts, upload.ts, errorHandler.ts
│   ├── routes/                   # Sub-routers & Zod validation schemas
│   ├── services/                 # Business logic, cacheManager, socketCache, loan, kyc, auth
│   │   ├── cache/                # redisClient.ts, cacheManager.ts, socketCache.ts
│   │   ├── ml/                   # creditScoringService.ts
│   │   ├── rbac/                 # permissionResolver.ts
│   │   ├── supercontroller/      # supercontrollerService.ts
│   │   └── tenant/               # tenantService.ts
│   └── utils/                    # AppError.ts, roles.ts, apiResponse.ts, pagination.ts
└── tests/                        # Jest test suites
```

---

## 5. Middleware Chain
1. `helmet({ crossOriginResourcePolicy: false })`
2. `cors({ origin: corsOrigin })`
3. `express.json({ limit: "1mb" })`
4. `pinoHttp({ logger })`
5. `tenantContext` (resolves tenantId and slug)
6. Feature route router (`/api/v1/*`)
7. `slugCompatRouter` (`/:slug/*` compatibility endpoints)
8. `notFoundHandler`
9. `errorHandler`

---

## 6. Search Strategy (Ripgrep Precision)
```bash
# Search service method definition
rg "async getFinancialProfile" src/services/

# Search controller handler
rg "export const reviewLoan" src/controllers/

# Search Express route mount
rg "router\.post\('/submit'" src/routes/

# Search Prisma model
rg "model KycApplication" prisma/schema.prisma
```

---

## 7. Shipping Checklist
- [ ] Prisma schema relations verified (`prisma/schema.prisma`).
- [ ] Tenant isolation verified (`tenantId`).
- [ ] Caches invalidated upon database mutations.
- [ ] Linter passing: `npm run lint`.
- [ ] Tests passing: `npm test`.
