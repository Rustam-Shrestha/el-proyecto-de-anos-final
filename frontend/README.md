# README.md — FinGuard Frontend (Canonical Architecture & Engineering Guide)

> Source of truth for autonomous coding agents and frontend engineers working in `frontend`.
> Extracted directly from the actual codebase. Read once per session before touching components or routing.
> **Philosophy:** Search → Map → Read → Reuse → Extend → Modify. Never duplicate logic. Ship right once.

---

## 1. TECH STACK (Confirmed from Codebase & Dependencies)

- **Runtime & Language**: React `18.3.1` / React 19 compat with TypeScript `6.0.3` (`typescript`, `tsx`)
- **Bundler & Build Tool**: Vite `8.2.2` (`@vitejs/plugin-react 6.0.2`)
- **Client Routing**: React Router v7 (`react-router-dom 7.15.1`, Data router via `createBrowserRouter`)
- **Global Application State**: Redux Toolkit `2.12.0` (`@reduxjs/toolkit`, `react-redux 9.3.0`)
- **Server Data Cache**: TanStack React Query v5 `5.100.11` (`@tanstack/react-query`)
- **Styling & Design System**: Tailwind CSS `3.4.13` (`tailwindcss`, `postcss 8.5.15`, `autoprefixer 10.5.0`)
- **Iconography**: Lucide React `1.16.0` (`lucide-react`)
- **Forms & Validation**: React Hook Form `7.76.0`, Zod `4.4.3`, `@hookform/resolvers 5.2.2`
- **Data Visualization**: Highcharts `13.0.0` (`highcharts`)
- **Export & Document Generation**: jsPDF `4.2.1`, jsPDF-AutoTable `5.0.8`, SheetJS (`xlsx 0.18.5`), html2canvas `1.4.1`
- **Real-Time WebSockets**: Socket.io-client `4.8.1` (`socket.io-client`)
- **HTTP Client**: Axios `1.16.1` (`axios`) with Bearer token injection and 401 redirect interceptors

**Environment Variables (`frontend/.env` validated via `src/shared/lib/env.ts`):**
- `VITE_API_BASE_URL` (API backend URL, default: `http://localhost:4000/api/v1`)
- `VITE_WS_URL` (WebSocket server URL, default: `http://localhost:4000`)
- `VITE_APP_TITLE` (default: `FinGuard Platform`)

---

## 2. BOOT SEQUENCE (`src/main.tsx` & `src/providers/AppProviders.tsx`) — Never Change Order

```
[1] Root Mounting (src/main.tsx)
    └─ Mounts to DOM node #root with React.StrictMode.
    └─ Wraps tree in top-level <Suspense fallback={<LoadingModule />}> for route-level code splitting.

[2] Provider Tree Composition (src/providers/AppProviders.tsx)
    <Provider store={store}>                 Redux Toolkit: auth, tenant, ui, account slices
      <QueryClientProvider client={queryClient}>  TanStack Query: server cache, deduplication, retry
        <ThemeBootstrap />                   Syncs Redux uiSlice.themeColor & darkMode to DOM CSS vars
          <RouterProvider router={router} /> React Router v7 Data Router: route matching & gates

[3] Route Resolution & Security Gates (src/app/router.tsx)
    ├─ <ProtectedRoute>: Verifies active accessToken in Redux authSlice / localStorage.
    │   └─ Redirects unauthenticated sessions to /login.
    ├─ <RoleProtectedRoute requiredRoles={[...]}>:
    │   └─ Verifies user.role matches authorized whitelist.
    │   └─ Unauthorized attempts redirect to /unauthorized or root dashboard.
    └─ <DashboardLayout>:
        └─ Mounts global shell: <Sidebar />, <Navbar />, and dynamic view via <Outlet />.
```

---

## 3. STATE & DATA HIERARCHY (Non-Negotiable Architecture)

