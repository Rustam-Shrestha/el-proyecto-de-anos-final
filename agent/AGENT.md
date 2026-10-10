# AGENT.md

> Canonical project knowledge
> Read once per session

## 1. Tech Stack

- **Frontend**: React 18 / 19, TypeScript, Vite, Redux Toolkit, TanStack React Query, Tailwind CSS, Lucide React, Socket.io-client
- **API Gateway & Core Backend (`backend-node`)**: Node.js 22+, Express 5, TypeScript (`tsc` + `tsc-alias`), Prisma ORM 7.8 (`@prisma/client`, `@prisma/adapter-pg`), PostgreSQL 16 (schemas: `auth`, `public`), Redis 6 / `ioredis` (with LRU InMemoryFallback), Socket.io 4.8, JWT (`jsonwebtoken`), Zod, Pino / Pino-HTTP
- **ML & Computer Vision Microservice (`backend-fastapi`)**: Python 3.10+, FastAPI, Uvicorn, SQLAlchemy asyncpg, PaddleOCR, EasyOCR, DeepFace (Facenet), Scikit-learn / LightGBM (`finguard_model_v1.3.0`), OpenCV

---

## 2. Boot Flow

### Backend Node (`backend-node/src/server.ts`)
1. **Load Environment**: `backend-node/src/config/env.ts` validates env vars via Zod schema.
2. **HTTP & Socket Server**: Creates `http.createServer(app)` and binds Socket.io instance (`setIO(io)` in `backend-node/src/config/socket.ts`).
3. **Socket Auth Middleware**: `io.use` checks `socketCache.getCachedTokenPayload()` -> falls back to `jwt.verify()` -> caches token payload (120s TTL).
4. **Socket Handlers**: Registers user connection & presence in `socketCache`, binds rooms (`user:<id>`, `conversation:<id>`), sets up chat & notification listeners.
5. **Database Ping**: Executes `prisma.$queryRaw\`SELECT 1\`` against PostgreSQL.
6. **Background Hygiene Jobs**:
   - `resetStaleOcrJobs()` (`backend-node/src/jobs/ocrProcessingJob.ts`): Recovers OCR jobs stuck in `PROCESSING` from previous crashes.
   - `auditService.trimOldLogs(180)` (`backend-node/src/services/auditService.ts`): Prunes audit logs older than retention policy.
7. **Listener**: Starts HTTP on `PORT` (default: 4000).

### Backend FastAPI (`backend-fastapi/main.py`)
1. **Lifespan Context**: Initializes async DB connection (`init_db()`), checks ML model candidate paths (`finguard_model_v1.3.0/finguard_artifacts`).
2. **Predictor Warmup**: Loads `model.pkl`, `model_manifest.json`, `preprocessing.json`, and invokes warmup prediction.
3. **Routers**: Mounts `/api/v1` routes (`kyc`, `financial_ocr`, `nlu`, `finguard`).
4. **Listener**: Uvicorn runs on port 8000.

### Frontend (`frontend/src/main.tsx`)
1. **Root Mounting**: Renders React tree with `ReduxProvider` (`store.ts`), `QueryClientProvider` (`queryClient.ts`), and `RouterProvider` (`router.tsx`).
2. **Route Guards**: `ProtectedRoute` checks JWT auth; `RoleProtectedRoute` validates user role against route permission array.

---

## 3. Architecture Rules

1. **Multi-Tenancy Isolation**:
   - `tenantContext` middleware intercepts `/api/v1/*` and attaches `req.tenantId` / `req.tenantSlug`.
   - All tenant queries filter by `tenantId` (default tenant: 1).
   - Compatibility router (`backend-node/src/routes/slugCompatRoutes.ts`) mounts at root (`/`) for `/:slug/*` company endpoints.
2. **Database Access**:
   - ONLY use Prisma (`backend-node/src/config/database.ts`). No raw query string concatenation.
   - Raw queries (`prisma.$queryRawUnsafe`) are restricted to aggregate trend statements requiring PostgreSQL date truncation functions.
3. **Caching Layer Rules**:
   - Use `cacheManager` (`backend-node/src/services/cache/cacheManager.ts`) with stampede protection (`getOrSet`) for expensive aggregate queries.
   - Socket state, presence, and chat history MUST use `socketCache` (`backend-node/src/services/cache/socketCache.ts`).
   - Mutations MUST invalidate relevant cache keys immediately.
4. **Path Aliases**:
   - Backend: `@/*`, `@config/*`, `@controllers/*`, `@services/*`, `@routes/*`, `@middleware/*`, `@models/*`, `@utils/*`.
   - Frontend: `@app/*`, `@shared/*`, `@features/*`, `@components/*`, `@hooks/*`, `@services/*`, `@config/*`, `@utils/*`.
   - Never use relative imports spanning multiple directory levels (`../../..`).

