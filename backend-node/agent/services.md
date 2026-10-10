# Backend-Node Services

> Service specifications, signatures, and dependency call maps in `backend-node/src/services`.

---

### `authService` (`src/services/authService.ts`)
- `register(input: RegisterInput): Promise<TokenResponse>`
- `login(input: LoginInput): Promise<TokenResponse>`
- `refreshToken(refreshToken: string): Promise<TokenResponse>`
- `logout(userId: string): Promise<void>`
- **Called by**: `authController.ts`, `slugCompatRoutes.ts`
- **Calls into**: `prisma.user`, `prisma.session`, `tokenService`, `mailService`

### `tokenService` (`src/services/tokenService.ts`)
- `generateAccessToken(payload: AccessTokenPayload): string`
- `generateRefreshToken(payload: RefreshTokenPayload): string`
- `generateCompatToken(claims: CompatTokenClaims): string`
- `verifyCompatToken(token: string): CompatTokenPayload | null`
- **Called by**: `authService.ts`, `middleware/auth.ts`, `middleware/slugAuth.ts`, `slugCompatRoutes.ts`
- **Calls into**: `jsonwebtoken`, `env`

### `tenantService` (`src/services/tenant/tenantService.ts`)
- `ensureDefault(): Promise<number>`
- `findBySlug(slug: string): Promise<Tenant | null>`
- `create(slug: string, name: string, domain?: string): Promise<Tenant>`
- **Called by**: `middleware/tenantContext.ts`, `companyRoutes.ts`
- **Calls into**: `prisma.tenant`

### `kycService` (`src/services/kycService.ts`)
- `submitKyc(input: SubmitKycInput, tenantId?: number): Promise<KycApplicationDetail>`
- `getKycStatus(userId: string, tenantId?: number): Promise<KycApplicationDetail | null>`
- `approveKyc(kycId: string, reviewerId: string, tenantId?: number): Promise<KycApplicationDetail>`
- `rejectKyc(kycId: string, reviewerId: string, reason: string, tenantId?: number): Promise<KycApplicationDetail>`
- **Called by**: `kycController.ts`
- **Calls into**: `prisma.kycApplication`, `ocrService`, `notificationService`

### `ocrService` (`src/services/ocrService.ts`)
- `verifyKycWithFastApi(front: string, back: string, selfie: string): Promise<FastApiKycResult>`
- `callFinancialDocumentOcr(filePath: string): Promise<OcrResult>`
- **Called by**: `kycService.ts`, `jobs/ocrProcessingJob.ts`
- **Calls into**: `axios` (FastAPI bridge), local Tesseract

### `statementParserService` (`src/services/statementParserService.ts`)
- `parseStatementFile(filePath: string, userId: string, tenantId?: number): Promise<string>`
- `recalculateFinancialProfile(userId: string): Promise<void>`
- **Called by**: `uploadController.ts`, `financialProfileService.ts`
- **Calls into**: `prisma.bankStatement`, `prisma.transaction`, `prisma.financialProfile`, `cacheManager`

### `financialProfileService` (`src/services/financialProfileService.ts`)
- `getProfile(userId: string, tenantId?: number): Promise<FinancialProfile>`
- `recalculate(userId: string, tenantId?: number): Promise<FinancialProfile>`
- `getMonthlyTrends(userId: string, tenantId?: number): Promise<any[]>`
- **Called by**: `financialController.ts`, `loanAssessmentService.ts`
- **Calls into**: `cacheManager.getOrSet`, `prisma.financialProfile`, `statementParserService`

### `loanService` (`src/services/loanService.ts`)
- `applyForLoan(userId: string, data: ApplyLoanInput, tenantId?: number): Promise<LoanApplication>`
- `reviewLoan(loanId: string, reviewerId: string, decision: string, notes?: string, tenantId?: number): Promise<LoanApplication>`
- **Called by**: `loanController.ts`, `slugCompatRoutes.ts`
- **Calls into**: `prisma.loanApplication`, `loanAccountService`, `notificationService`, `mailService`

### `loanAssessmentService` (`src/services/loanAssessmentService.ts`)
- `assess(userId: string, requestedAmount: number, tenureMonths?: number, interestRate?: number): Promise<LoanAssessmentResult>`
- `assessWithFinguard(userId: string, requestedAmount: number): Promise<FinguardAssessmentResult>`
- **Called by**: `loanAssessmentController.ts`, `loansAliasRoutes.ts`
- **Calls into**: `prisma.loanAssessment`, `finguardProxyService`, `financialProfileService`

### `cacheManager` (`src/services/cache/cacheManager.ts`)
- `getOrSet<T>(key: string, fallback: () => Promise<T>, ttlSeconds?: number): Promise<T>`
- `setJson<T>(key: string, value: T, ttl?: number): Promise<void>`
- `delete(key: string): Promise<void>`
- `invalidatePattern(pattern: string): Promise<void>`
- **Called by**: `financialProfileService`, `creditScoringService`, `chatbotService`, `statementParserService`
- **Calls into**: `redisConnection.getInstance()`

### `socketCache` (`src/services/cache/socketCache.ts`)
- `getCachedTokenPayload(rawToken: string): Promise<SocketUserPayload | null>`
- `registerConnection(userId: string, socketId: string, meta?: any): Promise<void>`
- `unregisterConnection(userId: string, socketId: string): Promise<any>`
- `getRecentMessages(conversationId: string): Promise<any[] | null>`
- `appendMessage(conversationId: string, message: any): Promise<void>`
- `checkRateLimit(identifier: string, action?: string, limit?: number, window?: number): Promise<any>`
- `getCachedUnreadCount(userId: string): Promise<number | null>`
- `invalidateUnreadCount(userId: string): Promise<void>`
- **Called by**: `server.ts`, `notificationService.ts`
- **Calls into**: `cacheManager`

### `notificationService` (`src/services/notificationService.ts`)
- `create(input: CreateNotificationInput): Promise<void>`
- `getUnreadCount(userId: string, tenantId?: number): Promise<number>`
- `markAsRead(notificationId: string, tenantId?: number): Promise<any>`
- **Called by**: `notificationController.ts`, `loanService.ts`, `kycService.ts`
- **Calls into**: `prisma.notification`, `socketCache`, `getIO()`

### `chatbotService` (`src/services/chatbotService.ts`)
- `processQuery(userId: string, message: string, sessionId: string): Promise<any>`
- `sendMessage(userId: string, conversationId: string, content: string): Promise<any>`
- **Called by**: `chatbotController.ts`, `server.ts`
- **Calls into**: `prisma.chatConversation`, `cacheManager`, `financialProfileService`