```
Server Data Cache   → TanStack React Query via useApiQuery & useApiMutation (src/hooks/useApiQuery.ts)
                      staleTime: 30s, gcTime: 5m, auto-unwraps response?.data?.data ?? response?.data.
                      NEVER store raw server lists, KYC records, or loans in Redux slices.

Global App State    → Redux Toolkit (src/store/slices/), 4 dedicated slices:
                      1. authSlice: user record, userData, accessToken, refreshToken, clientDetails.
                      2. tenantSlice: active multi-tenant configuration, current tenant slug, features.
                      3. uiSlice: sidebar open/close, theme ('light'|'dark'), themeColor HSL, modals.
                      4. accountSlice: selected client account, budget filters, active fiscal period.
                      Accessed exclusively via typed hooks: useAppSelector, useAppDispatch, useAuth, useUI.

Local UI State      → React useState / useReducer:
                      Form field inputs, transient dropdown toggles, modal-local filters, dirty flags.
```

---

## 4. REPOSITORY LAYOUT (Actual Tree from Codebase)

```
frontend/
├── index.html                    # Single-page HTML container with #root element
├── vite.config.ts                # Vite config: path aliases (@app, @features, @shared, etc.)
├── tailwind.config.cjs           # Tailwind theme tokens, HSL primary colors, and utility plugins
├── src/
│   ├── main.tsx                  # Application entry point, React root mount, top-level Suspense
│   ├── app/                      # Application core configuration
│   │   ├── router.tsx            # Complete route definition tree with lazy loading
│   │   ├── ProtectedRoute.tsx    # Authentication guard checking active token
│   │   ├── RoleProtectedRoute.tsx# RBAC guard evaluating user role against requiredRoles
│   │   ├── DashboardIndex.tsx    # Role-aware landing dispatcher for /dashboard
│   │   ├── store.ts              # Redux store configuration and slice registration
│   │   └── queryClient.ts        # TanStack QueryClient instance and caching policies
│   ├── providers/                # App-wide provider composition
│   │   └── AppProviders.tsx      # Provider tree: Redux Provider, QueryClientProvider, ThemeBootstrap
│   ├── features/                 # Modular domain slices (11 feature modules)
│   │   ├── auth/                 # Login, Register, Multi-tenant slug login
│   │   ├── dashboard/            # Admin dashboard, analytics, visual reports
│   │   ├── kyc/                  # User identity submission, reviewer inspection queue
│   │   ├── loans/                # Loan origination, officer queue, portfolio oversight
│   │   ├── finguard/             # Bank statement analytics, cash-flow radar, credit health
│   │   ├── company/              # Tenant onboarding and company registration requests
│   │   ├── supercontroller/      # Supercontroller governance console, feature toggles
│   │   ├── users/                # Administrative user management and role assignment
│   │   ├── profile/              # User profile settings and security management
│   │   ├── notifications/        # Notification bell and alert center
│   │   └── admin/                # Platform admin utilities
│   ├── shared/                   # Cross-feature reusable infrastructure
│   │   ├── components/           # UI primitive component library (33+ components)
│   │   ├── layouts/              # DashboardLayout, AuthLayout, PublicLayout
│   │   ├── lib/                  # Theme application (HSL CSS vars), env parsing
│   │   ├── types/                # Shared TypeScript models (Loan, KYC, User, Tenant)
│   │   └── utils/                # Date formatting, currency, number helpers
│   ├── services/                 # API clients and HTTP abstraction layer
│   │   ├── apiService.ts         # Axios instance with auth interceptors
│   │   ├── endpoints/index.ts    # Single source of truth for API endpoint URLs
│   │   ├── authService.ts        # Login, register, token refresh calls
│   │   ├── kycService.ts         # KYC submission and status retrieval
│   │   ├── portfolioService.ts   # Loan portfolio and bureau data fetching
│   │   └── userService.ts        # User listing and profile modification
│   ├── hooks/                    # Global React hooks
│   │   ├── reduxHooks.ts         # Typed useAppDispatch and useAppSelector
│   │   ├── useApiQuery.ts        # TanStack Query wrappers: useApiQuery, useApiMutation
│   │   ├── useAuth.ts            # Authentication state and login/logout methods
│   │   ├── useUI.ts              # UI theme, sidebar, and modal controllers
│   │   ├── useDebounce.tsx       # Input debounce hook
│   │   └── useClickOutside.tsx   # Dropdown and modal click-outside detector
│   ├── store/                    # Redux Toolkit store and slices
│   │   └── slices/               # authSlice, tenantSlice, uiSlice, accountSlice
│   ├── pages/                    # Public static pages, ErrorPage, UnauthorizedPage, ChatPage
│   └── styles/                   # global.css and Tailwind base layers
```

