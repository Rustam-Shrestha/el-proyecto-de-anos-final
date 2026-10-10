# Frontend Feature Map

> Each feature lives under `src/features/<name>/` with its own api/, pages/, components/, hooks/ subdirectories.

---

## Auth Feature

**Purpose**: Authentication, registration, token management

**Frontend Files**:
- `features/auth/api/authApi.ts` — `loginRequest()`, `registerRequest()` (uses shared apiClient)
- `features/auth/pages/LoginPage.tsx` — Re-exports `src/auth/index.tsx`
- `features/auth/pages/RegisterPage.tsx` — Wraps `RegisterForm`
- `features/auth/components/RegisterForm.tsx` — Registration form with validation
- `features/auth/store/authSlice.ts` — Feature-specific auth slice (duplicate of global store slice)

**Backend APIs Used**:
- `POST /api/v1/auth/login`
- `POST /api/v1/auth/register`
- `GET /api/v1/users/me`

**Global Store**:
- `store/slices/authSlice.ts` — `user`, `userData`, `accessToken`, `refreshToken`, `isAuthenticated`, `isLoading`, `error`, `clientDetails`

---

## Dashboard Feature

**Purpose**: Main dashboard and admin dashboard views

**Frontend Files**:
- `features/dashboard/pages/AdminDashboardPage.tsx` — Admin stats dashboard
- `features/dashboard/api/` — Dashboard API queries

**Backend APIs Used**:
- `GET /api/v1/admin/dashboard`
- `GET /api/v1/admin/stats`

**Shared Pages**:
- `pages/DashboardPage.tsx` — Main user dashboard with quick links

---

## KYC Feature

**Purpose**: KYC application submission, status tracking, admin review

**Frontend Files**:
- `features/kyc/api/kycApi.ts` — All KYC API hooks (useKYCList, useGetKYCDetails, useGetMyKYCStatus, useSubmitKYCMutation, useUploadDocumentMutation, useApproveKYCMutation, useRejectKYCMutation, useGetKYCDocuments, useVerifyDocumentMutation, useReplaceDocumentMutation, KycApiService for FastAPI)
- `features/kyc/hooks/useKYC.ts` — Hook wrapping kycApiService for document upload, face verification, status polling
- `features/kyc/pages/KYCPage.tsx` — Admin KYC list panel
- `features/kyc/pages/KYCListPage.tsx` — KYC application list (admin/reviewer)
- `features/kyc/pages/UserKYCPage.tsx` — User-facing KYC submission form
- `features/kyc/pages/KYCStatusPage.tsx` — User-facing KYC status
- `features/kyc/components/` — KYC-specific components (forms, wizards)
- `features/kyc/index.ts` — Exports

**Backend APIs Used**:
- `POST /api/v1/kyc/submit`
- `GET /api/v1/kyc/my-status`
- `GET /api/v1/kyc/status`
- `GET /api/v1/kyc` (admin/reviewer)
- `GET /api/v1/kyc/:id`
- `PATCH /api/v1/kyc/:id/approve`
- `PATCH /api/v1/kyc/:id/reject`
- `PATCH /api/v1/kyc/:id/request-resubmit`
- `POST /api/v1/kyc/documents/upload`
- `GET /api/v1/kyc/:kycId/documents`
- `PATCH /api/v1/kyc/documents/:id/verify`
- `POST /api/v1/kyc/documents/:id/replace`
- `DELETE /api/v1/kyc/documents/:id`
- `POST /api/v1/kyc/upload` (FastAPI)
- `POST /api/v1/kyc/verify` (FastAPI)
- `GET /api/v1/kyc/status/:id` (FastAPI)

**Database Models**: `KycApplication`, `Document`, `DocumentVersion`, `OCRResult`, `FaceVerification`

---

## Loan Feature

**Purpose**: Loan application, status tracking, officer review

**Frontend Files**:
- `features/loans/pages/LoanApplicationPage.tsx` — User loan application form
- `features/loans/pages/LoanStatusPage.tsx` — User loan status view
- `features/loans/pages/LoanOfficerDashboardPage.tsx` — Admin/reviewer loan review dashboard
- `features/loans/components/` — Loan-specific components
- `features/loans/api/` — Loan API integration

**Backend APIs Used**:
- `POST /api/v1/loan/apply`
- `GET /api/v1/loan`
- `GET /api/v1/loan/:id`
- `PATCH /api/v1/loan/:id/review`

**Database Models**: `LoanApplication`, `EmploymentInfo`, `BorrowerFeatures`

---

## Users Feature

**Purpose**: User list, management, role administration

**Frontend Files**:
- `features/users/api/usersApi.ts` — User CRUD API calls
- `features/users/pages/UsersPage.tsx` — User list page (admin)
- `features/users/pages/UserAccessPage.tsx` — User access/role management
- `features/users/hooks/useUsers.ts` — Custom hooks for user data
- `features/users/components/` — User-specific components (UserCard, etc.)

**Backend APIs Used**:
- `GET /api/v1/users`
- `GET /api/v1/users/:id`
- `PATCH /api/v1/users/:id/profile`
- `PATCH /api/v1/users/:id/role`
- `DELETE /api/v1/users/:id`

**Database Models**: `User`, `Profile`, `Role`

---

## Profile Feature

**Purpose**: User profile management, avatar upload

**Frontend Files**:
- `features/profile/pages/ProfilePage.tsx` — Profile editing page
- `features/profile/components/` — Profile components
- `features/profile/api/` — Profile API calls

**Backend APIs Used**:
- `GET /api/v1/users/me`
- `PATCH /api/v1/users/me`
- `PATCH /api/v1/users/me/avatar`
- `DELETE /api/v1/users/me/avatar`

---

## Admin Feature

**Purpose**: Admin-specific pages and components

**Frontend Files**:
- `features/admin/pages/` — Admin pages
- `features/admin/components/` — Admin components
- `features/admin/api/` — Admin API calls

**Backend APIs Used**:
- `GET /api/v1/admin/dashboard`
- `GET /api/v1/admin/users-kyc`
- `GET /api/v1/admin/audit`
- `GET /api/v1/admin/stats/*`

---

## UI Feature

**Purpose**: UI state management (theme, modals)

**Frontend Files**:
- `features/ui/store/uiSlice.ts` — Redux slice (duplicate of global store slice)

**Global Store**:
- `store/slices/uiSlice.ts` — `isSidebarOpen`, `theme`, `darkMode`, `themeColor`, `notifications`, `modalContent`, `modalProps`, `showProfileDropdown`, `showThemeModal`
