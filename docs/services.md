# Services Architecture

> Definitive specification of backend service layers, signatures, callers, and dependencies.

---

### `authService`
- **File**: `backend-node/src/services/authService.ts`
- **Purpose**: Core identity lifecycle, credential verification, and session state.
- **Key Methods**:
  - `register(input: RegisterInput): Promise<TokenResponse>`
  - `login(input: LoginInput): Promise<TokenResponse>`
  - `logout(userId: string): Promise<void>`
  - `refreshToken(refreshToken: string): Promise<TokenResponse>`
  - `verifyEmail(token: string): Promise<void>`
  - `forgotPassword(email: string): Promise<void>`
  - `resetPassword(token: string, newPassword: string): Promise<void>`
  - `changePassword(userId: string, current: string, next: string): Promise<void>`
- **Called By**: `authController.ts`, `slugCompatRoutes.ts`
- **Calls Into**: `prisma.user`, `prisma.session`, `prisma.role`, `tokenService`, `mailService`, `bcryptjs`

---

### `tokenService`
- **File**: `backend-node/src/services/tokenService.ts`
- **Purpose**: Cryptographic token signing and validation for standard JWT and multi-tenant compat tokens.
- **Key Methods**:
  - `generateAccessToken(payload: AccessTokenPayload): string`
  - `generateRefreshToken(payload: RefreshTokenPayload): string`
  - `verifyAccessToken(token: string): AccessTokenPayload`
  - `verifyRefreshToken(token: string): RefreshTokenPayload`
  - `generateCompatToken(claims: CompatTokenClaims): string`
  - `verifyCompatToken(token: string): CompatTokenPayload | null`
- **Called By**: `authService.ts`, `slugCompatRoutes.ts`, `middleware/auth.ts`, `middleware/slugAuth.ts`
- **Calls Into**: `jsonwebtoken`, `env`

---

### `tenantService`
- **File**: `backend-node/src/services/tenant/tenantService.ts`
- **Purpose**: Workspace multi-tenancy operations and default tenant resolution.
- **Key Methods**:
  - `ensureDefault(): Promise<number>`
  - `findBySlug(slug: string): Promise<Tenant | null>`
  - `create(slug: string, name: string, domain?: string): Promise<Tenant>`
- **Called By**: `tenantContext.ts`, `companyRoutes.ts`, `supercontrollerService.ts`
- **Calls Into**: `prisma.tenant`

---

### `userService`
- **File**: `backend-node/src/services/userService.ts`
- **Purpose**: User profiling, tenant directory listing, and account management.
- **Key Methods**:
  - `getUserById(id: string): Promise<UserDetail>`
  - `listUsers(filter: UserFilterOptions): Promise<{ users: UserSummary[]; total: number }>`
  - `updateUser(id: string, data: UpdateUserData): Promise<UserDetail>`
  - `deleteUser(id: string): Promise<void>`
- **Called By**: `userController.ts`, `adminController.ts`
- **Calls Into**: `prisma.user`, `prisma.profile`, `prisma.role`

---

### `kycService`
- **File**: `backend-node/src/services/kycService.ts`
- **Purpose**: KYC submission processing, reviewer decision lifecycle, and status tracking.
- **Key Methods**:
  - `submitKyc(input: SubmitKycInput, tenantId?: number): Promise<KycApplicationDetail>`
  - `getKycStatus(userId: string, tenantId?: number): Promise<KycApplicationDetail | null>`
  - `getKycById(kycId: string, tenantId?: number): Promise<KycApplicationDetail>`
  - `listKycApplications(filter: KycFilterOptions): Promise<{ applications: KycApplicationDetail[]; total: number }>`
  - `approveKyc(kycId: string, reviewerId: string, tenantId?: number): Promise<KycApplicationDetail>`
  - `rejectKyc(kycId: string, reviewerId: string, reason: string, tenantId?: number): Promise<KycApplicationDetail>`
  - `requestResubmit(kycId: string, reviewerId: string, note: string, tenantId?: number): Promise<KycApplicationDetail>`
- **Called By**: `kycController.ts`
- **Calls Into**: `prisma.kycApplication`, `ocrService`, `notificationService`, `mailService`

---

### `ocrService`
- **File**: `backend-node/src/services/ocrService.ts`
- **Purpose**: Microservice communication gateway to Python FastAPI for OCR and biometric matching.
- **Key Methods**:
  - `callFinancialDocumentOcr(filePath: string): Promise<OcrResult>`
  - `callFinancialDocumentExtraction(filePath: string, docType: string): Promise<ExtractionResult>`
  - `verifyKycWithFastApi(frontPath: string, backPath: string, selfiePath: string): Promise<FastApiKycResult>`
