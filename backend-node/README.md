# README.md — FinGuard Backend Node (Canonical Architecture & Engineering Guide)

> Source of truth for autonomous coding agents and senior engineers working in `backend-node`.
> Extracted directly from the actual codebase. Read once per session before touching code.
> **Philosophy:** Search → Map → Read → Reuse → Extend → Modify. Never duplicate logic. Ship right once.

---

## 1. TECH STACK (Confirmed from Codebase & Dependencies)

- **Runtime**: Node.js `>= 22.0.0`
- **HTTP Framework**: Express.js `5.2.1` (`express`)
- **Language / Transpiler**: TypeScript `6.0.3` (`typescript`, `tsc`, `tsc-alias`, `ts-node`, `tsx 4.22.3`)
- **Database ORM**: Prisma `7.8.0` (`@prisma/client`, `@prisma/adapter-pg`, `prisma`)
- **Database Engine**: PostgreSQL 16 (Multi-schema: `auth`, `public`)
- **Caching Layer**: Redis `6.0.0` (`ioredis`) + `InMemoryFallback` (LRU eviction, 10,000 entry cap, active 30s TTL background sweep)
- **Real-Time WebSockets**: Socket.io `^4.8.1` (`socket.io`) with socket-level token & presence caching (`socketCache`)
- **Authentication & Security**: JWT (`jsonwebtoken 9.0.3`), bcryptjs `3.0.3`, Helmet `8.1.0`, CORS `2.8.6`, Passport `0.7.0` (`passport-oauth2`)
- **Request Validation & Config**: Zod `4.4.3` (`zod`), dotenv `17.4.2`
- **File Ingestion & Parsing**: Multer `2.1.1`, pdf-parse `1.1.1`, SheetJS `xlsx 0.18.5`, form-data `4.0.5`
- **Logging & Telemetry**: Pino `10.3.1`, Pino-HTTP `11.0.0`, Morgan `1.10.1`, Winston `3.19.0`
- **Mail Delivery**: Nodemailer `8.0.7`
- **API Documentation**: Swagger UI Express `5.0.1`, Swagger-JSDoc `6.2.8`
- **Testing Engine**: Jest `30.4.2`, ts-jest `29.4.10`, Supertest `7.2.2`, pg-mem `3.0.14`

**Environment Variables (`backend-node/.env` validated via `src/config/env.ts`):**
- `PORT` (default: 4000)
- `NODE_ENV` (`development` | `production` | `test`)
- `DATABASE_URL` (PostgreSQL connection string with `?schema=auth`)
- `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET` (minimum 32-character HMAC secrets)
- `JWT_ACCESS_TTL` (default: `2h`), `JWT_REFRESH_TTL` (default: `7d`)
- `CORS_ORIGIN` (comma-separated allowed origins, default: `http://localhost:5173`)
- `REDIS_HOST`, `REDIS_PORT`, `REDIS_PASSWORD` (Redis connection parameters; falls back to in-memory cache if absent)
- `FASTAPI_URL` (default: `http://localhost:8000`, microservice endpoint for OCR and CV)
- `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS` (email delivery configuration)
- `AUDIT_LOG_RETENTION_DAYS` (default: 180)

---

## 2. BOOT SEQUENCE (`src/server.ts`) — Non-Negotiable Lifecycle

