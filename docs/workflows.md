# Workflows

> Exact call chains and file paths for the primary business workflows across the platform.

---

## 1. Multi-Tenant User Authentication & JWT Issuance

```
Route: POST /api/v1/auth/login (or POST /:slug/login)
  │
  ▼ [backend-node/src/routes/authRoutes.ts]
  Middleware: validateRequest(loginSchema)
  │
  ▼ [backend-node/src/controllers/authController.ts] -> login()
  │
  ▼ [backend-node/src/services/authService.ts] -> login(input)
  │  ├─ Validates credentials via bcryptjs.compare()
  │  ├─ Resolves canonical user role and permissions
  │  └─ Calls tokenService.generateAccessToken() & generateRefreshToken()
  │
  ▼ [backend-node/src/services/tokenService.ts] -> generateAccessToken(payload)
  │  └─ Signs JWT with JWT_ACCESS_SECRET
  │
  ▼ [backend-node/src/config/database.ts] -> prisma.session.create()
  │  └─ Inserts session record into auth.sessions
  │
  ▼ Database: PostgreSQL (auth.users, auth.sessions)
```

---

## 2. KYC Document Upload & Facial Verification Pipeline

```
Route: POST /api/v1/kyc/submit
  │
  ▼ [backend-node/src/routes/kycRoutes.ts]
  Middleware: requireAuth -> upload.fields(['front', 'back', 'selfie'])
  │
  ▼ [backend-node/src/controllers/kycController.ts] -> submit()
  │
  ▼ [backend-node/src/services/kycService.ts] -> submitKyc(input, tenantId)
  │  ├─ Stores files in uploads/kyc
  │  ├─ Calls ocrService.verifyKycWithFastApi()
  │  │
  │  ▼ [backend-node/src/services/ocrService.ts] -> HTTP POST to FastAPI
  │     │
  │     ▼ [backend-fastapi/app/routes/kyc.py] -> verify_kyc()
  │        ├─ EasyOCR extracts name, citizenship number, DOB
  │        └─ DeepFace.verify() computes facial similarity distance
  │
  ▼ [backend-node/src/config/database.ts] -> prisma.kycApplication.create()
  │  ├─ Creates auth.kyc_applications row (status: PENDING / AUTO_VERIFIED)
  │  ├─ Creates auth.ocr_results row
  │  └─ Creates auth.face_verifications row
  │
  ▼ [backend-node/src/services/notificationService.ts] -> create()
  │  └─ Emits realtime WebSocket notification:new to reviewer room
```

---

## 3. Financial Bank Statement Processing & Profile Calculation

```
Route: POST /api/v1/uploads/statement
  │
  ▼ [backend-node/src/routes/uploadRoutes.ts]
  Middleware: requireAuth -> statementUpload.single('file')
  │
  ▼ [backend-node/src/controllers/uploadController.ts] -> uploadStatement()
  │
  ▼ [backend-node/src/services/statementParserService.ts] -> parseStatementFile()
  │  ├─ Parses CSV/XLSX rows or triggers ocrProcessingJob for PDF
  │  ├─ Categorizes transactions: INCOME, EXPENSE, EMI, TRANSFER
  │  ├─ Inserts auth.bank_statements and batch auth.transactions
  │  │
  │  └─ Invokes recalculateFinancialProfile(userId)
  │     ├─ Aggregates monthly income, expenses, net savings rate, and DTI
  │     ├─ Upserts auth.financial_profiles row
  │     └─ Invalidates Cache: cacheManager.delete('financial_profile:' + userId)
  │
  ▼ Database: PostgreSQL (auth.bank_statements, auth.transactions, auth.financial_profiles)
```

---

## 4. Loan Underwriting Assessment & ML Risk Inference

