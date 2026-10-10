# Backend Route Inventory

> All routes are registered under `/api/v1` in `src/routes/index.ts`
> Router aggregation: `auth`, `users`, `kyc`, `admin`, `loan`, `employment`

---

## Middleware Stack (per route)

Standard order: `authenticate` → `authorize(roles)` → `validate(schema)` → `controller`

| Middleware | File | Purpose |
|---|---|---|
| `authenticate` | `src/middleware/auth.ts` | JWT Bearer token verification; sets `req.user` |
| `authorize(roles)` | `src/middleware/rbac.ts` | Role check against `req.user.role` |
| `validate(schema)` | `src/middleware/requestValidation.ts` | Zod schema validation; sets `req.validated` |
| `errorHandler` | `src/middleware/errorHandler.ts` | Global error handler (registered last in app.ts) |
| `notFoundHandler` | `src/middleware/notFound.ts` | 404 catch-all (registered before errorHandler) |

---

## Route Table

### Auth Routes (`/api/v1/auth`)

| Method | Path | Auth | Roles | Validation | Controller |
|---|---|---|---|---|---|
| POST | /auth/register | Public | - | registerSchema | authController.register |
| POST | /auth/login | Public | - | loginSchema | authController.login |
| POST | /auth/logout | Required | - | - | authController.logout |
| POST | /auth/refresh | Public | - | refreshTokenSchema | authController.refreshAccessToken |
| POST | /auth/verify-email | Public | - | verifyEmailSchema | authController.verifyEmail |
| POST | /auth/forgot-password | Public | - | forgotPasswordSchema | authController.forgotPassword |
| POST | /auth/reset-password | Public | - | resetPasswordSchema | authController.resetPassword |
| POST | /auth/change-password | Required | - | changePasswordSchema | authController.changePassword |

### User Routes (`/api/v1/users`)

| Method | Path | Auth | Roles | Validation | Controller |
|---|---|---|---|---|---|
| GET | /users/me | Required | - | - | userController.getMe |
| PATCH | /users/me | Required | - | updateUserSchema | userController.updateMe |
| PATCH | /users/me/avatar | Required | - | avatarUpload (middleware) | userController.uploadAvatar |
| DELETE | /users/me/avatar | Required | - | - | userController.deleteAvatar |
| GET | /users | Required | ADMIN | listUsersSchema | userController.listUsers |
| GET | /users/:id | Required | ADMIN | getUserByIdSchema | userController.getUser |
| PATCH | /users/:id/profile | Required | ADMIN | updateUserProfileSchema | userController.updateProfile |
| PATCH | /users/:id/role | Required | ADMIN | updateUserRoleSchema | userController.changeUserRole |
| DELETE | /users/:id | Required | ADMIN | deleteUserSchema | userController.deleteUser |

### KYC Routes (`/api/v1/kyc`)

| Method | Path | Auth | Roles | Validation | Controller |
|---|---|---|---|---|---|
| POST | /kyc/submit | Required | - | uploadMiddleware | kycController.submitKyc |
| GET | /kyc/my-status | Required | - | - | kycController.getMyStatus |
| GET | /kyc/status | Required | - | getKycStatusSchema | kycController.getKycStatus |
| GET | /kyc | Required | ADMIN, REVIEWER | listKycApplicationsSchema | kycController.listKycApplications |
| GET | /kyc/:id | Required | ADMIN, REVIEWER | getKycByIdSchema | kycController.getKycById |
| PATCH | /kyc/:id/approve | Required | ADMIN, REVIEWER | approveKycSchema | kycController.approveKyc |
| PATCH | /kyc/:id/reject | Required | ADMIN, REVIEWER | rejectKycSchema | kycController.rejectKyc |
| PATCH | /kyc/:id/request-resubmit | Required | ADMIN, REVIEWER | requestResubmitSchema | kycController.requestKycResubmit |
| GET | /kyc/:kycId/documents | Required | - | getKycDocumentsSchema | documentController.getKycDocuments |

### Document Routes (`/api/v1/kyc/documents`)

| Method | Path | Auth | Roles | Validation | Controller |
|---|---|---|---|---|---|
| POST | /documents/upload | Required | - | uploadDocumentSchema | documentController.uploadDocument |
| GET | /documents/:documentId | Required | - | getDocumentSchema | documentController.getDocument |
| PATCH | /documents/:documentId/verify | Required | ADMIN, REVIEWER | verifyDocumentSchema | documentController.verifyDocument |
| POST | /documents/:documentId/replace | Required | - | replaceDocumentSchema | documentController.replaceDocument |
| DELETE | /documents/:documentId | Required | - | deleteDocumentSchema | documentController.deleteDocument |

### Loan Routes (`/api/v1/loan`)

| Method | Path | Auth | Roles | Validation | Controller |
|---|---|---|---|---|---|
| POST | /loan/apply | Required | - | loanApplicationSchema | loanController.applyForLoan |
| GET | /loan | Required | - | listLoansSchema | loanController.listLoans |
| GET | /loan/:id | Required | - | getLoanSchema | loanController.getLoan |
| PATCH | /loan/:id/review | Required | ADMIN, REVIEWER | loanReviewSchema | loanController.reviewLoan |

### Employment Routes (`/api/v1/employment`)

| Method | Path | Auth | Roles | Validation | Controller |
|---|---|---|---|---|---|
| POST | /employment | Required | - | employmentSchema | employmentController.saveEmployment |
| GET | /employment | Required | - | - | employmentController.getEmployment |

### Admin Routes (`/api/v1/admin`)

| Method | Path | Auth | Roles | Validation | Controller |
|---|---|---|---|---|---|
| GET | /admin/dashboard | Required | ADMIN | - | adminController.getDashboard |
| GET | /admin/users-kyc | Required | ADMIN | usersKycSchema | adminController.getUsersWithKycStatus |
| GET | /admin/audit | Required | ADMIN | auditLogsSchema | adminController.getAuditLogs |
| GET | /admin/stats/kyc | Required | ADMIN | - | adminController.getKycStats |
| GET | /admin/stats/documents | Required | ADMIN | - | adminController.getDocumentStats |
| GET | /admin/stats/system | Required | ADMIN | - | adminController.getSystemStats |
| GET | /admin/stats | Required | ADMIN | - | adminController.getStats |

### Health

| Method | Path | Auth | Controller |
|---|---|---|---|
| GET | /api/v1/health | Public | Inline handler |

---

## FastAPI Routes (port 8000)

| Method | Path | Purpose |
|---|---|---|
| POST | /api/v1/kyc/upload | Document upload + OCR trigger |
| POST | /api/v1/kyc/verify | Face verification |
| GET | /api/v1/kyc/status/:id | KYC application status |
| GET | /health | Health check |