- **Called By**: `ocrProcessingJob.ts`, `kycService.ts`, `uploadController.ts`
- **Calls Into**: `axios` (HTTP to `FASTAPI_URL`), Local Tesseract fallback

---

### `statementParserService`
- **File**: `backend-node/src/services/statementParserService.ts`
- **Purpose**: Ingestion of bank statement files, transaction deduplication, and financial metric derivation.
- **Key Methods**:
  - `parseStatementFile(filePath: string, userId: string, tenantId?: number): Promise<string>`
  - `recalculateFinancialProfile(userId: string): Promise<void>`
- **Called By**: `uploadController.ts`, `financialProfileService.ts`, `chatbotService.ts`
- **Calls Into**: `prisma.bankStatement`, `prisma.transaction`, `prisma.financialProfile`, `cacheManager`

---

### `financialProfileService`
- **File**: `backend-node/src/services/financialProfileService.ts`
- **Purpose**: Aggregates income, expense ratios, debt metrics, and monthly financial statements with caching.
- **Key Methods**:
  - `getProfile(userId: string, tenantId?: number): Promise<FinancialProfile>`
  - `recalculate(userId: string, tenantId?: number): Promise<FinancialProfile>`
  - `getMonthlyTrends(userId: string, tenantId?: number): Promise<Array<{ month: string; income: number; expense: number }>>`
  - `getCategoryBreakdown(userId: string, tenantId?: number): Promise<{ expenses: any[]; income: any[] }>`
- **Called By**: `financialController.ts`, `loanAssessmentService.ts`
- **Calls Into**: `cacheManager.getOrSet`, `statementParserService`, `prisma.financialProfile`, `prisma.transaction`

---

### `loanService`
- **File**: `backend-node/src/services/loanService.ts`
- **Purpose**: Loan application intake, validation, lifecycle transitions, and officer decisioning.
- **Key Methods**:
  - `applyForLoan(userId: string, data: ApplyLoanInput, tenantId?: number): Promise<LoanApplication>`
  - `getLoanById(loanId: string, userId: string, role: string, tenantId?: number): Promise<LoanDetail>`
  - `listLoans(filter: LoanFilterOptions): Promise<{ loans: LoanSummary[]; total: number }>`
  - `reviewLoan(loanId: string, reviewerId: string, decision: 'APPROVED' | 'REJECTED', notes?: string, tenantId?: number): Promise<LoanApplication>`
- **Called By**: `loanController.ts`, `slugCompatRoutes.ts`
- **Calls Into**: `prisma.loanApplication`, `prisma.loanAccount`, `notificationService`, `mailService`

---

### `loanAssessmentService`
- **File**: `backend-node/src/services/loanAssessmentService.ts`
- **Purpose**: Creditworthiness assessment, affordability indexing, and ML default probability calculation.
- **Key Methods**:
  - `assess(userId: string, requestedAmount: number, tenureMonths?: number, interestRate?: number, tenantId?: number): Promise<LoanAssessmentResult>`
  - `buildFinguardFeatures(userId: string, requestedAmount?: number): Promise<Record<string, number | string>>`
  - `assessWithFinguard(userId: string, requestedAmount: number, tenureMonths?: number, interestRate?: number, tenantId?: number): Promise<FinguardAssessmentResult>`
  - `getHistory(userId: string, tenantId?: number): Promise<LoanAssessment[]>`
- **Called By**: `loanAssessmentController.ts`, `loansAliasRoutes.ts`, `slugCompatRoutes.ts`
- **Calls Into**: `prisma.loanAssessment`, `prisma.financialProfile`, `finguardProxyService`, `creditScoringService`

---

### `cacheManager`
- **File**: `backend-node/src/services/cache/cacheManager.ts`
- **Purpose**: Stampede-protected application caching engine with typed deserialization and TTL management.
- **Key Methods**:
  - `get(key: string): Promise<string | null>`
  - `getJson<T>(key: string): Promise<T | null>`
  - `set(key: string, value: string, ttlSeconds?: number): Promise<void>`
  - `setJson<T>(key: string, value: T, ttlSeconds?: number): Promise<void>`
  - `incr(key: string, ttlSeconds?: number): Promise<number>`
  - `delete(key: string): Promise<void>`
  - `invalidatePattern(pattern: string): Promise<void>`
  - `getOrSet<T>(key: string, fallback: () => Promise<T>, ttlSeconds?: number): Promise<T>`
