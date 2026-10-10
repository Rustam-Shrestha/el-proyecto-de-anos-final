# Modules

> Architectural feature boundaries, key file coordinates, dependencies, and search hints.

---

## 1. Auth & Session Management

- **Purpose**: User signup, credential verification, session management, password resets, and JWT generation (access/refresh/compat).
- **Key Files**:
  - Route: `backend-node/src/routes/authRoutes.ts`
  - Controller: `backend-node/src/controllers/authController.ts`
  - Service: `backend-node/src/services/authService.ts`, `backend-node/src/services/tokenService.ts`
  - Middleware: `backend-node/src/middleware/auth.ts`, `backend-node/src/middleware/slugAuth.ts`
  - Schemas: `backend-node/src/routes/authSchemas.ts`
  - Frontend: `frontend/src/features/auth/pages/LoginPage.tsx`, `frontend/src/features/auth/pages/SlugLoginPage.tsx`
- **Dependencies**: `prisma.user`, `prisma.session`, `bcryptjs`, `mailService`, `socketCache`
- **Search Hints**:
  - `authService.login`
  - `authService.register`
  - `tokenService.generateAccessToken`
  - `tokenService.verifyCompatToken`
- **Main Workflows**: User Registration, Login, Token Refresh, Password Reset.

---

## 2. Multi-Tenancy & Company Onboarding

- **Purpose**: Tenant isolation, company request approval, slug routing (`/:slug/*`), and tenant domain resolution.
- **Key Files**:
  - Route: `backend-node/src/routes/companyRoutes.ts`, `backend-node/src/routes/slugCompatRoutes.ts`
  - Middleware: `backend-node/src/middleware/tenantContext.ts`, `backend-node/src/middleware/requireCompany.ts`
  - Service: `backend-node/src/services/tenant/tenantService.ts`
  - Frontend: `frontend/src/features/company/pages/CompanyOnboardingPage.tsx`, `frontend/src/features/company/pages/AdminCompanyRequestsPage.tsx`
- **Dependencies**: `prisma.tenant`, `prisma.tenantAdmin`, `prisma.companyRequest`, `prisma.companyInvite`
- **Search Hints**:
  - `tenantService.ensureDefault`
  - `tenantContext`
  - `slugAuthMiddleware`
  - `CompanyRequest`
- **Main Workflows**: Company Registration Request, Supercontroller Approval, Tenant Scoped Login.

---

## 3. User & Role Administration (RBAC)

- **Purpose**: User profiling, role assignment (`ADMIN`, `USER`, `REVIEWER`, `SUPERADMIN`), role permissions matrix, and directory listing.
- **Key Files**:
  - Route: `backend-node/src/routes/userRoutes.ts`, `backend-node/src/routes/adminRoutes.ts`
  - Controller: `backend-node/src/controllers/userController.ts`, `backend-node/src/controllers/adminController.ts`
  - Service: `backend-node/src/services/userService.ts`, `backend-node/src/services/rbac/permissionResolver.ts`
  - Middleware: `backend-node/src/middleware/rbac.ts`
  - Frontend: `frontend/src/features/users/pages/UsersPage.tsx`, `frontend/src/features/profile/pages/ProfilePage.tsx`
- **Dependencies**: `prisma.user`, `prisma.role`, `prisma.profile`, `prisma.rolePermission`
- **Search Hints**:
  - `userService.getUserById`
  - `permissionResolver.getUserPermissions`
  - `requireRole`
  - `normalizeRoleName`
- **Main Workflows**: User Profile Update, Admin Member Listing, Role Elevation.

---

## 4. KYC & Identity Verification

- **Purpose**: ID document submission (Citizenship / Passport / PAN), automated selfie face matching, OCR verification, and manual reviewer decisioning.
- **Key Files**:
  - Route: `backend-node/src/routes/kycRoutes.ts`
  - Controller: `backend-node/src/controllers/kycController.ts`
  - Service: `backend-node/src/services/kycService.ts`, `backend-node/src/services/kycVerificationService.ts`
  - FastApi Route: `backend-fastapi/app/routes/kyc.py`
  - Schemas: `backend-node/src/routes/kycSchemas.ts`
  - Frontend: `frontend/src/features/kyc/pages/UserKYCPage.tsx`, `frontend/src/features/kyc/pages/KYCListPage.tsx`, `frontend/src/features/kyc/pages/KYCStatusPage.tsx`
- **Dependencies**: `ocrService`, `prisma.kycApplication`, `prisma.oCRResult`, `prisma.faceVerification`, `prisma.manualReviewQueue`
- **Search Hints**:
  - `kycService.submitKyc`
  - `kycService.approveKyc`
  - `kycService.rejectKyc`
  - `verify_kyc` (FastAPI)