```
Route: POST /api/v1/loan-assessment/assess (or /assess/finguard)
  │
  ▼ [backend-node/src/routes/loanAssessmentRoutes.ts]
  Middleware: requireAuth -> validateRequest(assessSchema)
  │
  ▼ [backend-node/src/controllers/loanAssessmentController.ts] -> assess()
  │
  ▼ [backend-node/src/services/loanAssessmentService.ts] -> assessWithFinguard()
  │  ├─ Fetches cached profile via financialProfileService.getProfile(userId)
  │  ├─ Computes EMI Affordability Multiplier & rule-based score
  │  ├─ Assembles FinGuard ML feature payload via buildFinguardFeatures()
  │  │
  │  ▼ [backend-node/src/services/finguardProxyService.ts] -> HTTP POST to FastAPI
  │     │
  │     ▼ [backend-fastapi/app/routes/finguard.py] -> predict_finguard()
  │        └─ LightGBM/Scikit model outputs default_probability & risk_tier
  │
  ▼ [backend-node/src/config/database.ts] -> prisma.loanAssessment.create()
  │  └─ Persists assessment score, eligible amount, and defaultProbability
  │
  ▼ Database: PostgreSQL (auth.loan_assessments)
```

---

## 5. Loan Review Decisioning & Automated Notifications

```
Route: POST /api/v1/loan/applications/:id/review
  │
  ▼ [backend-node/src/routes/loanRoutes.ts]
  Middleware: requireAuth -> requireAnyRole('ADMIN', 'REVIEWER')
  │
  ▼ [backend-node/src/controllers/loanController.ts] -> review()
  │
  ▼ [backend-node/src/services/loanService.ts] -> reviewLoan()
  │  ├─ Updates auth.loan_applications (status: APPROVED / REJECTED)
  │  ├─ If APPROVED: calls loanAccountService.createAccount()
  │  │  └─ Creates auth.loan_accounts row
  │  │
  │  ├─ Calls mailService.sendLoanApprovedEmail() / sendLoanRejectedEmail()
  │  │  └─ Fires nodemailer SMTP mailer (fire-and-forget)
  │  │
  │  └─ Calls notificationService.create()
  │     ├─ Inserts auth.notifications
  │     ├─ Invalidates socketCache unread count
  │     └─ Emits realtime WebSocket notification:new & notification:unread_count
  │
  ▼ Sockets & Database: PostgreSQL + Socket.io room user:<userId>
```

---

## 6. Real-Time Chat Query & WebSocket Broadcast

```
WebSocket Event: chat:message (payload: { conversationId, content })
  │
  ▼ [backend-node/src/server.ts] -> io.on('connection')
  │  ├─ Checks socket rate limit via socketCache.checkRateLimit(userId)
  │  │
  ▼ [backend-node/src/services/chatbotService.ts] -> sendMessage(userId, conversationId, content)
  │  ├─ Validates participant membership in auth.chat_conversations
  │  ├─ Normalizes message and updates conversation context in database
  │  │
  ▼ [backend-node/src/services/cache/socketCache.ts] -> appendMessage()
  │  └─ Caches message in socket:chat:recent:<conversationId> (1800s TTL)
  │
  ▼ [backend-node/src/server.ts]
     ├─ io.to('conversation:' + conversationId).emit('chat:message', payload)
     └─ io.to('user:' + userId).emit('chat:conversation_updated', { conversationId })
```

---

## 7. Company Onboarding & Supercontroller Provisioning

```
Step 1: Application Intake
Route: POST /api/v1/company/request
  │
  ▼ [backend-node/src/routes/companyRoutes.ts]
  Middleware: requireAuth
  │
  ▼ [backend-node/src/config/database.ts] -> prisma.companyRequest.create()
     └─ Creates auth.company_requests (status: PENDING)

Step 2: Platform Approval
Route: POST /api/v1/supercontroller/requests/:id/approve
  │
  ▼ [backend-node/src/routes/supercontrollerRoutes.ts]
  Middleware: requireSupercontroller
  │
  ▼ [backend-node/src/services/supercontroller/supercontrollerService.ts] -> approveRequest()
     ├─ Creates auth.tenants row (slug, companyName, joinMode)
     ├─ Assigns requesting user to auth.tenant_admins
     ├─ Initializes default feature toggles (featureMlScoring: true, featureAuditLogs: true)
     └─ Updates auth.company_requests (status: APPROVED)
```
