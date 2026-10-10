# Routes Inventory

> Complete map of frontend client routes, backend REST API routes, and microservice endpoints grouped by module.

---

## 1. Frontend SPA Routes (`frontend/src/app/router.tsx`)

| Path | Component File | Guards / Required Roles | Purpose |
|---|---|---|---|
| `/login` | `@features/auth/pages/LoginPage.tsx` | Public | Standard email/password portal login |
| `/register` | `@features/auth/pages/RegisterPage.tsx` | Public | Customer account registration |
| `/forgot-password` | `@pages/auth/ForgotPasswordPage.tsx` | Public | Password recovery request |
| `/reset-password` | `@pages/auth/ResetPasswordPage.tsx` | Public | Password reset execution |
| `/:slug/login` | `@features/auth/pages/SlugLoginPage.tsx` | Public | Tenant-scoped staff login |
| `/:slug/customer/login` | `@features/auth/pages/SlugCustomerLoginPage.tsx` | Public | Tenant-scoped customer login (PAN/Email) |
| `/:slug/apply` | `@features/loans/pages/CustomerApplyPage.tsx` | Public | Quick loan application for approved tenant users |
| `/supercontroller/login` | `@features/supercontroller/pages/SupercontrollerLoginPage.tsx` | Public | Supercontroller admin authentication |
| `/dashboard` | `@app/DashboardIndex.tsx` | `user`, `admin`, `reviewer`, `superadmin` | Dynamic landing dashboard router |
| `/dashboard/admin` | `@features/dashboard/pages/AdminDashboardPage.tsx` | `admin`, `superadmin` | Tenant administration dashboard |
| `/dashboard/users` | `@features/users/pages/UsersPage.tsx` | `admin`, `superadmin` | User management directory |
| `/dashboard/kyc` | `@features/kyc/pages/KYCListPage.tsx` | `superadmin`, `admin`, `reviewer` | Reviewer queue of submitted KYCs |
| `/dashboard/kyc-submit` | `@features/kyc/pages/UserKYCPage.tsx` | `user`, `admin`, `superadmin` | Step-by-step KYC submission wizard |
| `/dashboard/kyc-status` | `@features/kyc/pages/KYCStatusPage.tsx` | `user`, `admin`, `superadmin` | Live verification progress tracker |
| `/dashboard/reports` | `@features/dashboard/pages/ReportsPage.tsx` | `admin`, `superadmin` | Tenant analytical reports |
| `/dashboard/loans` | `@features/loans/pages/LoanOfficerDashboardPage.tsx` | `admin`, `reviewer`, `superadmin` | Loan underwriting & decision queue |
| `/dashboard/loans/apply` | `@features/loans/pages/LoanApplicationPage.tsx` | `user`, `admin`, `superadmin` | Full loan application flow |
| `/dashboard/loans/status` | `@features/loans/pages/LoanStatusPage.tsx` | `user`, `admin`, `superadmin` | Borrower loan status timeline |
| `/dashboard/lenders` | `@features/loans/pages/LendersPage.tsx` | `user`, `superadmin` | Marketplace lender selection cards |
| `/dashboard/profile` | `@features/profile/pages/ProfilePage.tsx` | `user`, `admin`, `reviewer`, `superadmin` | User profile & security settings |
| `/dashboard/portfolio` | `@features/loans/pages/PortfolioPage.tsx` | `user`, `admin`, `reviewer`, `superadmin` | Customer loan portfolio & debt overview |
| `/dashboard/portfolio/admin` | `@features/loans/pages/admin/PortfolioAdminListPage.tsx` | `admin`, `reviewer`, `superadmin` | Reviewer portfolio borrower list |
| `/dashboard/portfolio/admin/:userId`| `@features/loans/pages/admin/PortfolioAdminDetailPage.tsx` | `admin`, `reviewer`, `superadmin` | Borrower portfolio & verification details |
| `/dashboard/chat` | `@pages/chat/ChatPage.tsx` | `user`, `admin`, `reviewer`, `superadmin` | Conversational financial AI advisor |
| `/dashboard/finguard` | `@features/finguard/pages/FinguardDashboardPage.tsx` | `user`, `admin`, `superadmin` | Financial statement analytics & breakdown |
| `/company` | `@features/company/pages/CompanyOnboardingPage.tsx` | Protected | Company registration request form |
| `/admin/company-requests` | `@features/company/pages/AdminCompanyRequestsPage.tsx` | `superadmin` | Company onboarding approval console |
| `/supercontroller` | `@features/supercontroller/pages/SupercontrollerDashboardPage.tsx` | `superadmin` | Cross-tenant platform control panel |