- **Main Workflows**: KYC Submission, Reviewer Queue Review, Auto Face Match.

---

## 5. Document Management & OCR Processing

- **Purpose**: Document file uploads (multer), asynchronous OCR job queueing, Tesseract fallback, and structured data extraction.
- **Key Files**:
  - Route: `backend-node/src/routes/documentRoutes.ts`, `backend-node/src/routes/uploadRoutes.ts`
  - Controller: `backend-node/src/controllers/documentController.ts`, `backend-node/src/controllers/uploadController.ts`
  - Job: `backend-node/src/jobs/ocrProcessingJob.ts`
  - Service: `backend-node/src/services/documentService.ts`, `backend-node/src/services/documentExtractionService.ts`, `backend-node/src/services/ocrService.ts`
  - FastApi Route: `backend-fastapi/app/routes/financial_ocr.py`
- **Dependencies**: `prisma.document`, `prisma.financialDocument`, `prisma.ocrExtraction`, `backend-fastapi`
- **Search Hints**:
  - `ocrProcessingJob`
  - `resetStaleOcrJobs`
  - `callFinancialDocumentOcr`
  - `documentExtractionService`
- **Main Workflows**: Document Upload, Background OCR Extraction, Review Verification.

---

## 6. Financial Statements & Cash Flow Analytics

- **Purpose**: Bank statement parsing (CSV/XLSX/PDF), transaction categorization (Income/Expense/EMI), cash-flow metric calculation, and savings rate derivation.
- **Key Files**:
  - Route: `backend-node/src/routes/financialRoutes.ts`, `backend-node/src/routes/transactionRoutes.ts`
  - Controller: `backend-node/src/controllers/financialController.ts`, `backend-node/src/controllers/transactionController.ts`
  - Service: `backend-node/src/services/statementParserService.ts`, `backend-node/src/services/financialProfileService.ts`
  - Cache: `cacheManager` (`financial_profile:<userId>`)
  - Frontend: `frontend/src/features/finguard/pages/FinguardDashboardPage.tsx`
- **Dependencies**: `prisma.bankStatement`, `prisma.transaction`, `prisma.financialProfile`, `cacheManager`
- **Search Hints**:
  - `statementParserService.parseStatementFile`
  - `statementParserService.recalculateFinancialProfile`
  - `financialProfileService.getProfile`
  - `financialProfileService.getMonthlyTrends`
- **Main Workflows**: Statement File Upload, Transaction Categorization, Financial Profile Recalculation.

---

## 7. Loan Origination & Portfolio Management

- **Purpose**: Loan application intake, lender selection, reviewer decisioning (Approve/Reject), loan disbursement tracking, and credit bureau portfolio syncing.
- **Key Files**:
  - Route: `backend-node/src/routes/loanRoutes.ts`, `backend-node/src/routes/portfolioRoutes.ts`, `backend-node/src/routes/loansAliasRoutes.ts`
  - Controller: `backend-node/src/controllers/loanController.ts`, `backend-node/src/controllers/portfolioController.ts`, `backend-node/src/controllers/portfolioAdminController.ts`
  - Service: `backend-node/src/services/loanService.ts`, `backend-node/src/services/loanAccountService.ts`, `backend-node/src/services/portfolioVerificationService.ts`
  - Frontend: `frontend/src/features/loans/pages/LoanApplicationPage.tsx`, `frontend/src/features/loans/pages/LoanOfficerDashboardPage.tsx`, `frontend/src/features/loans/pages/CustomerApplyPage.tsx`
- **Dependencies**: `prisma.loanApplication`, `prisma.loanAccount`, `prisma.portfolioVerification`, `notificationService`, `mailService`
- **Search Hints**:
  - `loanService.applyForLoan`
  - `loanService.reviewLoan`
  - `loanAccountService.createAccount`
  - `portfolioVerificationService.verify`
- **Main Workflows**: Customer Loan Application, Loan Officer Review, Loan Approval Email & Realtime Push.

---

## 8. Loan Assessment & ML Credit Scoring

- **Purpose**: Underwriting evaluation, rule-based loan eligibility calculations (Affordability Multiplier, EMI, DTI), and ML default probability predictions.
- **Key Files**:
  - Route: `backend-node/src/routes/loanAssessmentRoutes.ts`
  - Controller: `backend-node/src/controllers/loanAssessmentController.ts`
  - Service: `backend-node/src/services/loanAssessmentService.ts`, `backend-node/src/services/ml/creditScoringService.ts`, `backend-node/src/services/finguardProxyService.ts`
  - FastApi Route: `backend-fastapi/app/routes/finguard.py`
  - ML Artifacts: `finguard_model_v1.3.0/finguard_artifacts/model.pkl`
