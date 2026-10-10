# Backend-Node Modules

> Feature modules, primary responsibilities, key coordinates, and dependencies within `backend-node`.

---

## 1. Auth & Session Module
- **Purpose**: JWT access/refresh token lifecycle, password authentication, email tokens, session table records.
- **Key Files**: `src/routes/authRoutes.ts`, `src/controllers/authController.ts`, `src/services/authService.ts`, `src/services/tokenService.ts`, `src/middleware/auth.ts`.
- **Dependencies**: `prisma.user`, `prisma.session`, `bcryptjs`, `jsonwebtoken`.
- **Search Hints**: `authService.login`, `tokenService.generateAccessToken`, `authController.refreshToken`.

---

## 2. Multi-Tenant & Slug Compatibility Module
- **Purpose**: Tenant context resolution (`req.tenantId`), slug routing (`/:slug/*`), company requests and onboarding.
- **Key Files**: `src/routes/slugCompatRoutes.ts`, `src/routes/companyRoutes.ts`, `src/middleware/tenantContext.ts`, `src/services/tenant/tenantService.ts`.
- **Dependencies**: `prisma.tenant`, `prisma.tenantAdmin`, `prisma.companyRequest`.
- **Search Hints**: `tenantContext`, `resolveTenantOr404`, `slugAuthMiddleware`.

---

## 3. KYC Verification Module
- **Purpose**: Identity document intake, auto-verification handoff to FastAPI, manual review queues, reviewer decisions.
- **Key Files**: `src/routes/kycRoutes.ts`, `src/controllers/kycController.ts`, `src/services/kycService.ts`, `src/services/ocrService.ts`.
- **Dependencies**: `prisma.kycApplication`, `prisma.oCRResult`, `prisma.faceVerification`, `FastAPI`.
- **Search Hints**: `kycService.submitKyc`, `kycService.approveKyc`, `kycController.submit`.

---

## 4. Statement & Financial Profile Module
- **Purpose**: Bank statement parsing (CSV/XLSX/PDF), categorization, cashflow metrics, savings rate derivation, stampede-protected caching.
- **Key Files**: `src/routes/uploadRoutes.ts`, `src/controllers/uploadController.ts`, `src/services/statementParserService.ts`, `src/services/financialProfileService.ts`, `src/services/cache/cacheManager.ts`.
- **Dependencies**: `prisma.bankStatement`, `prisma.transaction`, `prisma.financialProfile`, `cacheManager`.
- **Search Hints**: `statementParserService.parseStatementFile`, `financialProfileService.getProfile`, `cacheManager.getOrSet`.

---

## 5. Loan Underwriting & Origination Module
- **Purpose**: Loan applications, rule-based assessment, EMI calculator, ML risk proxying to FastAPI, loan account tracking.
- **Key Files**: `src/routes/loanRoutes.ts`, `src/routes/loanAssessmentRoutes.ts`, `src/controllers/loanController.ts`, `src/services/loanService.ts`, `src/services/loanAssessmentService.ts`.
- **Dependencies**: `prisma.loanApplication`, `prisma.loanAssessment`, `prisma.loanAccount`, `finguardProxyService`.
- **Search Hints**: `loanService.applyForLoan`, `loanAssessmentService.assessWithFinguard`, `loanController.review`.

---

## 6. Realtime Sockets & Notifications Module
- **Purpose**: WebSocket delivery of unread badges, chat messages, presence registry, token auth caching, sliding rate limit.
- **Key Files**: `src/server.ts`, `src/config/socket.ts`, `src/services/cache/socketCache.ts`, `src/services/notificationService.ts`, `src/routes/notificationRoutes.ts`.
- **Dependencies**: `socket.io`, `socketCache`, `prisma.notification`.
- **Search Hints**: `socketCache.registerConnection`, `notificationService.create`, `emitRealtime`.

---

## 7. Chatbot & NLU Module
- **Purpose**: Conversational financial advisor, intent classification, transaction summaries, multi-participant room sync.
- **Key Files**: `src/routes/chatbotRoutes.ts`, `src/controllers/chatbotController.ts`, `src/services/chatbotService.ts`.
- **Dependencies**: `prisma.chatConversation`, `prisma.nluQuery`, `cacheManager`, `socketCache`.
- **Search Hints**: `chatbotService.processQuery`, `chatbotService.sendMessage`, `classifyIntent`.

---

## 8. Supercontroller Platform Module
- **Purpose**: Cross-tenant monitoring, feature flag toggles, tenant provisioning, system audit queries.
- **Key Files**: `src/routes/supercontrollerRoutes.ts`, `src/services/supercontroller/supercontrollerService.ts`, `src/middleware/requireSupercontroller.ts`.
- **Dependencies**: `prisma.supercontroller`, `prisma.tenant`, `prisma.featureToggle`.
- **Search Hints**: `supercontrollerService.getAllTenants`, `supercontrollerService.toggleFeature`.