```
[1] Environment Validation (src/config/env.ts)
    └─ Zod schema validates all required strings, ports, and secret keys at process start.

[2] HTTP Server & Socket.io Initialization (src/server.ts, src/config/socket.ts)
    └─ http.createServer(app) instantiated.
    └─ new Server(httpServer, { cors }) bound and stored via setIO(io).

[3] Socket Handshake Authentication Guard (io.use in src/server.ts)
    └─ Checks token in handshake.auth.token or Authorization header.
    └─ Fast-Path: socketCache.getCachedTokenPayload(token) (120s TTL) avoids repeated JWT crypto CPU.
    └─ Miss-Path: jwt.verify(token, env.JWT_ACCESS_SECRET), caches user payload in socketCache.

[4] Socket Connection Registry (io.on('connection'))
    └─ Registers user presence: socketCache.registerConnection(userId, socket.id, meta).
    └─ Joins user private room: socket.join(`user:${user.id}`).
    └─ Dispatches cached unread notification counts: socketCache.getCachedUnreadCount(userId).
    └─ Binds chat room handlers (chat:join, chat:message) with rate limiting (max 60 msgs/min).
    └─ On disconnect: socketCache.unregisterConnection(userId, socket.id).

[5] Database Connection Probe
    └─ Executes prisma.$queryRaw`SELECT 1` against PostgreSQL. Exits on fatal failure.

[6] Startup Hygiene & Retention Jobs (Non-blocking / Best-effort)
    └─ resetStaleOcrJobs() (src/jobs/ocrProcessingJob.ts): Recovers jobs stuck in 'PROCESSING' across restarts.
    └─ auditService.trimOldLogs(retentionDays): Prunes audit logs older than retention policy.

[7] Port Listener
    └─ server.listen(PORT, 4000) with 120s HTTP keepAliveTimeout and headersTimeout.
```

---

## 3. STATE & DATA HIERARCHY (Non-Negotiable Architecture)

```
Primary Persistent Store → PostgreSQL 16 via Prisma ORM (@prisma/client)
                          Schemas: auth (users, loans, kyc, transactions, sessions)
                                   public (tenants, feature_toggles, tenant_metrics)
                          EVERY query touching tenant data MUST include { where: { tenantId } }.

Caching & Performance   → RedisConnection + CacheManager (src/services/cache/)
                          1. Stampede Protection: cacheManager.getOrSet() coalesces concurrent
                             cache-miss promises into a single in-flight DB call.
                          2. L1 Fallback: InMemoryFallback maintains 10,000 max entries with genuine
                             LRU eviction and unreferenced 30s background TTL sweep.
                          3. Socket Cache: socketCache maintains user presence, room histories,
                             verified JWT tokens, and unread notification counts.

Mutation Rule           → Any database create/update/delete MUST immediately invalidate
                          corresponding cache patterns (cacheManager.delete, socketCache.invalidateUnreadCount).
```

---

## 4. REPOSITORY LAYOUT (Actual Tree from Codebase)