---

## 2. Backend Express API Routes (`backend-node/src/routes/*`)

### Authentication (`/api/v1/auth`)
| Method | Path | Controller / Handler | Middleware | Description |
|---|---|---|---|---|
| `POST` | `/register` | `authController.register` | `validateRequest(registerSchema)` | Create user account |
| `POST` | `/login` | `authController.login` | `validateRequest(loginSchema)` | Authenticate & issue JWT pair |
| `POST` | `/logout` | `authController.logout` | `requireAuth` | Revoke user refresh token |
| `POST` | `/refresh-token` | `authController.refreshToken` | None | Exchange refresh token for new access token |
| `GET` | `/me` | `authController.getMe` | `requireAuth` | Fetch current session user profile |
| `GET` | `/verify-email` | `authController.verifyEmail` | None | Verify account via email token |
| `POST` | `/forgot-password` | `authController.forgotPassword` | `validateRequest(forgotPasswordSchema)` | Dispatch reset email |
| `POST` | `/reset-password` | `authController.resetPassword` | `validateRequest(resetPasswordSchema)` | Set new password with token |
| `POST` | `/change-password` | `authController.changePassword` | `requireAuth`, `validateRequest` | Update password for active user |

### Users & Administration (`/api/v1/users` & `/api/v1/admin`)
| Method | Path | Controller / Handler | Middleware | Description |
|---|---|---|---|---|
| `GET` | `/users` | `userController.listUsers` | `requireAuth`, `requireRole('ADMIN')` | List tenant users (paginated) |
| `GET` | `/users/:id` | `userController.getUserById` | `requireAuth` | Get single user detail |
| `PUT` | `/users/:id` | `userController.updateUser` | `requireAuth` | Update user metadata |
| `DELETE`| `/users/:id` | `userController.deleteUser` | `requireAuth`, `requireRole('ADMIN')` | Soft-delete / deactivate user |
| `GET` | `/admin/stats` | `adminController.getDashboardStats` | `requireAuth`, `requireRole('ADMIN')` | Aggregated dashboard KPI counters |
| `GET` | `/admin/audit-logs` | `adminController.getAuditLogs` | `requireAuth`, `requireRole('ADMIN')` | Paginated system audit trails |

### Multi-Tenant Company (`/api/v1/company`)
| Method | Path | Controller / Handler | Middleware | Description |
|---|---|---|---|---|
| `POST` | `/request` | Inline handler | `requireAuth` | Submit company onboarding request |
| `GET` | `/requests` | Inline handler | `requireAuth`, `requireRole('SUPERADMIN')` | List pending company registrations |
| `POST` | `/invite` | Inline handler | `requireAuth`, `requireRole('ADMIN')` | Generate employee invitation code |
| `POST` | `/join` | Inline handler | `requireAuth` | Join company via invitation code |
| `GET` | `/profile` | Inline handler | `requireAuth` | Fetch current tenant company profile |