- **Called By**: `financialProfileService.ts`, `creditScoringService.ts`, `chatbotService.ts`, `statementParserService.ts`
- **Calls Into**: `redisConnection.getInstance()` (Redis / `InMemoryFallback`)

---

### `socketCache`
- **File**: `backend-node/src/services/cache/socketCache.ts`
- **Purpose**: Real-time socket token verification caching, user presence tracking, chat history warming, and anti-spam debounce.
- **Key Methods**:
  - `getCachedTokenPayload(rawToken: string): Promise<SocketUserPayload | null>`
  - `setCachedTokenPayload(rawToken: string, payload: SocketUserPayload, ttl?: number): Promise<void>`
  - `registerConnection(userId: string, socketId: string, meta?: any): Promise<void>`
  - `unregisterConnection(userId: string, socketId: string): Promise<{ remainingSockets: number }>`
  - `isUserOnline(userId: string): Promise<boolean>`
  - `getUserSockets(userId: string): Promise<string[]>`
  - `getRecentMessages(conversationId: string): Promise<CachedConversationMessage[] | null>`
  - `setRecentMessages(conversationId: string, messages: any[], ttl?: number): Promise<void>`
  - `appendMessage(conversationId: string, message: any, maxHistory?: number): Promise<void>`
  - `checkRateLimit(identifier: string, action?: string, limit?: number, windowSeconds?: number): Promise<{ allowed: boolean; remaining: number }>`
  - `getCachedUnreadCount(userId: string): Promise<number | null>`
  - `setCachedUnreadCount(userId: string, count: number, ttl?: number): Promise<void>`
  - `invalidateUnreadCount(userId: string): Promise<void>`
- **Called By**: `server.ts` (Socket.io handlers), `notificationService.ts`
- **Calls Into**: `cacheManager`

---

### `notificationService`
- **File**: `backend-node/src/services/notificationService.ts`
- **Purpose**: Fire-and-forget in-app notification dispatch and live WebSocket emission.
- **Key Methods**:
  - `create(input: CreateNotificationInput): Promise<void>`
  - `getByUser(userId: string, status?: string, limit?: number, offset?: number, tenantId?: number): Promise<{ notifications: any[]; total: number; unreadCount: number }>`
  - `getUnreadCount(userId: string, tenantId?: number): Promise<number>`
  - `markAsRead(notificationId: string, tenantId?: number): Promise<Notification>`
  - `markAllAsRead(userId: string, tenantId?: number): Promise<any>`
  - `delete(notificationId: string, tenantId?: number): Promise<Notification>`
- **Called By**: `notificationController.ts`, `loanService.ts`, `kycService.ts`
- **Calls Into**: `prisma.notification`, `socketCache`, `getIO()` (Socket.io room `user:<userId>`)

---

### `chatbotService`
- **File**: `backend-node/src/services/chatbotService.ts`
- **Purpose**: NLU intent routing, financial advice calculation, and multi-participant chat room dispatch.
- **Key Methods**:
  - `processQuery(userId: string, message: string, sessionId: string): Promise<QueryResult>`
  - `sendMessage(userId: string, conversationId: string, content: string): Promise<SendMessageResult>`
  - `getFinancialProfile(userId: string): Promise<FinancialProfileSummary>`
  - `listConversations(userId: string): Promise<ConversationSummary[]>`
  - `getMessagesForConversation(userId: string, conversationId: string): Promise<{ conversationId: string; messages: any[] }>`
- **Called By**: `chatbotController.ts`, `server.ts` (`chat:message`, `chat:join`)
- **Calls Into**: `prisma.chatConversation`, `prisma.nluQuery`, `cacheManager`, `financialProfileService`

---

### `supercontrollerService`
- **File**: `backend-node/src/services/supercontroller/supercontrollerService.ts`
- **Purpose**: Platform management across all companies, tenant provisioning, and feature flags.
- **Key Methods**:
  - `authenticate(email: string, password: string): Promise<SupercontrollerSession>`
  - `getAllTenants(page?: number, limit?: number): Promise<{ tenants: any[]; total: number }>`
  - `createTenant(data: CreateTenantData): Promise<Tenant>`
  - `updateTenantStatus(tenantId: number, status: string, adminId: number): Promise<Tenant>`
  - `toggleFeature(tenantId: number, featureName: string, isEnabled: boolean, adminId: number): Promise<FeatureToggle>`
  - `getDashboardMetrics(): Promise<PlatformMetrics>`
- **Called By**: `supercontrollerRoutes.ts`
- **Calls Into**: `prisma.supercontroller`, `prisma.tenant`, `prisma.featureToggle`, `prisma.supercontrollerAuditLog`