---

## 5. GLOBAL HOOKS INVENTORY (`src/hooks/`)

| Hook | File | Signature & Behavior |
|---|---|---|
| `useApiQuery` | `useApiQuery.ts` | `(queryKey, url, options?) => { data, isLoading, error, refetch }`<br>Wraps `useQuery`. Calls `apiService.get(url)`, unwraps `response?.data?.data ?? response?.data`. Default `staleTime: 30s`. |
| `useApiMutation` | `useApiMutation.ts` | `(defaultUrl?, defaultMethod='post', options?) => { mutate, mutateAsync, isPending }`<br>Wraps `useMutation`. Auto-invalidates queries via `options.invalidateKeys`. |
| `useAuth` | `useAuth.ts` | `() => { user, userData, accessToken, isAuthenticated, login, logout }`<br>Selects from `authSlice`. `logout()` clears localStorage and resets session state. |
| `useUI` | `useUI.ts` | `() => { isSidebarOpen, theme, darkMode, themeColor, toggleSidebar, toggleDarkMode, openModal, closeModal }`<br>Selects and dispatches actions on `uiSlice`. |
| `useAppSelector` | `reduxHooks.ts` | `TypedUseSelectorHook<RootState>`<br>Typesafe Redux state selector. |
| `useAppDispatch` | `reduxHooks.ts` | `() => AppDispatch`<br>Typesafe Redux action dispatcher. |
| `useDebounce` | `useDebounce.tsx` | `(value, delay) => debouncedValue`<br>Debounces search inputs and high-frequency form filters. |
| `useClickOutside`| `useClickOutside.tsx` | `(callback, extraRefs?) => containerRef`<br>Detects clicks outside dropdowns and modals to trigger close. |
| `useKyc` | `useKyc.ts` | `() => { submitKyc, verifyStatus, kycData, isUploading }`<br>Convenience wrapper over KYC mutations and queries. |
| `useAdmin` | `useAdmin.ts` | `() => { users, roles, fetchUsers, updateUserRole }`<br>Hooks into administrative user management services. |

---

## 6. SERVICES & API CLIENTS (`src/services/`)

### 6.1 `apiService.ts`
Axios client configured with `baseURL = VITE_API_BASE_URL`:
- **Request Interceptor**: Extracts access token from `localStorage['accessToken']` or parsed `localStorage['userAuth']`, appending `Authorization: Bearer <token>`.
- **Response Interceptor**: Intercepts HTTP 401 errors, clears localStorage tokens, and redirects immediately to `/login`.
- **CRUD Exports**: `apiService = { get, post, put, patch, delete }`.

### 6.2 `endpoints/index.ts` (Central URL Catalog)
Single source of truth for all backend endpoints. Never hardcode API URL paths in components:
- `login`: `"/auth/login"`
- `myProfile`: `"/users/me"`
- `users`: `"/users"`
- `health`: `"/health"`
- `uploads`: `"/uploads"`
- `transactions`: `"/transactions"`
- `financialProfile`: `"/financial/profile"`
- `financialRecalculate`: `"/financial/recalculate"`
- `financialTrends`: `"/financial/trends"`
- `financialCategories`: `"/financial/categories"`
- `chatAsk`: `"/chat/ask"`
- `chatHistory`: `"/chat/history"`
- `loanAssess`: `"/loan-assessment/assess"`
- `loanAssessmentHistory`: `"/loan-assessment/history"`

---

## 7. REUSABLE UI COMPONENT LIBRARY (`src/shared/components/`)

The design system uses modern Tailwind styling with HSL theme variables. All components are responsive and accessible:

| Component | File Path | Props & Description |
|---|---|---|
| `Button` | `Button.tsx` | `{ variant='primary'\|'secondary'\|'danger'\|'outline', size, loading, icon: Icon, disabled, onClick, children }` |
| `DataTable` | `DataTable.tsx` | `{ columns, data, loading, onRowClick, emptyMessage }` — Presentational data table with hover states and loading skeleton |
| `TablePagination` | `TablePagination.tsx` | `{ currentPage, totalPages, onPageChange, pageSize, totalItems }` — Page selector and jump controls |
| `InputField` | `InputField.tsx` | `{ label, name, type, value, onChange, error, icon: Icon, placeholder, disabled, required }` |
| `SelectField` | `SelectField.tsx` | `{ label, name, options, value, onChange, error, placeholder, disabled }` |
| `CustomDatePicker` | `CustomDatePicker.tsx` | `{ label, value, onChange, error, minDate, maxDate }` — Styled date picker |
| `CustomTimePicker` | `CustomTimePicker.tsx` | `{ label, value, onChange, error }` — Time selection input |
| `CustomTextArea` | `CustomTextArea.tsx` | `{ label, name, value, onChange, rows=3, error, placeholder }` |
| `CustomCheckbox` | `CustomCheckbox.tsx` | `{ label, checked, onChange, name, disabled }` |
| `CustomRadioField` | `CustomRadioField.tsx` | `{ label, options, value, onChange, error }` |
| `CustomFileUpload` | `CustomFileUpload.tsx` | `{ onFileUpload, acceptedTypes, maxSizeMB, label }` — Drag-and-drop zone with preview |
| `FileUploadField` | `FileUploadField.tsx` | Full-featured document uploader with progress indicator and type validation |
| `StatusBadge` | `StatusBadge.tsx` | `{ status: 'APPROVED'\|'REJECTED'\|'PENDING'\|'IN_PROGRESS', size }` — Color-coded status badge |
| `DocumentStatusBadge` | `DocumentStatusBadge.tsx` | Specialized badge for KYC document verification status |
| `StatCard` | `StatCard.tsx` | `{ title, value, change, changeType: 'increase'\|'decrease', icon: Icon, description }` |
| `Card` | `Card.tsx` | `{ title, children, actions, className }` — Container card with border and shadow tokens |
| `Modal` | `Modal.tsx` | `{ isOpen, title, onClose, children, footer, size='md'\|'lg'\|'xl' }` — Focus-trapped accessible dialog |
| `Sidebar` | `Sidebar.tsx` | Multi-role responsive navigation sidebar with collapse toggle |
| `Navbar` | `Navbar.tsx` | Top application bar: user profile dropdown, tenant badge, theme switcher, notification bell |
| `NotificationBell` | `NotificationBell.tsx` | Real-time unread alert indicator powered by WebSocket events |
| `NotificationModal`| `NotificationModal.tsx`| Dropdown modal displaying recent notifications and mark-as-read actions |
| `FilterBar` | `FilterBar.tsx` | Horizontal filter ribbon with search input, dropdowns, and date range triggers |
| `SkeletonLoader` | `SkeletonLoader.tsx` | `{ variant='table'\|'card'\|'text', count }` — Animated placeholder loader |
| `AlertBox` | `AlertBox.tsx` | `{ type: 'success'\|'error'\|'warning'\|'info', title, message, onClose }` |
| `EmptyState` | `EmptyState.tsx` | `{ title, description, icon: Icon, actionLabel, onAction }` |
| `ErrorState` | `ErrorState.tsx` | `{ message, onRetry }` — Inline error container with retry action |
| `Tooltip` | `Tooltip.tsx` | `{ content, children, side='top'\|'bottom'\|'left'\|'right' }` |

---

## 8. ROUTE CATALOG (`src/app/router.tsx`)

Every application route is lazy-loaded and guarded with RBAC rules:

| Route Path | Component / Page | Access Control / Role Whitelist |
|---|---|---|
| `/` | `Navigate to /dashboard` | Public redirect |
| `/login` | `features/auth/pages/LoginPage` | Public |
| `/register` | `features/auth/pages/RegisterPage` | Public |
| `/forgot-password` | `pages/auth/ForgotPasswordPage` | Public |
| `/reset-password` | `pages/auth/ResetPasswordPage` | Public |
| `/:slug/login` | `features/auth/pages/SlugLoginPage` | Public (Multi-tenant company login) |
| `/:slug/customer/login` | `features/auth/pages/SlugCustomerLoginPage` | Public (Borrower customer portal) |
| `/:slug/apply` | `features/loans/pages/CustomerApplyPage` | Public (Customer instant loan application) |
| `/supercontroller/login` | `features/supercontroller/pages/SupercontrollerLoginPage` | Public |
| `/dashboard` | `app/DashboardIndex` | `user`, `admin`, `reviewer`, `superadmin` |
| `/dashboard/admin` | `features/dashboard/pages/AdminDashboardPage` | `admin`, `superadmin` |
| `/dashboard/users` | `features/users/pages/UsersPage` | `admin`, `superadmin` |
| `/dashboard/kyc` | `features/kyc/pages/KYCListPage` | `superadmin`, `admin`, `reviewer` |
| `/dashboard/kyc-submit` | `features/kyc/pages/UserKYCPage` | `user`, `admin`, `superadmin` |
| `/dashboard/kyc-status` | `features/kyc/pages/KYCStatusPage` | `user`, `admin`, `superadmin` |
| `/dashboard/reports` | `features/dashboard/pages/ReportsPage` | `admin`, `superadmin` |
| `/dashboard/loans` | `features/loans/pages/LoanOfficerDashboardPage` | `admin`, `reviewer`, `superadmin` |
| `/dashboard/loans/apply` | `features/loans/pages/LoanApplicationPage` | `user`, `admin`, `superadmin` |
| `/dashboard/loans/status` | `features/loans/pages/LoanStatusPage` | `user`, `admin`, `superadmin` |
| `/dashboard/lenders` | `features/loans/pages/LendersPage` | `user`, `superadmin` |
| `/dashboard/profile` | `features/profile/pages/ProfilePage` | `user`, `admin`, `reviewer`, `superadmin` |
| `/dashboard/portfolio` | `features/loans/pages/PortfolioPage` | `user`, `admin`, `reviewer`, `superadmin` |
| `/dashboard/portfolio/admin` | `features/loans/pages/admin/PortfolioAdminListPage` | `admin`, `reviewer`, `superadmin` |
| `/dashboard/portfolio/admin/:userId` | `features/loans/pages/admin/PortfolioAdminDetailPage` | `admin`, `reviewer`, `superadmin` |
| `/dashboard/chat` | `pages/chat/ChatPage` | `user`, `admin`, `reviewer`, `superadmin` |
| `/dashboard/finguard` | `features/finguard/pages/FinguardDashboardPage` | `user`, `admin`, `superadmin` |
| `/company` | `features/company/pages/CompanyOnboardingPage` | Authenticated |
| `/admin/company-requests` | `features/company/pages/AdminCompanyRequestsPage` | `superadmin` |
| `/supercontroller` | `features/supercontroller/pages/SupercontrollerDashboardPage` | `superadmin` |

---

## 9. REDUX STORE SLICES (`src/store/slices/`)

### 9.1 `authSlice.ts`
- **State**: `user`, `userData`, `accessToken`, `refreshToken`, `isAuthenticated`, `isLoading`, `error`, `clientDetails`.
- **Hydration**: Automatically rehydrates from `localStorage['user']` and `localStorage['accessToken']` on app boot.
- **Actions**: `setCredentials({ user, accessToken, refreshToken })`, `setUserData(user)`, `logout()`, `setClientDetails(details)`.
- **Selectors**: `selectCurrentUser`, `selectUserData`, `selectAccessToken`, `selectIsAuthenticated`, `selectUserRole`.

### 9.2 `tenantSlice.ts`
- **State**: `activeTenantId`, `tenantSlug`, `tenantName`, `features`, `isMultiTenant`.
- **Actions**: `setActiveTenant(tenant)`, `clearTenant()`, `setTenantFeatures(features)`.
- **Selectors**: `selectActiveTenant`, `selectTenantSlug`, `selectTenantFeatures`.

### 9.3 `uiSlice.ts`
- **State**: `isSidebarOpen`, `theme ('light'|'dark')`, `darkMode`, `themeColor`, `notifications`, `modalContent`, `modalProps`.
- **Hydration**: Rehydrates theme and dark mode from `localStorage['selectedTheme']` and `localStorage['darkMode']`.
- **Actions**: `toggleSidebar()`, `setThemeColor(color)`, `toggleDarkMode()`, `openModal({ component, props })`, `closeModal()`, `addNotification(notif)`, `removeNotification(id)`.