```
backend-node/
├── prisma/
│   └── schema.prisma             # Canonical database schema definitions & relations (1,206 lines)
├── src/
│   ├── app.ts                    # Express app configuration, CORS, Helmet, Swagger, routes (64 lines)
│   ├── server.ts                 # Server entry point, Socket.io, connection lifecycle (221 lines)
│   ├── config/                   # Core application configuration
│   │   ├── env.ts                # Zod environment variable parsing
│   │   ├── database.ts           # PrismaClient instance with PostgreSQL connection
│   │   ├── logger.ts             # Pino structured JSON logger
│   │   └── socket.ts             # Global io instance getter and setter
│   ├── controllers/              # HTTP Request handlers (18 controllers)
│   │   ├── authController.ts     # User signup, login, refresh, password reset
│   │   ├── userController.ts     # User directory, profile updates, deletion
│   │   ├── kycController.ts      # KYC document uploads, status, approvals
│   │   ├── loanController.ts     # Loan application intake, reviewer decisioning
│   │   ├── loanAssessmentController.ts # Underwriting calculation & ML prediction proxy
│   │   ├── financialController.ts # Financial profiles, monthly trends, cashflow
│   │   ├── uploadController.ts   # Bank statement upload & file parsing triggers
│   │   ├── transactionController.ts # Transaction categorization & summaries
│   │   ├── chatbotController.ts  # NLU queries, conversation listings, messaging
│   │   ├── notificationController.ts # In-app notification mark-as-read & unread counts
│   │   ├── adminController.ts    # Dashboard KPI stats, audit trails
│   │   ├── portfolioController.ts # Customer loan portfolio and accounts
│   │   └── portfolioAdminController.ts # Bureau verification checklists
│   ├── jobs/                     # Asynchronous background job processors
│   │   └── ocrProcessingJob.ts   # Document text extraction queue & crash recovery (370 lines)
│   ├── middleware/               # Request pipelines and guards (15 middleware files)
│   │   ├── auth.ts               # Bearer JWT verification (requireAuth)
│   │   ├── rbac.ts               # Role-based access control (requireRole, requireAnyRole)
│   │   ├── tenantContext.ts      # Multi-tenant context extraction (tenantId, slug)
│   │   ├── slugAuth.ts           # Slug-scoped authentication (slugAuthMiddleware, slugCompanyGuard)
│   │   ├── requestValidation.ts  # Zod body/query/param schema validator (validateRequest)
│   │   ├── upload.ts             # Multer storage configuration for KYC files
│   │   ├── statementUpload.ts    # Multer configuration for statement spreadsheets/PDFs
│   │   ├── requireSupercontroller.ts # Supercontroller platform privileges guard
│   │   └── errorHandler.ts       # Global Express error and Prisma exception mapper
│   ├── routes/                   # Route aggregators and Zod schemas (28 files)
│   │   ├── index.ts              # /api/v1 router aggregation
│   │   ├── slugCompatRoutes.ts   # Multi-tenant root compat routes (/:slug/*, /login) (632 lines)
│   │   ├── authRoutes.ts         # /api/v1/auth endpoints
│   │   ├── kycRoutes.ts          # /api/v1/kyc endpoints
│   │   ├── loanRoutes.ts         # /api/v1/loan endpoints
│   │   ├── loanAssessmentRoutes.ts # /api/v1/loan-assessment endpoints
│   │   ├── financialRoutes.ts    # /api/v1/financial endpoints
│   │   ├── chatbotRoutes.ts      # /api/v1/chat endpoints
│   │   ├── notificationRoutes.ts # /api/v1/notifications endpoints
│   │   └── supercontrollerRoutes.ts # /api/v1/supercontroller endpoints
│   ├── services/                 # Business logic layer (28 files)
│   │   ├── authService.ts        # Credential checks, registration, token generation
│   │   ├── tokenService.ts       # JWT signing, claims encoding, multi-tenant compat tokens
│   │   ├── kycService.ts         # KYC submission, status updates, reviewer workflows
│   │   ├── loanService.ts        # Loan origination, underwriting review, accounts
│   │   ├── loanAssessmentService.ts # Financial scoring, EMI calculation, ML feature mapping
│   │   ├── statementParserService.ts # Bank statement CSV/XLSX parsing & profile recalculation
│   │   ├── financialProfileService.ts # Cached savings rate, income/expense aggregations
│   │   ├── chatbotService.ts     # Conversational intent parsing & message dispatch
│   │   ├── notificationService.ts # Real-time notification creation & socket emission
│   │   ├── auditService.ts       # Audit logging & database pruning
│   │   ├── ocrService.ts         # HTTP bridge to FastAPI ML service
│   │   ├── finguardProxyService.ts # HTTP bridge for ML default risk inference
│   │   ├── cache/                # High-performance caching infrastructure
│   │   │   ├── redisClient.ts    # ioredis client with LRU InMemoryFallback (214 lines)
│   │   │   ├── cacheManager.ts   # Single-flight stampede-protected cache (166 lines)
│   │   │   └── socketCache.ts    # Real-time socket token, presence, and chat history cache (226 lines)
│   │   ├── ml/creditScoringService.ts # ML credit risk proxy and local caching
│   │   ├── rbac/permissionResolver.ts # Role definitions & permission matrix
│   │   ├── supercontroller/      # Supercontroller & tenant monitoring services
│   │   └── tenant/tenantService.ts # Multi-tenant company provisioning
│   └── utils/                    # Shared engineering utilities
│       ├── AppError.ts           # Operational HTTP error class
│       ├── roles.ts              # Canonical role normalization (normalizeRoleName, normalizePan)
│       ├── apiResponse.ts        # Standardized JSON response envelope
│       └── pagination.ts         # Page and limit parsing
└── tests/                        # Comprehensive test suites
    ├── compat-multitenant.test.ts # Multi-tenant tokens, role mappings, notification safety
    └── cache-socket.test.ts      # LRU eviction, stampede protection, socket presence (13 tests)
```

