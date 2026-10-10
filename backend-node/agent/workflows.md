# Backend-Node Workflows

> Internal call chains starting from Express HTTP and Socket.io events.

---

### 1. Multi-Tenant Login & Token Generation
```
POST /api/v1/auth/login
  → src/middleware/tenantContext.ts
  → src/controllers/authController.ts::login
  → src/services/authService.ts::login
  → src/services/tokenService.ts::generateAccessToken
  → prisma.session.create
  → Returns { accessToken, refreshToken, user }
```

### 2. KYC Submission & Verification Dispatch
```
POST /api/v1/kyc/submit
  → src/middleware/auth.ts (requireAuth)
  → src/middleware/upload.ts (multer fields)
  → src/controllers/kycController.ts::submit
  → src/services/kycService.ts::submitKyc
  → src/services/ocrService.ts::verifyKycWithFastApi (HTTP to FastAPI :8000)
  → prisma.$transaction (creates KycApplication, OCRResult, FaceVerification)
  → src/services/notificationService.ts::create
  → socket.emit('notification:new')
```

### 3. Bank Statement Upload & Metric Recalculation
```
POST /api/v1/uploads/statement
  → src/middleware/auth.ts
  → src/middleware/statementUpload.ts
  → src/controllers/uploadController.ts::uploadStatement
  → src/services/statementParserService.ts::parseStatementFile
  → prisma.transaction.createMany
  → src/services/statementParserService.ts::recalculateFinancialProfile
  → prisma.financialProfile.upsert
  → src/services/cache/cacheManager.ts::delete('financial_profile:' + userId)
```

### 4. Loan Assessment with FinGuard ML
```
POST /api/v1/loan-assessment/finguard
  → src/middleware/auth.ts
  → src/controllers/loanAssessmentController.ts::assessWithFinguard
  → src/services/loanAssessmentService.ts::assessWithFinguard
  → src/services/financialProfileService.ts::getProfile (cacheManager.getOrSet)
  → src/services/finguardProxyService.ts::predict (HTTP to FastAPI /api/v1/finguard/predict)
  → prisma.loanAssessment.create
```

### 5. Loan Review & Realtime Disbursement
```
POST /api/v1/loan/applications/:id/review
  → src/middleware/auth.ts
  → src/middleware/rbac.ts (requireAnyRole: ADMIN, REVIEWER)
  → src/controllers/loanController.ts::review
  → src/services/loanService.ts::reviewLoan
  → prisma.loanApplication.update (status: APPROVED)
  → src/services/loanAccountService.ts::createAccount (creates LoanAccount)
  → src/services/mailService.ts::sendLoanApprovedEmail
  → src/services/notificationService.ts::create
  → socket.emit('notification:new') + socket.emit('notification:unread_count')
```

### 6. Socket Chat Dispatch & Cache Warming
```
Socket Event: chat:join
  → src/server.ts (io.on)
  → src/services/cache/socketCache.ts::getRecentMessages
  → if miss: src/services/chatbotService.ts::getMessagesForConversation
  → socket.emit('chat:cached_history', messages)

Socket Event: chat:message
  → src/server.ts
  → src/services/cache/socketCache.ts::checkRateLimit
  → src/services/chatbotService.ts::sendMessage
  → src/services/cache/socketCache.ts::appendMessage
  → io.to('conversation:' + id).emit('chat:message')
```