### 9.4 `accountSlice.ts`
- **State**: `selectedAccount`, `budgetFilters`, `currentPage`, `pageSize`.
- **Actions**: `setSelectedAccount(account)`, `setBudgetFilters(filters)`, `resetAccountState()`.

---

## 10. FEATURE MODULE ARCHITECTURE (`src/features/`)

Each domain feature is encapsulated in `src/features/<feature_name>` with its own pages, sub-components, and hooks:

1. **`auth/`**:
   - `LoginPage.tsx`: Standard portal login with email/password, connects to `authService.login`.
   - `RegisterPage.tsx`: User registration wizard with password strength indicator.
   - `SlugLoginPage.tsx` & `SlugCustomerLoginPage.tsx`: Multi-tenant scoped authentication.
2. **`kyc/`**:
   - `UserKYCPage.tsx`: Multi-step document upload wizard (citizenship front, back, selfie webcam capture).
   - `KYCStatusPage.tsx`: Live verification progress indicator displaying DeepFace match results.
   - `KYCListPage.tsx`: Compliance officer inspection table with document preview and approve/reject actions.
3. **`loans/`**:
   - `LoanApplicationPage.tsx`: Loan origination with dynamic EMI calculator, tenure slider, and purpose selector.
   - `LoanOfficerDashboardPage.tsx`: Underwriting assessment queue with debt-to-income analysis and credit scoring.
   - `PortfolioPage.tsx`: Borrower view of active loans, repayment schedules, and outstanding balances.
   - `admin/PortfolioAdminListPage.tsx` & `PortfolioAdminDetailPage.tsx`: Compliance audit of borrower bureau histories.
4. **`finguard/`**:
   - `FinguardDashboardPage.tsx`: Bank statement file ingestion, automated income vs expense trend charts (Highcharts), category breakdowns, and AI credit health recommendations.
5. **`supercontroller/`**:
   - `SupercontrollerDashboardPage.tsx`: Multi-tenant governance dashboard, global tenant provisioning, and system feature toggle toggles.
6. **`company/`**:
   - `CompanyOnboardingPage.tsx`: Company registration workflow for new lending institutions.
   - `AdminCompanyRequestsPage.tsx`: Superadmin decisioning queue for pending company onboarding requests.
7. **`users/`**:
   - `UsersPage.tsx`: Administrative user table with role modification dialogs and status toggles.

---

## 11. SEARCH STRATEGY (Ripgrep Precision)

Quickly locate frontend logic, components, routes, and hooks with these targeted ripgrep commands:

```bash
# 1. Search page definition in features
rg "export default function LoanApplicationPage" src/features/

# 2. Search Redux action dispatches or selectors
rg "useAppSelector\(selectCurrentUser\)" src/
rg "dispatch\(setCredentials\(" src/

# 3. Search TanStack React Query hooks
rg "useApiQuery\(" src/
rg "useApiMutation\(" src/

# 4. Search API route usage
rg "endpoints\." src/services/

# 5. Search route definitions in React Router
rg "path: \"loans" src/app/router.tsx

# 6. Locate shared UI components
rg "export const Button" src/shared/components/
rg "export const Modal" src/shared/components/

# 7. Search role guard checks
rg "<RoleProtectedRoute requiredRoles=" src/app/router.tsx
```

---

## 12. SHIPPING CHECKLIST

Before deploying or committing changes to `frontend`, verify the following:

- [ ] **Role Protection**: All new routes registered in `src/app/router.tsx` are wrapped with `<ProtectedRoute>` and `<RoleProtectedRoute>` with appropriate role whitelists.
- [ ] **Server State Hygiene**: Server data is fetched and cached exclusively via `useApiQuery` / `useApiMutation`, never stored in Redux slices.
- [ ] **Cache Invalidation**: Mutations define `invalidateKeys` to refresh affected TanStack Query caches upon success.
- [ ] **No Hardcoded Endpoints**: All API URLs reference `endpoints.*` from `src/services/endpoints/index.ts`.
- [ ] **Theme & Responsive Design**: UI uses Tailwind theme utility classes and verifies responsiveness on mobile and desktop viewports.
- [ ] **Type & Lint Check**: `npm run lint` and TypeScript check execute without errors.