---

## 4. Repository Layout

```
.
├── backend-node/                 # Primary Express + Prisma API
│   ├── prisma/
│   │   └── schema.prisma         # Single source of truth for database schema
│   └── src/
│       ├── app.ts                # Express app setup, CORS, Helmet, router mounting
│       ├── server.ts             # HTTP + Socket.io entry point & hygiene jobs
│       ├── config/               # env.ts, database.ts, logger.ts, socket.ts
│       ├── controllers/          # HTTP request handlers
│       ├── jobs/                 # Background queues (ocrProcessingJob.ts)
│       ├── middleware/           # auth.ts, rbac.ts, tenantContext.ts, upload.ts
│       ├── routes/               # Express sub-routers & Zod schemas
│       ├── services/             # Core business logic layer
│       │   ├── cache/            # redisClient.ts, cacheManager.ts, socketCache.ts
│       │   ├── ml/               # creditScoringService.ts
│       │   ├── rbac/             # permissionResolver.ts
│       │   ├── supercontroller/  # supercontrollerService.ts
│       │   └── tenant/           # tenantService.ts
│       └── utils/                # AppError.ts, apiResponse.ts, roles.ts
├── backend-fastapi/              # Python ML & Computer Vision Microservice
│   ├── main.py                   # FastAPI app, lifespan, model warm-up
│   └── app/
│       ├── api/v1/               # Router aggregation
│       ├── routes/               # kyc.py, financial_ocr.py, finguard.py, nlu.py
│       └── services/             # Face verification, OCR, ML predictor
├── frontend/                     # React 18+ Vite SPA
│   └── src/
│       ├── app/                  # router.tsx, ProtectedRoute.tsx, store.ts, queryClient.ts
│       ├── features/             # auth/, dashboard/, kyc/, loans/, profile/, company/
│       ├── shared/               # layouts/DashboardLayout.tsx, ui/, components/
│       └── services/             # apiService.ts, authService.ts, kycApi.ts
├── agent/                        # Token-efficient autonomous agent documentation
├── docs/                         # Synchronized project documentation
└── legacy/                       # Archived legacy markdown files & prompt specs
```

---

## 5. Global Hooks & Middleware

| Middleware | File Path | Guard Target | Behavior |
|---|---|---|---|
| `tenantContext` | `backend-node/src/middleware/tenantContext.ts` | All `/api/v1/*` routes | Resolves tenant by header/subdomain/slug, injects `req.tenantId` |
| `requireAuth` | `backend-node/src/middleware/auth.ts` | Protected endpoints | Validates Bearer JWT, populates `req.user` |
| `requireRole` / `requireAnyRole` | `backend-node/src/middleware/rbac.ts` | Role-gated endpoints | Enforces canonical roles: `ADMIN`, `USER`, `REVIEWER`, `SUPERADMIN` |
| `validateRequest` | `backend-node/src/middleware/requestValidation.ts` | Request payloads | Validates `req.body`, `req.query`, or `req.params` via Zod schema |
| `slugAuthMiddleware` | `backend-node/src/middleware/slugAuth.ts` | Slug routes `/:slug/*` | Validates multi-tenant company JWT tokens |
| `requireSupercontroller` | `backend-node/src/middleware/requireSupercontroller.ts` | `/api/v1/supercontroller/*` | Restricts access strictly to supercontrollers |
| `errorHandler` | `backend-node/src/middleware/errorHandler.ts` | All Express routes | Global exception handler: maps `AppError`, Prisma errors to JSON |

---

## 6. Services Layer

See [services.md](services.md) for full method signatures and call graphs.

- **`authService`**: User registration, login, token refresh, password reset.
- **`tokenService`**: JWT generation & verification (`generateAccessToken`, `generateCompatToken`).
- **`tenantService`**: Tenant creation, slug lookup, multi-tenant workspace context.
- **`kycService`**: KYC submission lifecycle (`submitKyc`, `approveKyc`, `rejectKyc`).
- **`ocrService`**: Bridge between Node and FastAPI OCR/face matching microservice.
- **`statementParserService`**: Parses bank statement spreadsheets/PDFs into structured transactions.
- **`financialProfileService`**: Computes aggregated savings rate, monthly trends, expense ratios.
- **`loanService`**: Loan application submission, status transitions, review workflow.
- **`loanAssessmentService`**: Algorithmic & ML loan scoring (`assess`, `assessWithFinguard`).
- **`cacheManager`**: Single-flight stampede-protected caching with TTL & wildcard invalidation.
- **`socketCache`**: Token validation cache, user presence, chat history, and socket rate limiting.
- **`notificationService`**: Real-time push notifications and unread badge count tracking.
- **`chatbotService`**: NLU financial query processing and socket-based customer chat.
- **`supercontrollerService`**: Platform tenant onboarding, feature flags, global metrics.

