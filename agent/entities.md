# Entities

> Canonical domain data models, PostgreSQL table mapping, Prisma relationships, and access points.

---

### `User`
- **Table / Schema**: `auth.users`
- **Purpose**: Core platform identity supporting password, OAuth, and multi-tenant claims.
- **Relationships**:
  - `1:1` -> `Profile` (`profile`)
  - `N:1` -> `Role` (`role`)
  - `N:1` -> `Tenant` (`tenantId` -> `auth.tenants.id`)
  - `1:N` -> `Session`, `AuditLog`, `KycApplication`, `LoanApplication`, `BankStatement`, `Notification`
- **Main Services**: `authService.ts`, `userService.ts`, `tokenService.ts`
- **Entry Routes**: `POST /api/v1/auth/login`, `GET /api/v1/users/:id`, `POST /:slug/login`

---

### `Tenant`
- **Table / Schema**: `auth.tenants`
- **Purpose**: Multi-tenant workspace definition for lending institutions and companies.
- **Relationships**:
  - `1:N` -> `User` (`tenantId`)
  - `1:N` -> `TenantAdmin` (`admins`)
  - `1:N` -> `FeatureToggle` (in `public` schema via `tenant_id`)
  - `1:N` -> `TenantMetrics`
- **Main Services**: `tenantService.ts`, `supercontrollerService.ts`
- **Entry Routes**: `POST /api/v1/company/request`, `GET /api/v1/supercontroller/tenants`, `/:slug/*`

---

### `CompanyRequest`
- **Table / Schema**: `auth.company_requests`
- **Purpose**: Tenant onboarding submission awaiting platform Supercontroller approval.
- **Relationships**:
  - References `requestedBy` (`userId`), created `tenantId` upon approval
- **Main Services**: `companyRoutes.ts`, `supercontrollerService.ts`
- **Entry Routes**: `POST /api/v1/company/request`, `POST /api/v1/supercontroller/requests/:id/approve`

---

### `KycApplication`
- **Table / Schema**: `auth.kyc_applications`
- **Purpose**: Identity verification submission tracking citizenship/passport IDs, photo URLs, and reviewer decisions.
- **Relationships**:
  - `N:1` -> `User` (`userId`)
  - `1:1` -> `OCRResult` (`ocrResult`)
  - `1:1` -> `FaceVerification` (`faceVerification`)
  - `1:N` -> `KYCSubmissionFile` (`submissionFiles`)
  - `1:N` -> `ManualReviewQueue` (`manualReviews`)
- **Main Services**: `kycService.ts`, `kycVerificationService.ts`, `ocrService.ts`
- **Entry Routes**: `POST /api/v1/kyc/submit`, `GET /api/v1/kyc/status`, `POST /api/v1/kyc/applications/:id/approve`

---

### `OCRResult`
- **Table / Schema**: `auth.ocr_results`
- **Purpose**: Raw and structured OCR extracted fields from ID documents.
- **Relationships**:
  - `1:1` -> `KycApplication` (`kycApplicationId`)
- **Main Services**: `ocrService.ts`, `kycService.ts`
- **Entry Routes**: `POST /api/v1/kyc/submit`

---

### `FaceVerification`
- **Table / Schema**: `auth.face_verifications`
- **Purpose**: Facial similarity score and confidence metrics between selfie and document ID photo.
- **Relationships**:
  - `1:1` -> `KycApplication` (`kycApplicationId`)
- **Main Services**: `ocrService.ts` -> FastAPI DeepFace
- **Entry Routes**: `POST /api/v1/kyc/submit`, `POST /api/v1/kyc/face-match`

---

### `Document` / `FinancialDocument`
- **Table / Schema**: `auth.documents`, `auth.financial_documents`
- **Purpose**: Physical file metadata (Citizenship, Salary Slip, PAN, Income Cert) and verification state.
- **Relationships**:
  - `N:1` -> `User` (`userId`)
  - `1:N` -> `DocumentVersion`
- **Main Services**: `documentService.ts`, `financialDocumentService.ts`, `documentExtractionService.ts`
- **Entry Routes**: `POST /api/v1/uploads/statement`, `GET /api/v1/uploads/documents`

---