- **Dependencies**: `prisma.loanAssessment`, `prisma.loanFeatures`, `prisma.borrowerFeatures`, `backend-fastapi/finguard`
- **Search Hints**:
  - `loanAssessmentService.assess`
  - `loanAssessmentService.assessWithFinguard`
  - `creditScoringService.predictDefault`
  - `predict_finguard` (FastAPI)
- **Main Workflows**: Real-time Pre-assessment, FinGuard ML Feature Assembly, Default Probability Inference.

---

## 9. Chatbot & Conversational Financial Advisory

- **Purpose**: Natural Language Understanding (NLU) for customer financial inquiries, intent classification, and real-time loan advisor socket messaging.
- **Key Files**:
  - Route: `backend-node/src/routes/chatbotRoutes.ts`
  - Controller: `backend-node/src/controllers/chatbotController.ts`
  - Service: `backend-node/src/services/chatbotService.ts`
  - Socket Handler: `backend-node/src/server.ts` (`chat:message`, `chat:join`)
  - FastApi Route: `backend-fastapi/app/routes/nlu.py`
  - Frontend: `frontend/src/pages/chat/ChatPage.tsx`
- **Dependencies**: `socketCache`, `cacheManager`, `prisma.chatConversation`, `prisma.nluQuery`
- **Search Hints**:
  - `chatbotService.processQuery`
  - `chatbotService.sendMessage`
  - `socketCache.getRecentMessages`
  - `classifyIntent`
- **Main Workflows**: Instant Chat Room Join with Cached History, Query Processing, Real-time Socket Message Broadcast.

---

## 10. Real-time Notifications & Sockets

- **Purpose**: In-app persistent notification storage, user notification preferences, and zero-latency WebSocket broadcasting (`notification:new`, `notification:unread_count`).
- **Key Files**:
  - Route: `backend-node/src/routes/notificationRoutes.ts`
  - Controller: `backend-node/src/controllers/notificationController.ts`
  - Service: `backend-node/src/services/notificationService.ts`
  - Cache: `backend-node/src/services/cache/socketCache.ts`
  - Socket Config: `backend-node/src/config/socket.ts`, `backend-node/src/server.ts`
- **Dependencies**: `prisma.notification`, `prisma.notificationPreference`, `socketCache`, Socket.io
- **Search Hints**:
  - `notificationService.create`
  - `notificationService.getUnreadCount`
  - `emitRealtime`
  - `socketCache.invalidateUnreadCount`
- **Main Workflows**: Fire-and-Forget Notification Creation, Real-time Socket Dispatch, Mark Read & Badge Invalidation.

---

## 11. Supercontroller Platform Operations

- **Purpose**: Cross-tenant oversight, tenant provisioning, feature toggle control (`featureMlScoring`, `featureAuditLogs`), usage quotas, and platform analytics.
- **Key Files**:
  - Route: `backend-node/src/routes/supercontrollerRoutes.ts`
  - Service: `backend-node/src/services/supercontroller/supercontrollerService.ts`, `backend-node/src/services/supercontroller/tenantMonitoringService.ts`
  - Middleware: `backend-node/src/middleware/requireSupercontroller.ts`
  - Frontend: `frontend/src/features/supercontroller/pages/SupercontrollerDashboardPage.tsx`
- **Dependencies**: `prisma.supercontroller`, `prisma.tenant`, `prisma.featureToggle`, `prisma.supercontrollerAuditLog`
- **Search Hints**:
  - `supercontrollerService.getAllTenants`
  - `supercontrollerService.toggleFeature`
  - `tenantMonitoringService.getTenantOverview`
- **Main Workflows**: Tenant Provisioning, Feature Flagging, Platform Usage Metric Inspection.

---

## 12. Auditing & Compliance Export

- **Purpose**: Immutable audit trail generation for mutating HTTP actions, periodic audit log pruning (180 days retention), and PDF/Excel compliance exports.
- **Key Files**:
  - Route: `backend-node/src/routes/exportRoutes.ts`
  - Service: `backend-node/src/services/auditService.ts`, `backend-node/src/services/export/exportService.ts`
  - Model: `prisma.auditLog`
- **Dependencies**: `prisma.auditLog`, `exceljs` / `xlsx`, `pdf-parse`
- **Search Hints**:
  - `auditService.log`
  - `auditService.trimOldLogs`
  - `exportRoutes`
- **Main Workflows**: Mutation Audit Recording, Nightly Stale Log Trim, Regulatory Report Export.
