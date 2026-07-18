# Technical Debt & Known Issues

> This document catalogs issues discovered during codebase analysis. Items are not fixed — they are documented for future planning.

---

## Frontend Issues

### 1. Dual Architecture in Migration
The frontend has parallel/legacy implementations in several areas, indicating an incomplete migration:

| Area | Legacy | Current |
|---|---|---|
| API Client | `src/services/apiService.ts` (legacy axios) | `src/shared/lib/apiClient.ts` (current) |
| Query Client | `src/services/queryClient.ts` | `src/app/queryClient.ts` |
| Auth Hook | `src/hooks/useAuth.ts` (service-based) | `src/store/hooks.ts` `useAuth` (Redux-based) |
| Router | `src/AppRouter.tsx` (component-based) | `src/app/router.tsx` (createBrowserRouter) |
| Auth Slice | `src/features/auth/store/authSlice.ts` | `src/store/slices/authSlice.ts` |
| UI Slice | `src/features/ui/store/uiSlice.ts` | `src/store/slices/uiSlice.ts` |

### 2. Orphan Pages / Components
- `src/pages/DashboardPage.tsx` — Main dashboard not in a feature folder
- `src/auth/index.tsx` — Auth component lives outside features folder
- `src/services/endpoints/` — Old endpoint configs not referenced by new code

### 3. Dead / Deprecated Contexts
- `src/context/ThemeContext.tsx` — Deprecated (migrated to Redux)
- `src/context/index.tsx` — ModalContext (migration bridge)

### 4. Duplicate Auth Slices
- `src/store/slices/authSlice.ts` (global)
- `src/features/auth/store/authSlice.ts` (feature-level, duplicate)

### 5. Duplicate UI Slices
- `src/store/slices/uiSlice.ts` (global)
- `src/features/ui/store/uiSlice.ts` (feature-level, duplicate)

### 6. Inconsistent API Client Usage
- Most features use `shared/lib/apiClient.ts` (current)
- `src/auth/index.tsx` (login page) uses `services/apiService.ts` (legacy)
- `features/kyc/api/kycApi.ts` uses both `shared/lib/apiClient` and raw `axios` for FastAPI

### 7. Sidebar Role Detection
- `src/shared/components/Sidebar.tsx` checks `userData?.role` which may be an array or string
- Has complex normalization logic for array roles

### 8. Reports Page
- `/dashboard/reports` route shows a "Coming Soon" placeholder component
- Route exists, sidebar link exists, but no implementation

### 9. Route Duplication
- Both `/app/*` and `/dashboard/*` route groups exist under `DashboardLayout`
- `/app/dashboard` and `/dashboard` both render `DashboardPage`
- `/app/users` and `/dashboard/users` both render `UsersPage`
- `/app/kyc` renders `KYCPage` while `/dashboard/kyc` renders `KYCListPage` (different components!)

### 10. `@ts-nocheck` Files
- `src/hooks/useApiQuery.ts` — uses `@ts-nocheck`
- `src/hooks/useUI.ts` — uses `@ts-nocheck`
- `src/store/slices/accountSlice.ts` — uses `@ts-nocheck`
- `src/services/apiService.ts` — uses `@ts-nocheck`

### 11. Login Page Uses Legacy API
- `src/auth/index.tsx` (the actual login component) uses `apiService` and `endpoints` from legacy services
- Does NOT use the shared `apiClient` or the feature-level `authApi.ts`

### 12. Missing TypeScript Types
- `src/types/index.ts` — Need to verify content
- Many shared types are defined inline rather than in the types directory

### 13. `src/hooks/useAuth.ts` — Legacy Hook
- Uses `useAuthService()` from deprecated services/authService
- Attempts `/users/me` on mount but has empty try block
- Not connected to Redux

### 14. Login Route Redirect
- After login, user is redirected to `/app/dashboard` but both `/app/dashboard` and `/dashboard` exist

---

## Backend Issues

### 1. Empty File Placeholders
- `src/models/userModel.ts` — Empty file
- `src/db/pool.ts` — Empty file (likely replaced by Prisma)
- `src/db/init.ts` — Empty file
- `tests/setup-env.ts` — Empty file
- `tests/auth.test.ts` — Empty file
- `tests/users.test.ts` — Empty file
- `src/routes/healthRoutes.ts` — Empty file