### KYC & Document Verification (`/api/v1/kyc`)
| Method | Path | Controller / Handler | Middleware | Description |
|---|---|---|---|---|
| `POST` | `/submit` | `kycController.submit` | `requireAuth`, Multer (front, back, selfie) | Upload ID docs and selfie for auto-verification |
| `GET` | `/status` | `kycController.getStatus` | `requireAuth` | Retrieve active user's KYC status |
| `GET` | `/applications` | `kycController.listApplications` | `requireAuth`, `requireAnyRole('ADMIN','REVIEWER')` | Queue of pending/processed KYCs |
| `GET` | `/applications/:id` | `kycController.getApplicationById`| `requireAuth` | Detailed KYC record & OCR data |
| `POST` | `/applications/:id/approve` | `kycController.approveApplication` | `requireAuth`, `requireAnyRole('ADMIN','REVIEWER')` | Reviewer approval of KYC |
| `POST` | `/applications/:id/reject` | `kycController.rejectApplication` | `requireAuth`, `requireAnyRole('ADMIN','REVIEWER')` | Reviewer rejection with reason |
| `POST` | `/applications/:id/resubmit`| `kycController.requestResubmit` | `requireAuth`, `requireAnyRole('ADMIN','REVIEWER')` | Request user re-upload documents |

### Financial Uploads & Statements (`/api/v1/uploads`, `/api/v1/transactions`, `/api/v1/financial`)
| Method | Path | Controller / Handler | Middleware | Description |
|---|---|---|---|---|
| `POST` | `/uploads/statement` | `uploadController.uploadStatement` | `requireAuth`, `statementUpload` | Upload bank statement (CSV/XLSX/PDF) |
| `GET` | `/transactions` | `transactionController.getTransactions` | `requireAuth` | Query categorized user transactions |
| `GET` | `/transactions/summary`| `transactionController.getSummary` | `requireAuth` | Monthly breakdown by category |
| `GET` | `/financial/profile` | `financialController.getProfile` | `requireAuth` | Get cached user financial health profile |
| `POST` | `/financial/recalculate` | `financialController.recalculate`| `requireAuth` | Invalidate cache & compute metrics |
| `GET` | `/financial/trends` | `financialController.getMonthlyTrends` | `requireAuth` | Date-truncated monthly cashflow trends |

### Loan Origination & Assessments (`/api/v1/loan`, `/api/v1/loan-assessment`, `/api/v1/loans`)
| Method | Path | Controller / Handler | Middleware | Description |
|---|---|---|---|---|
| `POST` | `/loan/apply` | `loanController.apply` | `requireAuth`, `validateRequest` | Submit new loan application |
| `GET` | `/loan/applications` | `loanController.list` | `requireAuth` | List borrower applications (or reviewer queue) |
| `GET` | `/loan/applications/:id` | `loanController.getById` | `requireAuth` | Detailed loan application & decision notes |
| `POST` | `/loan/applications/:id/review` | `loanController.review` | `requireAuth`, `requireAnyRole('ADMIN','REVIEWER')` | Approve or Reject loan |
| `POST` | `/loan-assessment/assess` | `loanAssessmentController.assess` | `requireAuth`, `validateRequest` | Rule-based affordability & EMI calculation |
| `POST` | `/loan-assessment/finguard`| `loanAssessmentController.assessWithFinguard` | `requireAuth` | ML default risk inference via FastAPI |
| `GET` | `/loan-assessment/history` | `loanAssessmentController.getHistory` | `requireAuth` | Previous loan assessments for user |
| `POST` | `/loans/predict` | `loanAssessmentController.predictDefault` | `requireAuth` | Spec alias: ML credit scoring inference |

### Conversational Chatbot (`/api/v1/chat`)
| Method | Path | Controller / Handler | Middleware | Description |
|---|---|---|---|---|
| `POST` | `/query` | `chatbotController.processQuery` | `requireAuth` | Process NLU query via HTTP fallback |
| `GET` | `/conversations` | `chatbotController.listConversations` | `requireAuth` | List user chat conversations |
| `GET` | `/conversations/:id` | `chatbotController.getMessages` | `requireAuth` | Fetch conversation message history |
| `POST` | `/conversations/:id/messages` | `chatbotController.sendMessage` | `requireAuth` | Send chat message via REST |

