# Backend-Node Entities (Prisma)

> Prisma schema models in `backend-node/prisma/schema.prisma` mapped to PostgreSQL schemas `auth` and `public`.

---

| Prisma Model | Table Name | Schema | Primary Keys / Unique | Core Foreign Keys | Main Service |
|---|---|---|---|---|---|
| `User` | `users` | `auth` | `id` (cuid), `email` | `roleId` -> `Role.id`, `tenantId` -> `Tenant.id` | `authService`, `userService` |
| `Tenant` | `tenants` | `auth` | `id` (int), `slug`, `panNumber` | - | `tenantService` |
| `TenantAdmin` | `tenant_admins` | `auth` | `id` (int) | `tenantId` -> `Tenant.id` | `tenantService` |
| `CompanyRequest`| `company_requests` | `auth` | `id` (cuid), `slug`, `panNumber` | - | `companyRoutes` |
| `Session` | `sessions` | `auth` | `id` (cuid), `token` | `userId` -> `User.id` | `authService` |
| `Role` | `roles` | `auth` | `id` (cuid), `name` | - | `rbac` |
| `KycApplication`| `kyc_applications` | `auth` | `id` (cuid) | `userId` -> `User.id` | `kycService` |
| `OCRResult` | `ocr_results` | `auth` | `id` (cuid), `kycApplicationId` | `kycApplicationId` -> `KycApplication.id` | `ocrService` |
| `FaceVerification`| `face_verifications`| `auth` | `id` (cuid), `kycApplicationId` | `kycApplicationId` -> `KycApplication.id` | `ocrService` |
| `BankStatement` | `bank_statements` | `auth` | `id` (cuid) | `userId` -> `User.id` | `statementParserService` |
| `Transaction` | `transactions` | `auth` | `id` (cuid) | `userId` -> `User.id`, `bankStatementId` | `statementParserService` |
| `FinancialProfile`| `financial_profiles`| `auth` | `id` (cuid), `userId` | `userId` -> `User.id` | `financialProfileService` |
| `LoanApplication`| `loan_applications`| `auth` | `id` (cuid) | `userId` -> `User.id` | `loanService` |
| `LoanAssessment` | `loan_assessments` | `auth` | `id` (cuid), `loanApplicationId`| `loanApplicationId` -> `LoanApplication.id` | `loanAssessmentService` |
| `LoanAccount` | `loan_accounts` | `auth` | `id` (cuid), `loanApplicationId`| `loanApplicationId` -> `LoanApplication.id` | `loanAccountService` |
| `ChatConversation`| `chat_conversations`| `auth` | `id` (cuid), `sessionId` | `userId` -> `User.id` | `chatbotService` |
| `Notification` | `notifications` | `auth` | `id` (cuid) | `userId` -> `User.id` | `notificationService` |
| `AuditLog` | `audit_logs` | `auth` | `id` (cuid) | `userId` -> `User.id` | `auditService` |
| `Supercontroller`| `supercontrollers` | `auth` | `id` (int), `email` | - | `supercontrollerService` |
| `FeatureToggle` | `feature_toggles` | `public`| `id` (int), `[tenantId, featureName]`| `tenantId` -> `Tenant.id` | `supercontrollerService` |
