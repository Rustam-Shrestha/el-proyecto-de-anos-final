# Frontend Route Inventory

> **Source**: `src/app/router.tsx` (React Router v6.4+ `createBrowserRouter`)
> **Layout**: `src/shared/layouts/DashboardLayout.tsx`
> **Entry**: `src/main.tsx` renders `<RouterProvider router={router} />`
> **Auth Guards**: `ProtectedRoute` (auth check), `RoleProtectedRoute` (role check)

---

## Route Table

### Public Routes

| Path | Component | Guard | Purpose |
|---|---|---|---|
| `/` | `Navigate → /dashboard` | None | Root redirect |
| `/login` | `LoginPage` | None | Login form |
| `/register` | `RegisterPage` | None | Registration form |
| `/auth` | `Navigate → /login` | None | Auth redirect |
| `*` | `NotFoundPage` | None | 404 catch-all |

### Protected Routes (`/app/*`) — DashboardLayout

| Path | Component | Roles | Purpose |
|---|---|---|---|
| `/app` | `Navigate → /app/dashboard` | auth | App root redirect |
| `/app/dashboard` | `DashboardPage` | user, admin | Main dashboard |
| `/app/users` | `UsersPage` | admin | User management |
| `/app/kyc` | `KYCPage` | admin | KYC admin panel |
| `/app/access-denied` | `AccessDeniedPage` | auth | Access denied page |
| `/app/user-access` | `UserAccessPage` | admin | User access control |

### Protected Routes (`/dashboard/*`) — DashboardLayout

| Path | Component | Roles | Purpose |
|---|---|---|---|
| `/dashboard` | `DashboardPage` | user, admin | Main dashboard (default) |
| `/dashboard/admin` | `AdminDashboardPage` | admin | Admin statistics dashboard |
| `/dashboard/users` | `UsersPage` | admin | User management |
| `/dashboard/kyc` | `KYCListPage` | admin, reviewer | KYC application list |
| `/dashboard/kyc-submit` | `UserKYCPage` | user, admin | Submit KYC application |
| `/dashboard/kyc-status` | `KYCStatusPage` | user, admin | View KYC status |
| `/dashboard/reports` | `RoutePlaceholder` | admin | **NOT IMPLEMENTED** (placeholder) |
| `/dashboard/loans` | `LoanOfficerDashboardPage` | admin, reviewer | Loan review dashboard |
| `/dashboard/loans/apply` | `LoanApplicationPage` | user, admin | Apply for a loan |
| `/dashboard/loans/status` | `LoanStatusPage` | user, admin | View loan status |
| `/dashboard/profile` | `ProfilePage` | user, admin | User profile management |

---

## Route Guard Hierarchy

```
ProtectedRoute
├── Checks: isAuthenticated from Redux
├── On failure: Navigate → /login
├── On success: Fetches /users/me if userData missing
│
└── RoleProtectedRoute
    ├── Checks: user role against requiredRoles
    ├── On failure: AccessDeniedPage (or custom fallback)
    └── On success: Renders child component
```

---

## Sidebar Navigation Items

### User Role
- Dashboard (`/dashboard`)
- Submit KYC (`/dashboard/kyc-submit`)
- KYC Status (`/dashboard/kyc-status`)
- Apply for Loan (`/dashboard/loans/apply`)
- My Loans (`/dashboard/loans/status`)
- Profile (`/dashboard/profile`)

### Admin Role (additional section)
- Admin Dashboard (`/dashboard/admin`)
- Users Management (`/dashboard/users`)
- KYC Applications (`/dashboard/kyc`)
- Loan Applications (`/dashboard/loans`)
- Reports (`/dashboard/reports`)

### Reviewer Role
- KYC Applications (`/dashboard/kyc`)
- Loan Applications (`/dashboard/loans`)

---

## Lazy Loaded Components

All page components use `React.lazy()` for code splitting:

```typescript
const LoginPage = lazy(() => import("@features/auth/pages/LoginPage"));
const AdminDashboardPage = lazy(() => import("@features/dashboard/pages/AdminDashboardPage"));
const ProfilePage = lazy(() => import("@features/profile/pages/ProfilePage"));
const UsersPage = lazy(() => import("@features/users/pages/UsersPage"));
const KYCListPage = lazy(() => import("@features/kyc/pages/KYCListPage"));
const KYCPage = lazy(() => import("@features/kyc/pages/KYCPage"));
const UserKYCPage = lazy(() => import("@features/kyc/pages/UserKYCPage"));
const KYCStatusPage = lazy(() => import("@features/kyc/pages/KYCStatusPage"));
const LoanApplicationPage = lazy(() => import("@features/loans/pages/LoanApplicationPage"));
const LoanStatusPage = lazy(() => import("@features/loans/pages/LoanStatusPage"));
const LoanOfficerDashboardPage = lazy(() => import("@features/loans/pages/LoanOfficerDashboardPage"));
const DashboardPage = lazy(() => import("@pages/DashboardPage"));
const NotFoundPage = lazy(() => import("@pages/NotFoundPage"));
const UserAccessPage = lazy(() => import("@features/users/pages/UserAccessPage"));
```
