# Backend API Inventory

> **Base URL**: `/api/v1` (prefix applied in `src/routes/index.ts`)
> **Server**: Express 5.2.1 + TypeScript on port 4000 (dev) / 3000 (.env default)
> **Auth**: JWT Bearer tokens (access + refresh token rotation)
> **Response Format**: `{ success: boolean, message: string, data?: T, meta?: { page, limit, total, pages }, statusCode: number }`

---

## Auth Routes (`/api/v1/auth`)

### `POST /auth/register`
- **Controller**: `authController.register`
- **Service**: `authService.register`
- **Validation**: `registerSchema` (email, password min 8 chars)
- **Auth**: Public
- **Request**: `{ email: string, password: string }`
- **Response 201**: `{ accessToken, refreshToken, user: { id, email, role, isVerified } }`
- **Audit**: REGISTER action logged

### `POST /auth/login`
- **Controller**: `authController.login`
- **Service**: `authService.login`
- **Validation**: `loginSchema` (email, password)
- **Auth**: Public
- **Request**: `{ email: string, password: string }`
- **Response 200**: `{ accessToken, refreshToken, user: { id, email, role, isVerified } }`
- **Audit**: LOGIN action logged

### `POST /auth/logout`
- **Controller**: `authController.logout`
- **Service**: `authService.logout` (revokes all sessions)
- **Auth**: Required
- **Response 200**: `{ message: "Logged out successfully" }`
- **Audit**: LOGOUT action logged

### `POST /auth/refresh`
- **Controller**: `authController.refreshAccessToken`
- **Service**: `authService.refreshToken` (token rotation)
- **Validation**: `refreshTokenSchema`
- **Auth**: Public (uses refresh token)
- **Request**: `{ refreshToken: string }`
- **Response 200**: `{ accessToken, refreshToken, user }`
- **Audit**: REFRESH_TOKEN action logged

### `POST /auth/verify-email`
- **Controller**: `authController.verifyEmail`
- **Service**: `authService.verifyEmail`
- **Validation**: `verifyEmailSchema`
- **Auth**: Public (uses verification token)
- **Request**: `{ token: string }`
- **Response 200**: `{ message: "Email verified successfully" }`
- **Audit**: VERIFY_EMAIL action logged

### `POST /auth/forgot-password`
- **Controller**: `authController.forgotPassword`
- **Service**: `authService.forgotPassword` (fire-and-forget email)
- **Validation**: `forgotPasswordSchema`
- **Auth**: Public
- **Request**: `{ email: string }`
- **Response 200**: Always same message (security best practice)

### `POST /auth/reset-password`
- **Controller**: `authController.resetPassword`
- **Service**: `authService.resetPassword` (revokes all sessions)
- **Validation**: `resetPasswordSchema`
- **Auth**: Public (uses reset token)
- **Request**: `{ token: string, password: string }`
- **Response 200**: `{ message: "Password reset successfully" }`
- **Audit**: RESET_PASSWORD action logged

### `POST /auth/change-password`
- **Controller**: `authController.changePassword`
- **Service**: `authService.changePassword` (revokes other sessions)
- **Validation**: `changePasswordSchema`
- **Auth**: Required
- **Request**: `{ currentPassword: string, newPassword: string }`
- **Response 200**: `{ message: "Password changed successfully" }`
- **Audit**: CHANGE_PASSWORD action logged

---

## User Routes (`/api/v1/users`)

### `GET /users/me`
- **Controller**: `userController.getMe`
- **Service**: `userService.getUserProfile`
- **Auth**: Required
- **Response**: `{ id, email, role, isVerified, createdAt, updatedAt, fullName?, phone?, address?, avatarUrl? }`

### `PATCH /users/me`
- **Controller**: `userController.updateMe`
- **Service**: `userService.updateUser`
- **Validation**: `updateUserSchema`
- **Auth**: Required
- **Request**: `{ email?, fullName?, phone?, address? }`

### `PATCH /users/me/avatar`
- **Controller**: `userController.uploadAvatar`
- **Service**: `userService.updateProfileAvatar`
- **Middleware**: `avatarUpload` (Multer, single file "avatar")
- **Auth**: Required