### `BankStatement`
- **Table / Schema**: `auth.bank_statements`
- **Purpose**: Bank statement metadata (bank name, account number, period date range, file path).
- **Relationships**:
  - `N:1` -> `User` (`userId`)
  - `1:N` -> `Transaction` (`transactions`)
- **Main Services**: `statementParserService.ts`
- **Entry Routes**: `POST /api/v1/uploads/statement`

---

### `Transaction`
- **Table / Schema**: `auth.transactions`
- **Purpose**: Normalized financial entry (Date, Description, Debit, Credit, Category: `INCOME` | `EXPENSE` | `TRANSFER` | `INVESTMENT`).
- **Relationships**:
  - `N:1` -> `User` (`userId`)
  - `N:1` -> `BankStatement` (`bankStatementId`)
- **Main Services**: `statementParserService.ts`, `financialProfileService.ts`
- **Entry Routes**: `GET /api/v1/transactions`, `GET /api/v1/transactions/summary`

---

### `FinancialProfile`
- **Table / Schema**: `auth.financial_profiles`
- **Purpose**: Cached aggregate profile storing average monthly income, expense, savings rate, DTI ratio, and stability score.
- **Relationships**:
  - `1:1` -> `User` (`userId`)
- **Main Services**: `financialProfileService.ts`, `statementParserService.ts`, `cacheManager`
- **Entry Routes**: `GET /api/v1/financial/profile`, `POST /api/v1/financial/recalculate`

---

### `LoanApplication`
- **Table / Schema**: `auth.loan_applications`
- **Purpose**: Borrower loan request (amount, purpose, tenure, status: `SUBMITTED`, `UNDER_REVIEW`, `APPROVED`, `REJECTED`).
- **Relationships**:
  - `N:1` -> `User` (`userId`)
  - `1:1` -> `LoanAssessment` (`loanAssessment`)
  - `1:1` -> `LoanAccount` (`loanAccount`)
- **Main Services**: `loanService.ts`, `loanAssessmentService.ts`
- **Entry Routes**: `POST /api/v1/loan/apply`, `POST /api/v1/loan/applications/:id/review`, `POST /:slug/apply`

---

### `LoanAssessment`
- **Table / Schema**: `auth.loan_assessments`
- **Purpose**: Detailed underwriting evaluation storing eligibility score, recommended tenure, maximum EMI, and risk level (`LOW`, `MEDIUM`, `HIGH`).
- **Relationships**:
  - `N:1` -> `User` (`userId`)
  - `1:1` -> `LoanApplication` (`loanApplicationId`)
- **Main Services**: `loanAssessmentService.ts`, `finguardProxyService.ts`
- **Entry Routes**: `POST /api/v1/loan-assessment/assess`, `POST /api/v1/loan-assessment/finguard`

---

### `LoanAccount`
- **Table / Schema**: `auth.loan_accounts`
- **Purpose**: Active disbursed loan tracking outstanding balance, EMI amount, next due date, and repayment progress.
- **Relationships**:
  - `N:1` -> `User` (`userId`)
  - `1:1` -> `LoanApplication` (`loanApplicationId`)
- **Main Services**: `loanAccountService.ts`
- **Entry Routes**: `GET /:slug/loans/:id/accounts`, `POST /:slug/loans/:id/accounts`

---

### `ChatConversation`
- **Table / Schema**: `auth.chat_conversations`
- **Purpose**: Persistent customer-to-advisor or customer-to-bot chat thread storing JSON message histories.
- **Relationships**:
  - `N:1` -> `User` (`userId`)
- **Main Services**: `chatbotService.ts`, `socketCache`
- **Entry Routes**: `GET /api/v1/chat/conversations`, WebSocket `chat:message`

---

### `Notification`
- **Table / Schema**: `auth.notifications`
- **Purpose**: In-app alert store (Type: `LOAN_UPDATE`, `KYC_UPDATE`, `SYSTEM`, Status: `UNREAD` | `READ` | `ARCHIVED`).
- **Relationships**:
  - `N:1` -> `User` (`userId`)
- **Main Services**: `notificationService.ts`, `socketCache`
- **Entry Routes**: `GET /api/v1/notifications`, `GET /api/v1/notifications/unread-count`, WebSocket `notification:new`