---

## 7. Reusable Components (Frontend)

- **Layouts**: `frontend/src/shared/layouts/DashboardLayout.tsx` (Sidebar, Navbar, UserMenu, TenantBadge).
- **Navigation**: `frontend/src/shared/layouts/Sidebar.tsx` (Role-aware menu links).
- **Route Protectors**:
  - `frontend/src/app/ProtectedRoute.tsx`: Checks auth state and token expiry.
  - `frontend/src/app/RoleProtectedRoute.tsx`: Checks user role against allowed roles list.
- **UI System**:
  - Tables: `frontend/src/features/dashboard/components/`
  - Cards & Badges: `frontend/src/shared/components/`
  - Modals & Dialogs: `frontend/src/features/kyc/components/`

---

## 8. State Management

- **Redux Toolkit (`frontend/src/app/store.ts`)**:
  - `authSlice`: Stores authenticated user token, user record, company slug, tenantId.
- **TanStack Query (`frontend/src/app/queryClient.ts`)**:
  - Default `staleTime`: 1 minute, `cacheTime`: 5 minutes.
  - Handles server cache invalidation for loans, KYC applications, profiles, and notifications.
- **Socket Client**:
  - Singleton Socket.io client subscribing to `notification:new`, `notification:unread_count`, `chat:message`.

---

## 9. Utilities

- `backend-node/src/utils/AppError.ts`: Operational error class with HTTP status code.
- `backend-node/src/utils/roles.ts`: `normalizeRoleName()`, `roleKind()`, `roleLabel()`, `normalizePan()`.
- `backend-node/src/utils/apiResponse.ts`: Standard JSON envelopes (`successResponse`, `errorResponse`).
- `backend-node/src/utils/pagination.ts`: Pagination query parameter parser (`limit`, `offset`, `page`).

---

## 10. Feature Modules

See [modules.md](modules.md) for module-by-module breakdown.

1. **Auth & Identity**: JWT issuance, login, registration, email verification, password reset.
2. **Multi-Tenant Architecture**: Multi-company workspaces, custom slugs, invitation codes.
3. **KYC & Document Verification**: Identity card OCR, selfie facial match, reviewer approvals.
4. **Financial Statement Analysis**: Bank statement processing, category tagging, cash-flow trends.
5. **Loan Origination & Assessment**: Application submission, rule-based assessment, ML scoring.
6. **Chatbot & Customer Support**: Conversational NLU financial advisor and lender chat.
7. **Real-time Notifications**: Socket.io event delivery and unread count badges.
8. **Supercontroller Platform Ops**: Tenant management, feature toggling, audit trails.

---

## 11. Search Strategy

**Mandatory search sequence before modifying code:**

```bash
# 1. Search unique function or identifier
rg "recalculateFinancialProfile"
rg "assessWithFinguard"

# 2. Search service object or class definition
rg "export const loanService"
rg "export class CacheManager"

# 3. Search exact route path
rg "router\.post\('/submit'"
rg "path: \"kyc-submit\""

# 4. Search Prisma entity name
rg "model LoanApplication"
rg "prisma\.notification\.create"
```

**Anti-Patterns (DO NOT DO):**
- ❌ `rg user` (Too generic; yields 10,000+ matches).
- ❌ `rg data` (Useless context waste).
- ❌ Opening entire service directories blindly without searching first.

---

## 12. Agent Rules

1. **Search Before Reading**: Run targeted `rg` queries before viewing entire files.
2. **Read Before Editing**: View the exact line ranges and interfaces before applying modifications.
3. **Reuse Before Creating**: Always inspect existing services (`services.md`) before writing new utility logic.
4. **Extend Before Rewriting**: Extend existing controllers, routes, and services rather than creating duplicates.
5. **Never Hardcode Routes**: Reference canonical routes defined in [routes.md](routes.md).
6. **Never Bypass Tenant Filter**: Every database query touching tenant-scoped entities MUST enforce `tenantId`.
7. **Preserve Caching & Sockets**: Maintain stampede protection (`cacheManager.getOrSet`) and invalidate caches upon mutation.

---

## 13. Shipping Checklist

- [ ] Target functions located using targeted `rg` search.
- [ ] Existing service logic reused; no duplicate helpers created.
- [ ] Prisma schema relationships respected (`backend-node/prisma/schema.prisma`).
- [ ] Tenant isolation verified (`where: { tenantId }`).
- [ ] Caches updated or invalidated (`cacheManager`, `socketCache`).
- [ ] Backend types and linting verified: `npm run lint` in `backend-node`.
- [ ] Frontend types and build verified: `npm run build` or `npm run lint` in `frontend`.
- [ ] Unit tests executed and passing: `npm test` in `backend-node`.