---

## 5. MIDDLEWARE INVENTORY (`src/middleware/`)

| Middleware | File Path | Guard Target | Behavior & Signatures |
|---|---|---|---|
| `tenantContext` | `src/middleware/tenantContext.ts` | All `/api/v1/*` | Extracts `x-tenant-id`, subdomain, or slug; defaults to tenant `1`; attaches `req.tenantId` and `req.tenantSlug`. |
| `requireAuth` | `src/middleware/auth.ts` | Authenticated routes | Validates Bearer JWT via `tokenService.verifyAccessToken()`. Injects `req.user = { id, email, role, tenantId }`. Rejects with 401 on failure. |
| `requireRole` / `requireAnyRole` | `src/middleware/rbac.ts` | Role-gated routes | Normalizes role via `normalizeRoleName()`; validates against `ADMIN`, `USER`, `REVIEWER`, `SUPERADMIN`. Rejects with 403 on forbidden access. |
| `validateRequest` | `src/middleware/requestValidation.ts` | Request bodies / params | `validateRequest(zodSchema, 'body'\|'query'\|'params')`. Validates payload; formats 400 Bad Request with field-level error arrays. |
| `slugAuthMiddleware` | `src/middleware/slugAuth.ts` | Multi-tenant `/:slug/*` | Validates multi-tenant compat tokens, decodes company_id and customer_id, attaches `req.slugUser`. |
| `slugCompanyGuard` | `src/middleware/slugAuth.ts` | Multi-tenant `/:slug/*` | Ensures the authenticated token's company matches the requested URL slug parameter. |
| `requireSupercontroller` | `src/middleware/requireSupercontroller.ts` | `/api/v1/supercontroller/*` | Ensures requesting identity possesses valid platform supercontroller privileges. |
| `statementUpload` | `src/middleware/statementUpload.ts` | Statement upload routes | Multer instance handling `.pdf`, `.csv`, `.xlsx`, `.xls` up to 25MB; writes to `uploads/statements/`. |
| `upload` | `src/middleware/upload.ts` | KYC upload routes | Multer instance handling identity documents and selfies; writes to `uploads/kyc/`. |
| `errorHandler` | `src/middleware/errorHandler.ts` | Global Express error handler | Formats `AppError` and Prisma errors into consistent `{ success: false, message, code }` payloads. |

---

## 6. SERVICES LAYER INVENTORY (`src/services/`)

### `authService.ts`
- `register(input: RegisterInput): Promise<TokenResponse>`: Creates user account, hashes password via bcryptjs (12 rounds), assigns default USER role, creates profile.
- `login(input: LoginInput): Promise<TokenResponse>`: Verifies credentials, normalizes roles, issues access + refresh token, records session in `auth.sessions`.
- `refreshToken(refreshToken: string): Promise<TokenResponse>`: Validates refresh token, checks database session, rotates tokens.
- `logout(userId: string): Promise<void>`: Deletes active user sessions from `auth.sessions`.

### `tokenService.ts`
- `generateAccessToken(payload): string`: Signs HS256 JWT with `env.JWT_ACCESS_SECRET` (`expiresIn: '2h'`).
- `generateRefreshToken(payload): string`: Signs HS256 JWT with `env.JWT_REFRESH_SECRET` (`expiresIn: '7d'`).
- `generateCompatToken(claims): string`: Signs multi-tenant token including `sub`, `email`, `role`, `company_id`, `customer_id`, `iss: 'finguard'`, `aud: 'finguard-app'`.
- `verifyCompatToken(token): CompatTokenPayload | null`: Decodes and verifies token; supports backward compatibility for legacy non-audience tokens.