### `DELETE /users/me/avatar`
- **Controller**: `userController.deleteAvatar`
- **Service**: `userService.removeProfileAvatar`
- **Auth**: Required

### `GET /users`
- **Controller**: `userController.listUsers`
- **Service**: `userService.listUsers`
- **Validation**: `listUsersSchema`
- **Auth**: ADMIN
- **Query**: `page`, `limit`, `search`
- **Response**: Paginated user list

### `GET /users/:id`
- **Controller**: `userController.getUser`
- **Service**: `userService.getUserById`
- **Validation**: `getUserByIdSchema`
- **Auth**: ADMIN

### `PATCH /users/:id/profile`
- **Controller**: `userController.updateProfile`
- **Service**: `userService.updateUser`
- **Validation**: `updateUserProfileSchema`
- **Auth**: ADMIN

### `PATCH /users/:id/role`
- **Controller**: `userController.changeUserRole`
- **Service**: `userService.changeUserRole`
- **Validation**: `updateUserRoleSchema`
- **Auth**: ADMIN
- **Request**: `{ role: "USER" | "ADMIN" | "REVIEWER" }`

### `DELETE /users/:id`
- **Controller**: `userController.deleteUser`
- **Service**: `userService.softDeleteUser`
- **Validation**: `deleteUserSchema`
- **Auth**: ADMIN

---

## KYC Routes (`/api/v1/kyc`)

### `POST /kyc/submit`
- **Controller**: `kycController.submitKyc`
- **Service**: `kycService.submitKyc`
- **Middleware**: `uploadMiddleware.fields([selfie, idProof, addressProof])`
- **Auth**: Required
- **Request**: Multipart form with files + documents metadata

### `GET /kyc/my-status`
- **Controller**: `kycController.getMyStatus`
- **Service**: `kycService.getKycStatus`
- **Auth**: Required
- **Response**: Latest KYC application for current user

### `GET /kyc/status`
- **Controller**: `kycController.getKycStatus`
- **Service**: `kycService.getKycStatus`
- **Validation**: `getKycStatusSchema`
- **Auth**: Required
- **Query**: `kycId`

### `GET /kyc`
- **Controller**: `kycController.listKycApplications`
- **Service**: `kycService.listKycApplications`
- **Validation**: `listKycApplicationsSchema`
- **Auth**: ADMIN, REVIEWER
- **Query**: `page`, `limit`, `status`, `search`
- **Response**: Paginated KYC list

### `GET /kyc/:id`
- **Controller**: `kycController.getKycById`
- **Service**: `kycService.getKycById`
- **Validation**: `getKycByIdSchema`
- **Auth**: ADMIN, REVIEWER

### `PATCH /kyc/:id/approve`
- **Controller**: `kycController.approveKyc`
- **Service**: `kycService.approveKyc` (sends approval email)
- **Validation**: `approveKycSchema`
- **Auth**: ADMIN, REVIEWER
- **Request**: `{ notes? }`

### `PATCH /kyc/:id/reject`
- **Controller**: `kycController.rejectKyc`
- **Service**: `kycService.rejectKyc` (sends rejection email)
- **Validation**: `rejectKycSchema`
- **Auth**: ADMIN, REVIEWER
- **Request**: `{ rejectionReason: string }`

### `PATCH /kyc/:id/request-resubmit`
- **Controller**: `kycController.requestKycResubmit`
- **Service**: `kycService.requestResubmit` (sends resubmit email)
- **Validation**: `requestResubmitSchema`
- **Auth**: ADMIN, REVIEWER
- **Request**: `{ note: string }`

### `GET /kyc/:kycId/documents`
- **Controller**: `documentController.getKycDocuments`
- **Validation**: `getKycDocumentsSchema`
- **Auth**: Required

---

## Document Routes (`/api/v1/kyc/documents`)

### `POST /kyc/documents/upload`
- **Controller**: `documentController.uploadDocument`
- **Service**: `documentService.uploadDocument`
- **Middleware**: Multer single file "document"
- **Validation**: `uploadDocumentSchema`
- **Auth**: Required

### `GET /kyc/documents/:documentId`
- **Controller**: `documentController.getDocument`
- **Service**: `documentService.getDocument`
- **Validation**: `getDocumentSchema`
- **Auth**: Required

