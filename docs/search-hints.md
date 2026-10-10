# Search Hints (Ripgrep Optimization)

> High-ROI, non-generic search tokens designed for autonomous coding agents running `rg`.

---

### Feature: Multi-Tenant Authentication & Session Management
- **Primary Keywords**: `loginUser`, `generateAccessToken`, `generateCompatToken`, `verifyCompatToken`
- **Secondary Keywords**: `JWT_ACCESS_SECRET`, `authService.login`, `authService.register`, `slugAuthMiddleware`
- **High-Signal Functions**: `generateAccessToken()`, `verifyCompatToken()`, `resolveTenantOr404()`
- **Entry Points**: `POST /api/v1/auth/login`, `POST /:slug/login`
- **Likely Files**:
  - `backend-node/src/services/authService.ts`
  - `backend-node/src/services/tokenService.ts`
  - `backend-node/src/routes/slugCompatRoutes.ts`
  - `backend-node/src/middleware/auth.ts`

---

### Feature: Tenant Context & Workspace Isolation
- **Primary Keywords**: `tenantContext`, `ensureDefault`, `tenantId`, `CompanyRequest`
- **Secondary Keywords**: `featureMlScoring`, `featureAuditLogs`, `company_requests`
- **High-Signal Functions**: `tenantContext()`, `tenantService.findBySlug()`, `approveRequest()`
- **Entry Points**: `POST /api/v1/company/request`, `POST /api/v1/supercontroller/requests/:id/approve`
- **Likely Files**:
  - `backend-node/src/middleware/tenantContext.ts`
  - `backend-node/src/services/tenant/tenantService.ts`
  - `backend-node/src/services/supercontroller/supercontrollerService.ts`
  - `backend-node/prisma/schema.prisma`

---

### Feature: KYC Identity Verification & Face Matching
- **Primary Keywords**: `submitKyc`, `verify_kyc`, `face_match`, `KycApplicationDetail`
- **Secondary Keywords**: `verifyKycWithFastApi`, `citizenshipNumber`, `AUTO_VERIFIED`, `ManualReviewQueue`
- **High-Signal Functions**: `submitKyc()`, `approveKyc()`, `rejectKyc()`, `verify_kyc()`
- **Entry Points**: `POST /api/v1/kyc/submit`, `POST /api/v1/kyc/applications/:id/approve`
- **Likely Files**:
  - `backend-node/src/services/kycService.ts`
  - `backend-node/src/services/ocrService.ts`
  - `backend-fastapi/app/routes/kyc.py`
  - `frontend/src/features/kyc/pages/UserKYCPage.tsx`

---

### Feature: Bank Statement Parsing & Transaction Categorization
- **Primary Keywords**: `parseStatementFile`, `recalculateFinancialProfile`, `uploadStatement`
- **Secondary Keywords**: `balanceMismatch`, `savingsRate`, `debtToIncomeRatio`, `INCOME_ANALYSIS`
- **High-Signal Functions**: `parseStatementFile()`, `recalculateFinancialProfile()`, `getMonthlyTrends()`
- **Entry Points**: `POST /api/v1/uploads/statement`, `GET /api/v1/transactions`
- **Likely Files**:
  - `backend-node/src/services/statementParserService.ts`
  - `backend-node/src/services/financialProfileService.ts`
  - `backend-node/src/controllers/uploadController.ts`
  - `backend-node/src/jobs/ocrProcessingJob.ts`

---

### Feature: Loan Origination & Approval Decisioning
- **Primary Keywords**: `applyForLoan`, `reviewLoan`, `createAccount`, `loanOfficerDashboard`
- **Secondary Keywords**: `MD_TO_LEGACY_ROLE`, `CustomerApplyPage`, `loan_applications`
- **High-Signal Functions**: `applyForLoan()`, `reviewLoan()`, `createAccount()`
- **Entry Points**: `POST /api/v1/loan/apply`, `POST /api/v1/loan/applications/:id/review`, `POST /:slug/apply`
- **Likely Files**:
  - `backend-node/src/services/loanService.ts`
  - `backend-node/src/services/loanAccountService.ts`
  - `backend-node/src/routes/loanRoutes.ts`
  - `frontend/src/features/loans/pages/LoanApplicationPage.tsx`

---

### Feature: Loan Assessment & ML Risk Scoring
- **Primary Keywords**: `assessWithFinguard`, `predict_finguard`, `buildFinguardFeatures`, `LoanEligibilityCalculator`
- **Secondary Keywords**: `defaultProbability`, `riskLevel`, `affordabilityMultiplier`, `finguard_artifacts`
- **High-Signal Functions**: `assessWithFinguard()`, `predictDefault()`, `predict_finguard()`
- **Entry Points**: `POST /api/v1/loan-assessment/assess`, `POST /api/v1/loan-assessment/finguard`
- **Likely Files**:
  - `backend-node/src/services/loanAssessmentService.ts`
  - `backend-node/src/services/finguardProxyService.ts`
  - `backend-node/src/services/ml/creditScoringService.ts`
  - `backend-fastapi/app/routes/finguard.py`

---

### Feature: Stampede-Protected Caching & Sockets
- **Primary Keywords**: `getOrSet`, `socketCache`, `InMemoryFallback`, `checkRateLimit`
- **Secondary Keywords**: `getCachedTokenPayload`, `registerConnection`, `appendMessage`, `invalidatePattern`
- **High-Signal Functions**: `cacheManager.getOrSet()`, `socketCache.registerConnection()`, `purgeExpired()`
- **Entry Points**: `backend-node/src/server.ts` (`io.use`, `io.on('connection')`)
- **Likely Files**:
  - `backend-node/src/services/cache/cacheManager.ts`
  - `backend-node/src/services/cache/socketCache.ts`
  - `backend-node/src/services/cache/redisClient.ts`
  - `backend-node/src/server.ts`

---

### Feature: Real-time Notifications & Unread Counts
- **Primary Keywords**: `emitRealtime`, `invalidateUnreadCount`, `notification:unread_count`, `notification:new`
- **Secondary Keywords**: `getUnreadCount`, `markAllAsRead`, `user:<userId>`
- **High-Signal Functions**: `notificationService.create()`, `notificationService.getUnreadCount()`, `emitRealtime()`
- **Entry Points**: `GET /api/v1/notifications/unread-count`, Socket room `user:<userId>`
- **Likely Files**:
  - `backend-node/src/services/notificationService.ts`
  - `backend-node/src/controllers/notificationController.ts`
  - `backend-node/src/services/cache/socketCache.ts`

---

### Feature: Conversational Financial AI Chatbot
- **Primary Keywords**: `chatbotService.processQuery`, `sendMessage`, `chat:message`, `chat:cached_history`
- **Secondary Keywords**: `normalizeMessages`, `classifyIntent`, `nluQuery`
- **High-Signal Functions**: `chatbotService.sendMessage()`, `chatbotService.processQuery()`
- **Entry Points**: WebSocket `chat:message`, `POST /api/v1/chat/query`
- **Likely Files**:
  - `backend-node/src/services/chatbotService.ts`
  - `backend-node/src/controllers/chatbotController.ts`
  - `frontend/src/pages/chat/ChatPage.tsx`
  - `backend-fastapi/app/routes/nlu.py`