### `kycService.ts`
- `submitKyc(input, tenantId?): Promise<KycApplicationDetail>`: Creates `auth.kyc_applications`, initiates FastAPI verification (`ocrService.verifyKycWithFastApi`), creates OCR and face records, dispatches reviewer notification.
- `getKycStatus(userId, tenantId?): Promise<KycApplicationDetail | null>`: Fetches latest KYC status for user.
- `approveKyc(kycId, reviewerId, tenantId?): Promise<KycApplicationDetail>`: Transitions status to `VERIFIED`, updates user verification flag, notifies user.
- `rejectKyc(kycId, reviewerId, reason, tenantId?): Promise<KycApplicationDetail>`: Transitions status to `REJECTED`, records reason, notifies user.

### `statementParserService.ts`
- `parseStatementFile(filePath, userId, tenantId?): Promise<string>`: Ingests CSV/XLSX, extracts transactions, categorizes lines (`INCOME`, `EXPENSE`, `EMI`), creates `auth.transactions`.
- `recalculateFinancialProfile(userId): Promise<void>`: Aggregates total transactions, computes average monthly income/expenses, savings rate, stability score; upserts `auth.financial_profiles`; invalidates cache keys `financial_profile:${userId}*`.

### `financialProfileService.ts`
- `getProfile(userId, tenantId?): Promise<FinancialProfile>`: Fetches profile wrapped in `cacheManager.getOrSet('fin_profile:${userId}:${tid}', ..., 300)`.
- `getMonthlyTrends(userId, tenantId?): Promise<Array<{ month, income, expense }>>`: Aggregates monthly transactions wrapped in `cacheManager.getOrSet('fin_trends:${userId}:${tid}', ..., 300)`.
- `recalculate(userId, tenantId?): Promise<FinancialProfile>`: Invalidates cache patterns `fin_*:${userId}:*` and recalculates profile via `statementParserService`.

### `loanService.ts`
- `applyForLoan(userId, data, tenantId?): Promise<LoanApplication>`: Validates applicant KYC, creates `auth.loan_applications` in `SUBMITTED` state, notifies officers.
- `reviewLoan(loanId, reviewerId, decision, notes?, tenantId?): Promise<LoanApplication>`: Transitions application to `APPROVED` or `REJECTED`. If approved, dispatches `loanAccountService.createAccount()`, sends email via `mailService`, emits Socket.io update.

### `loanAssessmentService.ts`
- `assess(userId, requestedAmount, tenureMonths?, interestRate?): Promise<LoanAssessmentResult>`: Rule-based underwriting calculator (stability score, savings score, DTI ratio, affordability multiplier, max EMI).
- `assessWithFinguard(userId, requestedAmount, tenureMonths?, interestRate?): Promise<FinguardAssessmentResult>`: Assembles 20+ feature attributes (`buildFinguardFeatures`) and calls FastAPI `/api/v1/finguard/predict`. Persists result in `auth.loan_assessments`.

### `cacheManager.ts` (Stampede-Protected Cache)
- `getOrSet<T>(key, fallback, ttlSeconds=3600): Promise<T>`: Single-flight mutex pattern. If 50 parallel requests miss the cache, only 1 DB query runs; all 50 resolve the same promise.
- `getJson<T>(key): Promise<T | null>`, `setJson<T>(key, value, ttl?): Promise<void>`: Safe typed JSON caching.
- `incr(key, ttl?): Promise<number>`: Atomic counter increment with expiration.
- `delete(key): Promise<void>`, `invalidatePattern(pattern): Promise<void>`: Wildcard pattern key invalidation.

