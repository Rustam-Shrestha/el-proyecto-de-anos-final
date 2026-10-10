# Backend-Node Search Hints

> Precision `rg` targets when modifying `backend-node`.

---

### Authentication & Tokens
- `rg "generateCompatToken" src/services/tokenService.ts`
- `rg "authService\.login" src/services/authService.ts`
- `rg "resolveTenantOr404" src/routes/slugCompatRoutes.ts`

### Multi-Tenancy & Slugs
- `rg "tenantContext" src/middleware/tenantContext.ts`
- `rg "ensureDefault" src/services/tenant/tenantService.ts`
- `rg "slugAuthMiddleware" src/middleware/slugAuth.ts`

### KYC Verification
- `rg "submitKyc" src/services/kycService.ts`
- `rg "verifyKycWithFastApi" src/services/ocrService.ts`
- `rg "approveApplication" src/controllers/kycController.ts`

### Bank Statements & Profiles
- `rg "parseStatementFile" src/services/statementParserService.ts`
- `rg "recalculateFinancialProfile" src/services/statementParserService.ts`
- `rg "getMonthlyTrends" src/services/financialProfileService.ts`

### Loans & Assessments
- `rg "applyForLoan" src/services/loanService.ts`
- `rg "reviewLoan" src/services/loanService.ts`
- `rg "assessWithFinguard" src/services/loanAssessmentService.ts`
- `rg "createAccount" src/services/loanAccountService.ts`

### Sockets & Caching
- `rg "socketCache" src/services/cache/socketCache.ts`
- `rg "getOrSet" src/services/cache/cacheManager.ts`
- `rg "InMemoryFallback" src/services/cache/redisClient.ts`
- `rg "emitRealtime" src/services/notificationService.ts`