### Notifications (`/api/v1/notifications`)
| Method | Path | Controller / Handler | Middleware | Description |
|---|---|---|---|---|
| `GET` | `/` | `notificationController.getByUser` | `requireAuth` | Paginated notification list |
| `GET` | `/unread-count` | `notificationController.getUnreadCount` | `requireAuth` | Cached unread count for badge |
| `PATCH`| `/:id/read` | `notificationController.markAsRead` | `requireAuth` | Mark single notification as read |
| `PATCH`| `/mark-all-read` | `notificationController.markAllAsRead` | `requireAuth` | Mark all user notifications as read |
| `DELETE`| `/:id` | `notificationController.delete` | `requireAuth` | Delete notification item |

### Supercontroller Operations (`/api/v1/supercontroller`)
| Method | Path | Controller / Handler | Middleware | Description |
|---|---|---|---|---|
| `POST` | `/login` | Inline handler | None | Supercontroller login |
| `GET` | `/tenants` | Inline handler | `requireSupercontroller` | List all platform tenants |
| `POST` | `/tenants` | Inline handler | `requireSupercontroller` | Provision new tenant company |
| `PATCH`| `/tenants/:id/status` | Inline handler | `requireSupercontroller` | Suspend or activate tenant |
| `POST` | `/tenants/:id/features` | Inline handler | `requireSupercontroller` | Toggle feature flags per tenant |
| `GET` | `/metrics` | Inline handler | `requireSupercontroller` | Platform global metrics & health |
| `POST` | `/requests/:id/approve` | Inline handler | `requireSupercontroller` | Approve company registration request |
| `POST` | `/requests/:id/reject` | Inline handler | `requireSupercontroller` | Reject company registration request |

### Multi-Tenant Root Slug Routes (`backend-node/src/routes/slugCompatRoutes.ts`)
| Method | Path | Controller / Handler | Middleware | Description |
|---|---|---|---|---|
| `POST` | `/login` | Inline handler | `panUpload.none()` | Root company admin login |
| `POST` | `/:slug/login` | Inline handler | `panUpload.none()` | Tenant staff login |
| `POST` | `/:slug/customer/login` | Inline handler | `panUpload.none()` | Tenant customer login |
| `POST` | `/:slug/apply` | Inline handler | `panUpload.none()` | Tenant customer loan application |
| `GET` | `/:slug/loans` | Inline handler | `slugAuthMiddleware`, `slugCompanyGuard` | Tenant loans list |
| `GET` | `/:slug/loans/:id` | Inline handler | `slugAuthMiddleware`, `slugCompanyGuard` | Tenant loan detail |
| `PATCH`| `/:slug/loans/:id` | Inline handler | `slugAuthMiddleware`, `slugCompanyGuard` | Tenant loan status update |
| `POST` | `/:slug/loans/:id/predict` | Inline handler | `slugAuthMiddleware`, `slugCompanyGuard` | Trigger ML prediction for loan |
| `GET` | `/:slug/metrics` | Inline handler | `slugAuthMiddleware`, `slugCompanyGuard` | Tenant KPI counters |

---

## 3. Backend FastAPI ML Routes (`backend-fastapi/app/routes/*`)

| Method | Path | Module | Function | Description |
|---|---|---|---|---|
| `POST` | `/api/v1/kyc/verify` | `routes/kyc.py` | `verify_kyc` | EasyOCR extraction + DeepFace selfie match |
| `POST` | `/api/v1/kyc/face-match` | `routes/kyc.py` | `face_match` | DeepFace Facenet similarity comparison |
| `POST` | `/api/v1/financial-ocr/extract` | `routes/financial_ocr.py` | `extract_financial_text` | Stateless OCR on payslips & bank statements |
| `POST` | `/api/v1/finguard/predict` | `routes/finguard.py` | `predict_finguard` | Run Scikit-learn/LightGBM default risk inference |
| `GET` | `/api/v1/finguard/warmup` | `routes/finguard.py` | `warmup_finguard` | Pre-warm model in memory |
| `GET` | `/api/v1/finguard/schema` | `routes/finguard.py` | `schema_finguard` | Feature schema specifications |
| `POST` | `/api/v1/nlu/parse` | `routes/nlu.py` | `parse_nlu` | Intent and entity classification |
| `GET` | `/health` | `main.py` | `health_check` | Service liveness & model readiness check |