### `PATCH /kyc/documents/:documentId/verify`
- **Controller**: `documentController.verifyDocument`
- **Service**: `documentService.verifyDocument`
- **Validation**: `verifyDocumentSchema`
- **Auth**: ADMIN, REVIEWER
- **Request**: `{ status, notes? }`

### `POST /kyc/documents/:documentId/replace`
- **Controller**: `documentController.replaceDocument`
- **Service**: `documentService.replaceDocument`
- **Middleware**: Multer single file "document"
- **Validation**: `replaceDocumentSchema`
- **Auth**: Required

### `DELETE /kyc/documents/:documentId`
- **Controller**: `documentController.deleteDocument`
- **Service**: `documentService.deleteDocument`
- **Validation**: `deleteDocumentSchema`
- **Auth**: Required (soft delete)

---

## Loan Routes (`/api/v1/loan`)

### `POST /loan/apply`
- **Controller**: `loanController.applyForLoan`
- **Service**: `loanService.applyForLoan` (requires approved KYC)
- **Validation**: `loanApplicationSchema`
- **Auth**: Required
- **Request**: `{ requestedAmount, tenureMonths, purpose }`

### `GET /loan`
- **Controller**: `loanController.listLoans`
- **Service**: `loanService.listLoans`
- **Validation**: `listLoansSchema`
- **Auth**: Required (users see own, admin/reviewer see all)
- **Query**: `page`, `limit`, `status`, `userId`

### `GET /loan/:id`
- **Controller**: `loanController.getLoan`
- **Service**: `loanService.getLoanById`
- **Validation**: `getLoanSchema`
- **Auth**: Required (role-based access)

### `PATCH /loan/:id/review`
- **Controller**: `loanController.reviewLoan`
- **Service**: `loanService.reviewLoan`
- **Validation**: `loanReviewSchema`
- **Auth**: ADMIN, REVIEWER
- **Request**: `{ action: "APPROVED" | "REJECTED", notes? }`

---

## Employment Routes (`/api/v1/employment`)

### `POST /employment`
- **Controller**: `employmentController.saveEmployment`
- **Service**: `employmentService.saveEmployment`
- **Validation**: `employmentSchema`
- **Auth**: Required

### `GET /employment`
- **Controller**: `employmentController.getEmployment`
- **Service**: `employmentService.getEmployment`
- **Auth**: Required

---

## Admin Routes (`/api/v1/admin`)

### `GET /admin/dashboard`
- **Controller**: `adminController.getDashboard`
- **Auth**: ADMIN
- **Response**: Stats (users, KYC, documents), recent activity

### `GET /admin/users-kyc`
- **Controller**: `adminController.getUsersWithKycStatus`
- **Validation**: `usersKycSchema`
- **Auth**: ADMIN
- **Query**: `page`, `limit`, `status`, `search`

### `GET /admin/audit`
- **Controller**: `adminController.getAuditLogs`
- **Validation**: `auditLogsSchema`
- **Auth**: ADMIN
- **Query**: `page`, `limit`, `action`, `userId`, `startDate`, `endDate`

### `GET /admin/stats/kyc`
- **Controller**: `adminController.getKycStats`
- **Auth**: ADMIN

### `GET /admin/stats/documents`
- **Controller**: `adminController.getDocumentStats`
- **Auth**: ADMIN

### `GET /admin/stats/system`
- **Controller**: `adminController.getSystemStats`
- **Auth**: ADMIN

### `GET /admin/stats`
- **Controller**: `adminController.getStats`
- **Auth**: ADMIN

---

## Health Route

### `GET /api/v1/health`
- **Response**: `{ success: true, message: "Server is running", timestamp }`
- **Auth**: Public

---

## FastAPI Endpoints (KYC Service, port 8000)

### `POST /api/v1/kyc/upload`
- Upload document (citizenship_front, citizenship_back, selfie)
- Triggers OCR for citizenship documents

### `POST /api/v1/kyc/verify`
- Face verification between selfie and ID document

### `GET /api/v1/kyc/status/:kyc_application_id`
- Get KYC status with documents, OCR results, face verifications

### `GET /health`
- Health check
