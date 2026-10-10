# Backend-Node Routes

> Complete endpoint catalog for Express 5 in `backend-node`.

---

## 1. Auth Router (`/api/v1/auth` -> `src/routes/authRoutes.ts`)
- `POST /register`: `authController.register` (Public, Zod: `registerSchema`)
- `POST /login`: `authController.login` (Public, Zod: `loginSchema`)
- `POST /logout`: `authController.logout` (`requireAuth`)
- `POST /refresh-token`: `authController.refreshToken` (Public)
- `GET /me`: `authController.getMe` (`requireAuth`)
- `GET /verify-email`: `authController.verifyEmail` (Public)
- `POST /forgot-password`: `authController.forgotPassword` (Public, Zod: `forgotPasswordSchema`)
- `POST /reset-password`: `authController.resetPassword` (Public, Zod: `resetPasswordSchema`)
- `POST /change-password`: `authController.changePassword` (`requireAuth`, Zod)

## 2. Multi-Tenant Root Compat Router (`/` -> `src/routes/slugCompatRoutes.ts`)
- `POST /login`: Company admin login with fallback
- `POST /:slug/login`: Staff login for specific company slug
- `POST /:slug/customer/login`: Customer login for specific company slug
- `POST /:slug/apply`: Direct loan application for approved company customers
- `GET /:slug/loans`: List company loans (`slugAuthMiddleware`, `slugCompanyGuard`)
- `GET /:slug/loans/:id`: Single company loan (`slugAuthMiddleware`, `slugCompanyGuard`)
- `PATCH /:slug/loans/:id`: Update company loan (`slugAuthMiddleware`, `slugCompanyGuard`)
- `POST /:slug/loans/:id/predict`: ML risk prediction for loan
- `GET /:slug/metrics`: Real-time tenant counters

## 3. KYC Router (`/api/v1/kyc` -> `src/routes/kycRoutes.ts`)
- `POST /submit`: `kycController.submit` (`requireAuth`, Multer fields: `front`, `back`, `selfie`)
- `GET /status`: `kycController.getStatus` (`requireAuth`)
- `GET /applications`: `kycController.listApplications` (`requireAuth`, `requireAnyRole('ADMIN','REVIEWER')`)
- `GET /applications/:id`: `kycController.getApplicationById` (`requireAuth`)
- `POST /applications/:id/approve`: `kycController.approveApplication` (`requireAuth`, `requireAnyRole('ADMIN','REVIEWER')`)
- `POST /applications/:id/reject`: `kycController.rejectApplication` (`requireAuth`, `requireAnyRole('ADMIN','REVIEWER')`)
- `POST /applications/:id/resubmit`: `kycController.requestResubmit` (`requireAuth`, `requireAnyRole('ADMIN','REVIEWER')`)

## 4. Statements & Transactions (`/api/v1/uploads`, `/api/v1/transactions`, `/api/v1/financial`)
- `POST /uploads/statement`: `uploadController.uploadStatement` (`requireAuth`, `statementUpload`)
- `GET /transactions`: `transactionController.getTransactions` (`requireAuth`)
- `GET /transactions/summary`: `transactionController.getSummary` (`requireAuth`)
- `GET /financial/profile`: `financialController.getProfile` (`requireAuth`, cached)
- `POST /financial/recalculate`: `financialController.recalculate` (`requireAuth`, invalidates cache)
- `GET /financial/trends`: `financialController.getMonthlyTrends` (`requireAuth`, cached)

## 5. Loan & Underwriting (`/api/v1/loan`, `/api/v1/loan-assessment`, `/api/v1/loans`)
- `POST /loan/apply`: `loanController.apply` (`requireAuth`, Zod)
- `GET /loan/applications`: `loanController.list` (`requireAuth`)
- `GET /loan/applications/:id`: `loanController.getById` (`requireAuth`)
- `POST /loan/applications/:id/review`: `loanController.review` (`requireAuth`, `requireAnyRole('ADMIN','REVIEWER')`)
- `POST /loan-assessment/assess`: `loanAssessmentController.assess` (`requireAuth`, Zod)
- `POST /loan-assessment/finguard`: `loanAssessmentController.assessWithFinguard` (`requireAuth`)
- `GET /loan-assessment/history`: `loanAssessmentController.getHistory` (`requireAuth`)
- `POST /loans/predict`: `loanAssessmentController.predictDefault` (`requireAuth`)

## 6. Realtime Notifications (`/api/v1/notifications` -> `src/routes/notificationRoutes.ts`)
- `GET /`: `notificationController.getByUser` (`requireAuth`)
- `GET /unread-count`: `notificationController.getUnreadCount` (`requireAuth`, cached)
- `PATCH /:id/read`: `notificationController.markAsRead` (`requireAuth`)
- `PATCH /mark-all-read`: `notificationController.markAllAsRead` (`requireAuth`)
- `DELETE /:id`: `notificationController.delete` (`requireAuth`)

## 7. Supercontroller Router (`/api/v1/supercontroller` -> `src/routes/supercontrollerRoutes.ts`)
- `POST /login`: Supercontroller credential auth
- `GET /tenants`: List all tenants (`requireSupercontroller`)
- `POST /tenants`: Create new tenant (`requireSupercontroller`)
- `PATCH /tenants/:id/status`: Update status (`requireSupercontroller`)
- `POST /tenants/:id/features`: Toggle tenant feature flag (`requireSupercontroller`)
- `GET /metrics`: Platform KPI metrics (`requireSupercontroller`)
- `POST /requests/:id/approve`: Approve company onboarding (`requireSupercontroller`)
- `POST /requests/:id/reject`: Reject company onboarding (`requireSupercontroller`)