### `socketCache.ts` (Real-Time Socket Caching)
- `getCachedTokenPayload(rawToken): Promise<SocketUserPayload | null>`: SHA-256 hashed token cache (120s TTL) eliminating crypto JWT verification on reconnect storms.
- `registerConnection(userId, socketId, meta?): Promise<void>`: Registers socket ID in user presence cache (`socket:presence:${userId}`).
- `unregisterConnection(userId, socketId): Promise<{ remainingSockets }>`: Deregisters socket; marks offline when 0 sockets remain.
- `getRecentMessages(conversationId): Promise<CachedConversationMessage[] | null>`: Retrieves cached chat history (last 50 messages).
- `appendMessage(conversationId, message, maxHistory=50): Promise<void>`: Appends message to cached history without DB re-queries.
- `checkRateLimit(identifier, action?, limit=60, windowSeconds=60): Promise<{ allowed, remaining }>`: Sliding window atomic rate limiter.
- `getCachedUnreadCount(userId): Promise<number | null>`, `setCachedUnreadCount(userId, count, ttl=300): Promise<void>`, `invalidateUnreadCount(userId): Promise<void>`.

### `notificationService.ts`
- `create(input: CreateNotificationInput): Promise<void>`: Fire-and-forget in-app notification insertion; invalidates `socketCache` unread count; emits realtime Socket.io event `notification:new` and `notification:unread_count` to `user:<userId>`.
- `getUnreadCount(userId, tenantId?): Promise<number>`: Reads cached unread count via `socketCache.getCachedUnreadCount()`; falls back to `prisma.notification.count` and warms cache.
- `markAsRead(notificationId, tenantId?): Promise<Notification>`: Updates status to `READ`, invalidates cached unread count.

### `chatbotService.ts`
- `processQuery(userId, message, sessionId): Promise<QueryResult>`: Classifies financial intents (`LOAN_ELIGIBILITY`, `INCOME_ANALYSIS`, `SPENDING_PATTERN`, `SAVINGS_ANALYSIS`), executes financial calculations, logs NLU query.
- `sendMessage(userId, conversationId, content): Promise<SendMessageResult>`: Persists message in `auth.chat_conversations`, updates context, returns updated message thread.

---

## 7. DATABASE & PRISMA SCHEMA (`prisma/schema.prisma`)

### Schema & Entity Mapping
- **Schema `auth`**:
  - `users`: Primary identity (`id`, `email`, `passwordHash`, `roleId`, `tenantId`, `isVerified`).
  - `roles`: Role definitions (`ADMIN`, `USER`, `REVIEWER`, `SUPERADMIN`).
  - `sessions`: Active refresh sessions (`token`, `expiresAt`, `userId`).
  - `tenants`: Multi-tenant companies (`id`, `slug`, `name`, `panNumber`, `joinMode`, `status`).
  - `tenant_admins`: Company admin bindings (`tenantId`, `userId`, `email`).
  - `company_requests`: Onboarding requests awaiting Supercontroller review.
  - `kyc_applications`: Identity verification entries (`userId`, `status`, `idType`, `documentNumber`).
  - `ocr_results`: Structured OCR extraction data linked 1:1 to KYC application.
  - `face_verifications`: DeepFace match score and distance linked 1:1 to KYC application.
  - `bank_statements`: Statement file records (`userId`, `bankName`, `accountNumber`).
  - `transactions`: Categorized transactions (`date`, `description`, `debit`, `credit`, `category`).
  - `financial_profiles`: Aggregated financial health metrics (`avgMonthlyIncome`, `savingsRate`, `dtiRatio`).
  - `loan_applications`: Borrower requests (`userId`, `amount`, `tenureMonths`, `purpose`, `status`).
  - `loan_assessments`: Underwriting results (`eligibilityScore`, `riskLevel`, `defaultProbability`).
  - `loan_accounts`: Disbursed loan repayment ledgers (`outstandingBalance`, `emiAmount`, `nextDueDate`).
  - `chat_conversations`: JSON message threads between customers and advisors.
  - `notifications`: User notifications (`type`, `title`, `message`, `status`, `priority`).
  - `audit_logs`: Regulatory audit trail (`userId`, `action`, `entityType`, `metadata`).