### 2. Incomplete Migration (pg → Prisma)
- Old `db/pool.ts` (empty) suggests migration from raw pg to Prisma
- `src/config/database.ts` uses Prisma with `@prisma/adapter-pg`
- Some services may still reference pool pattern

### 3. TypeScript 6.0 with Compatibility Flags
- `tsconfig.json` uses `"ignoreDeprecations": "6.0"` — running on newer TypeScript with compatibility workaround

### 4. Audit Log Actions Not Exhaustive
- `adminController.getAuditLogs` has a bare `catch` block with no error logging
- Error responses may be swallowed silently

### 5. Hardcoded HTTP 500 in Some Catch Blocks
- Several controllers have catch blocks that only log "..." (adminController truncated catch blocks)

### 6. Missing RBAC on Some Routes
- `GET /kyc/documents/:kycId` has no role restriction (only `authenticate`)
- `GET /kyc/status` requires authentication but no specific role
- `POST /kyc/submit` requires authentication but no role check

### 7. Session Revocation on Password Change
- `authService.changePassword` revokes ALL sessions including the current one
- User may be logged out after password change

### 8. FastAPI Service Connection
- No documented endpoint in Node backend proxies requests to FastAPI
- Frontend KYC code calls FastAPI directly at `http://localhost:8000`
- This bypasses the main API gateway and auth middleware

### 9. OAuth2 Extension Point
- `src/middleware/oauth2.ts` is 4 lines — just `import passport from 'passport'`
- No actual OAuth2 implementation

### 10. Missing Email Template Files
- `mailService.ts` sends emails but no template files found
- Email content is likely hardcoded in the service

### 11. Test Files Empty
- `tests/auth.test.ts`, `tests/users.test.ts`, `tests/setup-env.ts` are all empty
- No test coverage for existing routes/controllers/services

### 12. Document Type Enum vs String
- Prisma schema uses `DocumentType` enum, but some code references string values like `'INCOME_PROOF'`
- `riskService.ts` uses string literals for `documentType` that match enum values

### 13. User Model `role` Field
- Prisma schema uses `roleId` (FK to Role table), but `userService.ts` selects `role: true` which would fail
- The actual Prisma model has `roleId String` + `role Role @relation`
- Some services may be using incorrect field names

### 14. No Request Rate Limiting on Auth Routes
- `authRoutes.ts` has no rate limiting on login/register endpoints
- Brute force protection is not implemented

---

## Database Issues

### 1. Schema in `auth` Schema
- All Prisma models use `@@schema("auth")`
- This means tables are created in the `auth` schema, not `public`
- Migration SQL creates them in `public` — potential mismatch

### 2. Migration SQL vs Prisma Schema
- Initial migration creates tables in `public` schema
- Prisma schema specifies `@@schema("auth")` 
- Potential access issue if schema is not set correctly

### 3. Missing Indexes
- `profiles` table only has `userId` index
- `sessions` table only has `userId` and `expiresAt` indexes
- `audit_logs` has `userId`, `action`, `createdAt` indexes
- Could benefit from composite indexes for common query patterns

### 4. No Soft Delete Column on KYC/Documents
- Documents have `isDeleted` field
- KYC applications do NOT have `isDeleted` — hard delete only

---

## Gap Discovery

### Unlinked / Unreachable Pages
- All routes defined in `router.tsx` have sidebar links or are accessible via direct navigation

### Routes Without Sidebar Links
- `/dashboard/reports` — In sidebar but shows "Coming Soon" placeholder

### Backend Endpoints Without Frontend Integration
- `POST /auth/verify-email` — No frontend verify email page found
- `POST /auth/forgot-password` — No frontend forgot password page found
- `POST /auth/reset-password` — No frontend reset password page found
- `GET /admin/stats/kyc`, `/admin/stats/documents`, `/admin/stats/system` — Standalone stats endpoints not directly called by frontend (frontend uses `/admin/dashboard` which aggregates)

### Frontend Requests Without Backend Support
- FastAPI endpoints called from frontend: `POST /kyc/upload`, `POST /kyc/verify`, `GET /kyc/status/:id` — These are served by FastAPI (port 8000), not Node backend (port 4000)
- Employment endpoints (POST/GET `/employment`) — Frontend integration unclear

### Multi-Step KYC Flow
- Frontend KYC feature has a 5-step wizard (likely using `react-hook-form`) that calls both Node backend (document CRUD) and FastAPI (OCR + face verification)
- The exact KYC submit flow bridges both services