- **Schema `public`**:
  - `feature_toggles`: Tenant feature flags (`tenantId`, `featureName`, `isEnabled`).
  - `tenant_metrics`: Daily usage KPIs (`totalUsers`, `totalLoans`, `apiCalls`, `errorRate`).
  - `supercontroller_audit_logs`: Platform administrative action log.

---

## 8. DOMAIN & BUSINESS RULES

### 1. Multi-Tenant Role Normalization (`src/utils/roles.ts`)
- `company_admin` → canonical role `ADMIN`
- `reviewer`, `approver`, `Validator` → canonical role `REVIEWER`
- `customer` → canonical role `USER`
- `supercontroller` → canonical role `SUPERADMIN`

### 2. Loan Underwriting Formulas (`LoanEligibilityCalculator` in `chatbotService.ts`)
- **Income Stability Score**: $\ge 70 \rightarrow 30\text{ pts}$, $\ge 50 \rightarrow 25\text{ pts}$, $\ge 30 \rightarrow 15\text{ pts}$, else $5\text{ pts}$.
- **Savings Rate Score**: $\ge 30\% \rightarrow 25\text{ pts}$, $\ge 20\% \rightarrow 20\text{ pts}$, $\ge 10\% \rightarrow 15\text{ pts}$, $\ge 5\% \rightarrow 10\text{ pts}$.
- **Debt-To-Income (DTI) Score**: $\le 20\% \rightarrow 25\text{ pts}$, $\le 40\% \rightarrow 15\text{ pts}$, $\le 60\% \rightarrow 5\text{ pts}$, else $0\text{ pts}$.
- **Statement Duration Score**: $\ge 12\text{ months} \rightarrow 20\text{ pts}$, $\ge 6\text{ months} \rightarrow 10\text{ pts}$, else $0\text{ pts}$.
- **Monthly EMI Formula**:
  $$\text{EMI} = P \times \frac{r(1+r)^n}{(1+r)^n - 1}$$
  Where $P = \text{Requested Amount}$, $r = \frac{\text{Annual Rate}}{12 \times 100}$, $n = \text{Tenure Months}$.
- **Affordability Multiplier**:
  - $\frac{\text{EMI}}{\text{Monthly Income}} \le 30\% \rightarrow 1.0$ (Full eligibility)
  - $\frac{\text{EMI}}{\text{Monthly Income}} \le 40\% \rightarrow 0.7$
  - $\frac{\text{EMI}}{\text{Monthly Income}} > 40\% \rightarrow 0.3$

---

## 9. SEARCH STRATEGY (Ripgrep Optimization)

```bash
# 1. Search specific service function
rg "async recalculateFinancialProfile" src/services/
rg "async assessWithFinguard" src/services/

# 2. Search Express controller or route
rg "export const reviewLoan" src/controllers/
rg "router\.post\('/submit'" src/routes/

# 3. Search Prisma model and relations
rg "model LoanApplication" prisma/schema.prisma

# 4. Search caching and socket methods
rg "socketCache\.registerConnection" src/services/cache/
rg "cacheManager\.getOrSet" src/services/
```

---

## 10. SHIPPING CHECKLIST

- [ ] All database queries enforce `{ where: { tenantId } }` unless accessing global supercontroller tables.
- [ ] Mutating routes invalidate corresponding cache keys (`cacheManager.delete`, `socketCache.invalidateUnreadCount`).
- [ ] No raw SQL string interpolation; all queries executed through Prisma client methods.
- [ ] Socket emissions target specific rooms (`user:<userId>`, `conversation:<conversationId>`).
- [ ] Lint check passes: `npm run lint`.
- [ ] Test suites pass: `npm test`.
