#FRONTEND
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



#BACKEND
# README.md — FinGuard Backend Node (Canonical Architecture & Engineering Guide)

> Source of truth for autonomous coding agents and senior engineers working in `backend-node`.
> Extracted directly from the actual codebase. Read once per session before touching code.
> **Philosophy:** Search → Map → Read → Reuse → Extend → Modify. Never duplicate logic. Ship right once.

---

## 1. TECH STACK (Confirmed from Codebase & Dependencies)

- **Runtime**: Node.js `>= 22.0.0`
- **HTTP Framework**: Express.js `5.2.1` (`express`)
- **Language / Transpiler**: TypeScript `6.0.3` (`typescript`, `tsc`, `tsc-alias`, `ts-node`, `tsx 4.22.3`)
- **Database ORM**: Prisma `7.8.0` (`@prisma/client`, `@prisma/adapter-pg`, `prisma`)
- **Database Engine**: PostgreSQL 16 (Multi-schema: `auth`, `public`)
- **Caching Layer**: Redis `6.0.0` (`ioredis`) + `InMemoryFallback` (LRU eviction, 10,000 entry cap, active 30s TTL background sweep)
- **Real-Time WebSockets**: Socket.io `^4.8.1` (`socket.io`) with socket-level token & presence caching (`socketCache`)
- **Authentication & Security**: JWT (`jsonwebtoken 9.0.3`), bcryptjs `3.0.3`, Helmet `8.1.0`, CORS `2.8.6`, Passport `0.7.0` (`passport-oauth2`)
- **Request Validation & Config**: Zod `4.4.3` (`zod`), dotenv `17.4.2`
- **File Ingestion & Parsing**: Multer `2.1.1`, pdf-parse `1.1.1`, SheetJS `xlsx 0.18.5`, form-data `4.0.5`
- **Logging & Telemetry**: Pino `10.3.1`, Pino-HTTP `11.0.0`, Morgan `1.10.1`, Winston `3.19.0`
- **Mail Delivery**: Nodemailer `8.0.7`
- **API Documentation**: Swagger UI Express `5.0.1`, Swagger-JSDoc `6.2.8`
- **Testing Engine**: Jest `30.4.2`, ts-jest `29.4.10`, Supertest `7.2.2`, pg-mem `3.0.14`

**Environment Variables (`backend-node/.env` validated via `src/config/env.ts`):**
- `PORT` (default: 4000)
- `NODE_ENV` (`development` | `production` | `test`)
- `DATABASE_URL` (PostgreSQL connection string with `?schema=auth`)
- `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET` (minimum 32-character HMAC secrets)
- `JWT_ACCESS_TTL` (default: `2h`), `JWT_REFRESH_TTL` (default: `7d`)
- `CORS_ORIGIN` (comma-separated allowed origins, default: `http://localhost:5173`)
- `REDIS_HOST`, `REDIS_PORT`, `REDIS_PASSWORD` (Redis connection parameters; falls back to in-memory cache if absent)
- `FASTAPI_URL` (default: `http://localhost:8000`, microservice endpoint for OCR and CV)
- `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS` (email delivery configuration)
- `AUDIT_LOG_RETENTION_DAYS` (default: 180)

---

## 2. BOOT SEQUENCE (`src/server.ts`) — Non-Negotiable Lifecycle

```
[1] Environment Validation (src/config/env.ts)
    └─ Zod schema validates all required strings, ports, and secret keys at process start.

[2] HTTP Server & Socket.io Initialization (src/server.ts, src/config/socket.ts)
    └─ http.createServer(app) instantiated.
    └─ new Server(httpServer, { cors }) bound and stored via setIO(io).

[3] Socket Handshake Authentication Guard (io.use in src/server.ts)
    └─ Checks token in handshake.auth.token or Authorization header.
    └─ Fast-Path: socketCache.getCachedTokenPayload(token) (120s TTL) avoids repeated JWT crypto CPU.
    └─ Miss-Path: jwt.verify(token, env.JWT_ACCESS_SECRET), caches user payload in socketCache.

[4] Socket Connection Registry (io.on('connection'))
    └─ Registers user presence: socketCache.registerConnection(userId, socket.id, meta).
    └─ Joins user private room: socket.join(`user:${user.id}`).
    └─ Dispatches cached unread notification counts: socketCache.getCachedUnreadCount(userId).
    └─ Binds chat room handlers (chat:join, chat:message) with rate limiting (max 60 msgs/min).
    └─ On disconnect: socketCache.unregisterConnection(userId, socket.id).

[5] Database Connection Probe
    └─ Executes prisma.$queryRaw`SELECT 1` against PostgreSQL. Exits on fatal failure.

[6] Startup Hygiene & Retention Jobs (Non-blocking / Best-effort)
    └─ resetStaleOcrJobs() (src/jobs/ocrProcessingJob.ts): Recovers jobs stuck in 'PROCESSING' across restarts.
    └─ auditService.trimOldLogs(retentionDays): Prunes audit logs older than retention policy.

[7] Port Listener
    └─ server.listen(PORT, 4000) with 120s HTTP keepAliveTimeout and headersTimeout.
```

---

## 3. STATE & DATA HIERARCHY (Non-Negotiable Architecture)

```
Primary Persistent Store → PostgreSQL 16 via Prisma ORM (@prisma/client)
                          Schemas: auth (users, loans, kyc, transactions, sessions)
                                   public (tenants, feature_toggles, tenant_metrics)
                          EVERY query touching tenant data MUST include { where: { tenantId } }.

Caching & Performance   → RedisConnection + CacheManager (src/services/cache/)
                          1. Stampede Protection: cacheManager.getOrSet() coalesces concurrent
                             cache-miss promises into a single in-flight DB call.
                          2. L1 Fallback: InMemoryFallback maintains 10,000 max entries with genuine
                             LRU eviction and unreferenced 30s background TTL sweep.
                          3. Socket Cache: socketCache maintains user presence, room histories,
                             verified JWT tokens, and unread notification counts.

Mutation Rule           → Any database create/update/delete MUST immediately invalidate
                          corresponding cache patterns (cacheManager.delete, socketCache.invalidateUnreadCount).
```

---

## 4. REPOSITORY LAYOUT (Actual Tree from Codebase)

```
backend-node/
├── prisma/
│   └── schema.prisma             # Canonical database schema definitions & relations (1,206 lines)
├── src/
│   ├── app.ts                    # Express app configuration, CORS, Helmet, Swagger, routes (64 lines)
│   ├── server.ts                 # Server entry point, Socket.io, connection lifecycle (221 lines)
│   ├── config/                   # Core application configuration
│   │   ├── env.ts                # Zod environment variable parsing
│   │   ├── database.ts           # PrismaClient instance with PostgreSQL connection
│   │   ├── logger.ts             # Pino structured JSON logger
│   │   └── socket.ts             # Global io instance getter and setter
│   ├── controllers/              # HTTP Request handlers (18 controllers)
│   │   ├── authController.ts     # User signup, login, refresh, password reset
│   │   ├── userController.ts     # User directory, profile updates, deletion
│   │   ├── kycController.ts      # KYC document uploads, status, approvals
│   │   ├── loanController.ts     # Loan application intake, reviewer decisioning
│   │   ├── loanAssessmentController.ts # Underwriting calculation & ML prediction proxy
│   │   ├── financialController.ts # Financial profiles, monthly trends, cashflow
│   │   ├── uploadController.ts   # Bank statement upload & file parsing triggers
│   │   ├── transactionController.ts # Transaction categorization & summaries
│   │   ├── chatbotController.ts  # NLU queries, conversation listings, messaging
│   │   ├── notificationController.ts # In-app notification mark-as-read & unread counts
│   │   ├── adminController.ts    # Dashboard KPI stats, audit trails
│   │   ├── portfolioController.ts # Customer loan portfolio and accounts
│   │   └── portfolioAdminController.ts # Bureau verification checklists
│   ├── jobs/                     # Asynchronous background job processors
│   │   └── ocrProcessingJob.ts   # Document text extraction queue & crash recovery (370 lines)
│   ├── middleware/               # Request pipelines and guards (15 middleware files)
│   │   ├── auth.ts               # Bearer JWT verification (requireAuth)
│   │   ├── rbac.ts               # Role-based access control (requireRole, requireAnyRole)
│   │   ├── tenantContext.ts      # Multi-tenant context extraction (tenantId, slug)
│   │   ├── slugAuth.ts           # Slug-scoped authentication (slugAuthMiddleware, slugCompanyGuard)
│   │   ├── requestValidation.ts  # Zod body/query/param schema validator (validateRequest)
│   │   ├── upload.ts             # Multer storage configuration for KYC files
│   │   ├── statementUpload.ts    # Multer configuration for statement spreadsheets/PDFs
│   │   ├── requireSupercontroller.ts # Supercontroller platform privileges guard
│   │   └── errorHandler.ts       # Global Express error and Prisma exception mapper
│   ├── routes/                   # Route aggregators and Zod schemas (28 files)
│   │   ├── index.ts              # /api/v1 router aggregation
│   │   ├── slugCompatRoutes.ts   # Multi-tenant root compat routes (/:slug/*, /login) (632 lines)
│   │   ├── authRoutes.ts         # /api/v1/auth endpoints
│   │   ├── kycRoutes.ts          # /api/v1/kyc endpoints
│   │   ├── loanRoutes.ts         # /api/v1/loan endpoints
│   │   ├── loanAssessmentRoutes.ts # /api/v1/loan-assessment endpoints
│   │   ├── financialRoutes.ts    # /api/v1/financial endpoints
│   │   ├── chatbotRoutes.ts      # /api/v1/chat endpoints
│   │   ├── notificationRoutes.ts # /api/v1/notifications endpoints
│   │   └── supercontrollerRoutes.ts # /api/v1/supercontroller endpoints
│   ├── services/                 # Business logic layer (28 files)
│   │   ├── authService.ts        # Credential checks, registration, token generation
│   │   ├── tokenService.ts       # JWT signing, claims encoding, multi-tenant compat tokens
│   │   ├── kycService.ts         # KYC submission, status updates, reviewer workflows
│   │   ├── loanService.ts        # Loan origination, underwriting review, accounts
│   │   ├── loanAssessmentService.ts # Financial scoring, EMI calculation, ML feature mapping
│   │   ├── statementParserService.ts # Bank statement CSV/XLSX parsing & profile recalculation
│   │   ├── financialProfileService.ts # Cached savings rate, income/expense aggregations
│   │   ├── chatbotService.ts     # Conversational intent parsing & message dispatch
│   │   ├── notificationService.ts # Real-time notification creation & socket emission
│   │   ├── auditService.ts       # Audit logging & database pruning
│   │   ├── ocrService.ts         # HTTP bridge to FastAPI ML service
│   │   ├── finguardProxyService.ts # HTTP bridge for ML default risk inference
│   │   ├── cache/                # High-performance caching infrastructure
│   │   │   ├── redisClient.ts    # ioredis client with LRU InMemoryFallback (214 lines)
│   │   │   ├── cacheManager.ts   # Single-flight stampede-protected cache (166 lines)
│   │   │   └── socketCache.ts    # Real-time socket token, presence, and chat history cache (226 lines)
│   │   ├── ml/creditScoringService.ts # ML credit risk proxy and local caching
│   │   ├── rbac/permissionResolver.ts # Role definitions & permission matrix
│   │   ├── supercontroller/      # Supercontroller & tenant monitoring services
│   │   └── tenant/tenantService.ts # Multi-tenant company provisioning
│   └── utils/                    # Shared engineering utilities
│       ├── AppError.ts           # Operational HTTP error class
│       ├── roles.ts              # Canonical role normalization (normalizeRoleName, normalizePan)
│       ├── apiResponse.ts        # Standardized JSON response envelope
│       └── pagination.ts         # Page and limit parsing
└── tests/                        # Comprehensive test suites
    ├── compat-multitenant.test.ts # Multi-tenant tokens, role mappings, notification safety
    └── cache-socket.test.ts      # LRU eviction, stampede protection, socket presence (13 tests)
```

---

## 5. MIDDLEWARE INVENTORY (`src/middleware/`)

| Middleware | File Path | Guard Target | Behavior & Signatures |
|---|---|---|---|
| `tenantContext` | `src/middleware/tenantContext.ts` | All `/api/v1/*` | Extracts `x-tenant-id`, subdomain, or slug; defaults to tenant `1`; attaches `req.tenantId` and `req.tenantSlug`. |
| `requireAuth` | `src/middleware/auth.ts` | Authenticated routes | Validates Bearer JWT via `tokenService.verifyAccessToken()`. Injects `req.user = { id, email, role, tenantId }`. Rejects with 401 on failure. |
| `requireRole` / `requireAnyRole` | `src/middleware/rbac.ts` | Role-gated routes | Normalizes role via `normalizeRoleName()`; validates against `ADMIN`, `USER`, `REVIEWER`, `SUPERADMIN`. Rejects with 403 on forbidden access. |
| `validateRequest` | `src/middleware/requestValidation.ts` | Request bodies / params | `validateRequest(zodSchema, 'body'\|'query'\|'params')`. Validates payload; formats 400 Bad Request with field-level error arrays. |
| `slugAuthMiddleware` | `src/middleware/slugAuth.ts` | Multi-tenant `/:slug/*` | Validates multi-tenant compat tokens, decodes company_id and customer_id, attaches `req.slugUser`. |
| `slugCompanyGuard` | `src/middleware/slugAuth.ts` | Multi-tenant `/:slug/*` | Ensures the authenticated token's company matches the requested URL slug parameter. |
| `requireSupercontroller` | `src/middleware/requireSupercontroller.ts` | `/api/v1/supercontroller/*` | Ensures requesting identity possesses valid platform supercontroller privileges. |
| `statementUpload` | `src/middleware/statementUpload.ts` | Statement upload routes | Multer instance handling `.pdf`, `.csv`, `.xlsx`, `.xls` up to 25MB; writes to `uploads/statements/`. |
| `upload` | `src/middleware/upload.ts` | KYC upload routes | Multer instance handling identity documents and selfies; writes to `uploads/kyc/`. |
| `errorHandler` | `src/middleware/errorHandler.ts` | Global Express error handler | Formats `AppError` and Prisma errors into consistent `{ success: false, message, code }` payloads. |

---

## 6. SERVICES LAYER INVENTORY (`src/services/`)

### `authService.ts`
- `register(input: RegisterInput): Promise<TokenResponse>`: Creates user account, hashes password via bcryptjs (12 rounds), assigns default USER role, creates profile.
- `login(input: LoginInput): Promise<TokenResponse>`: Verifies credentials, normalizes roles, issues access + refresh token, records session in `auth.sessions`.
- `refreshToken(refreshToken: string): Promise<TokenResponse>`: Validates refresh token, checks database session, rotates tokens.
- `logout(userId: string): Promise<void>`: Deletes active user sessions from `auth.sessions`.

### `tokenService.ts`
- `generateAccessToken(payload): string`: Signs HS256 JWT with `env.JWT_ACCESS_SECRET` (`expiresIn: '2h'`).
- `generateRefreshToken(payload): string`: Signs HS256 JWT with `env.JWT_REFRESH_SECRET` (`expiresIn: '7d'`).
- `generateCompatToken(claims): string`: Signs multi-tenant token including `sub`, `email`, `role`, `company_id`, `customer_id`, `iss: 'finguard'`, `aud: 'finguard-app'`.
- `verifyCompatToken(token): CompatTokenPayload | null`: Decodes and verifies token; supports backward compatibility for legacy non-audience tokens.

### `kycService.ts`
- `submitKyc(input, tenantId?): Promise<KycApplicationDetail>`: Creates `auth.kyc_applications`, initiates FastAPI verification (`ocrService.verifyKycWithFastApi`), creates OCR and face records, dispatches reviewer notification.
- `getKycStatus(userId, tenantId?): Promise<KycApplicationDetail | null>`: Fetches latest KYC status for user.
- `approveKyc(kycId, reviewerId, tenantId?): Promise<KycApplicationDetail>`: Transitions status to `VERIFIED`, updates user verification flag, notifies user.
- `rejectKyc(kycId, reviewerId, reason, tenantId?): Promise<KycApplicationDetail>`: Transitions status to `REJECTED`, records reason, notifies user.

### `statementParserService.ts`
- `parseStatementFile(filePath, userId, tenantId?): Promise<string>`: Ingests CSV/XLSX, extracts transactions, categorizes lines (`INCOME`, `EXPENSE`, `EMI`), creates `auth.transactions`.
- `recalculateFinancialProfile(userId): Promise<void>`: Aggregates total transactions, computes average monthly income/expenses, savings rate, stability score; upserts `auth.financial_profiles`; invalidates cache keys `financial_profile:${userId}*`.

### `financialProfileService.ts`
- `getProfile(userId, tenantId?): Promise<FinancialProfile>`: Fetches profile wrapped in `cacheManager.getOrSet('fin_profile:${userId}:${tid}', ..., 300)`.
- `getMonthlyTrends(userId, tenantId?): Promise<Array<{ month, income, expense }>>`: Aggregates monthly transactions wrapped in `cacheManager.getOrSet('fin_trends:${userId}:${tid}', ..., 300)`.
- `recalculate(userId, tenantId?): Promise<FinancialProfile>`: Invalidates cache patterns `fin_*:${userId}:*` and recalculates profile via `statementParserService`.

### `loanService.ts`
- `applyForLoan(userId, data, tenantId?): Promise<LoanApplication>`: Validates applicant KYC, creates `auth.loan_applications` in `SUBMITTED` state, notifies officers.
- `reviewLoan(loanId, reviewerId, decision, notes?, tenantId?): Promise<LoanApplication>`: Transitions application to `APPROVED` or `REJECTED`. If approved, dispatches `loanAccountService.createAccount()`, sends email via `mailService`, emits Socket.io update.

### `loanAssessmentService.ts`
- `assess(userId, requestedAmount, tenureMonths?, interestRate?): Promise<LoanAssessmentResult>`: Rule-based underwriting calculator (stability score, savings score, DTI ratio, affordability multiplier, max EMI).
- `assessWithFinguard(userId, requestedAmount, tenureMonths?, interestRate?): Promise<FinguardAssessmentResult>`: Assembles 20+ feature attributes (`buildFinguardFeatures`) and calls FastAPI `/api/v1/finguard/predict`. Persists result in `auth.loan_assessments`.

### `cacheManager.ts` (Stampede-Protected Cache)
- `getOrSet<T>(key, fallback, ttlSeconds=3600): Promise<T>`: Single-flight mutex pattern. If 50 parallel requests miss the cache, only 1 DB query runs; all 50 resolve the same promise.
- `getJson<T>(key): Promise<T | null>`, `setJson<T>(key, value, ttl?): Promise<void>`: Safe typed JSON caching.
- `incr(key, ttl?): Promise<number>`: Atomic counter increment with expiration.
- `delete(key): Promise<void>`, `invalidatePattern(pattern): Promise<void>`: Wildcard pattern key invalidation.

### `socketCache.ts` (Real-Time Socket Caching)
- `getCachedTokenPayload(rawToken): Promise<SocketUserPayload | null>`: SHA-256 hashed token cache (120s TTL) eliminating crypto JWT verification on reconnect storms.
- `registerConnection(userId, socketId, meta?): Promise<void>`: Registers socket ID in user presence cache (`socket:presence:${userId}`).
- `unregisterConnection(userId, socketId): Promise<{ remainingSockets }>`: Deregisters socket; marks offline when 0 sockets remain.
- `getRecentMessages(conversationId): Promise<CachedConversationMessage[] | null>`: Retrieves cached chat history (last 50 messages).
- `appendMessage(conversationId, message, maxHistory=50): Promise<void>`: Appends message to cached history without DB re-queries.
- `checkRateLimit(identifier, action?, limit=60, windowSeconds=60): Promise<{ allowed, remaining }>`: Sliding window atomic rate limiter.
- `getCachedUnreadCount(userId): Promise<number | null>`, `setCachedUnreadCount(userId, count, ttl=300): Promise<void>`, `invalidateUnreadCount(userId): Promise<void>`.

### `notificationService.ts`
- `create(input: CreateNotificationInput): Promise<void>`: Fire-and-forget in-app notification insertion; invalidates `socketCache` unread count; emits realtime Socket.io event `notification:new` and `notification:unread_count` to `user:<userId>`.
- `getUnreadCount(userId, tenantId?): Promise<number>`: Reads cached unread count via `socketCache.getCachedUnreadCount()`; falls back to `prisma.notification.count` and warms cache.
- `markAsRead(notificationId, tenantId?): Promise<Notification>`: Updates status to `READ`, invalidates cached unread count.

### `chatbotService.ts`
- `processQuery(userId, message, sessionId): Promise<QueryResult>`: Classifies financial intents (`LOAN_ELIGIBILITY`, `INCOME_ANALYSIS`, `SPENDING_PATTERN`, `SAVINGS_ANALYSIS`), executes financial calculations, logs NLU query.
- `sendMessage(userId, conversationId, content): Promise<SendMessageResult>`: Persists message in `auth.chat_conversations`, updates context, returns updated message thread.

---

## 7. DATABASE & PRISMA SCHEMA (`prisma/schema.prisma`)

### Schema & Entity Mapping
- **Schema `auth`**:
  - `users`: Primary identity (`id`, `email`, `passwordHash`, `roleId`, `tenantId`, `isVerified`).
  - `roles`: Role definitions (`ADMIN`, `USER`, `REVIEWER`, `SUPERADMIN`).
  - `sessions`: Active refresh sessions (`token`, `expiresAt`, `userId`).
  - `tenants`: Multi-tenant companies (`id`, `slug`, `name`, `panNumber`, `joinMode`, `status`).
  - `tenant_admins`: Company admin bindings (`tenantId`, `userId`, `email`).
  - `company_requests`: Onboarding requests awaiting Supercontroller review.
  - `kyc_applications`: Identity verification entries (`userId`, `status`, `idType`, `documentNumber`).
  - `ocr_results`: Structured OCR extraction data linked 1:1 to KYC application.
  - `face_verifications`: DeepFace match score and distance linked 1:1 to KYC application.
  - `bank_statements`: Statement file records (`userId`, `bankName`, `accountNumber`).
  - `transactions`: Categorized transactions (`date`, `description`, `debit`, `credit`, `category`).
  - `financial_profiles`: Aggregated financial health metrics (`avgMonthlyIncome`, `savingsRate`, `dtiRatio`).
  - `loan_applications`: Borrower requests (`userId`, `amount`, `tenureMonths`, `purpose`, `status`).
  - `loan_assessments`: Underwriting results (`eligibilityScore`, `riskLevel`, `defaultProbability`).
  - `loan_accounts`: Disbursed loan repayment ledgers (`outstandingBalance`, `emiAmount`, `nextDueDate`).
  - `chat_conversations`: JSON message threads between customers and advisors.
  - `notifications`: User notifications (`type`, `title`, `message`, `status`, `priority`).
  - `audit_logs`: Regulatory audit trail (`userId`, `action`, `entityType`, `metadata`).
- **Schema `public`**:
  - `feature_toggles`: Tenant feature flags (`tenantId`, `featureName`, `isEnabled`).
  - `tenant_metrics`: Daily usage KPIs (`totalUsers`, `totalLoans`, `apiCalls`, `errorRate`).
  - `supercontroller_audit_logs`: Platform administrative action log.

---

## 8. DOMAIN & BUSINESS RULES

### 1. Multi-Tenant Role Normalization (`src/utils/roles.ts`)
- `company_admin` → canonical role `ADMIN`
- `reviewer`, `approver`, `Validator` → canonical role `REVIEWER`
- `customer` → canonical role `USER`
- `supercontroller` → canonical role `SUPERADMIN`

### 2. Loan Underwriting Formulas (`LoanEligibilityCalculator` in `chatbotService.ts`)
- **Income Stability Score**: $\ge 70 \rightarrow 30\text{ pts}$, $\ge 50 \rightarrow 25\text{ pts}$, $\ge 30 \rightarrow 15\text{ pts}$, else $5\text{ pts}$.
- **Savings Rate Score**: $\ge 30\% \rightarrow 25\text{ pts}$, $\ge 20\% \rightarrow 20\text{ pts}$, $\ge 10\% \rightarrow 15\text{ pts}$, $\ge 5\% \rightarrow 10\text{ pts}$.
- **Debt-To-Income (DTI) Score**: $\le 20\% \rightarrow 25\text{ pts}$, $\le 40\% \rightarrow 15\text{ pts}$, $\le 60\% \rightarrow 5\text{ pts}$, else $0\text{ pts}$.
- **Statement Duration Score**: $\ge 12\text{ months} \rightarrow 20\text{ pts}$, $\ge 6\text{ months} \rightarrow 10\text{ pts}$, else $0\text{ pts}$.
- **Monthly EMI Formula**:
  $$\text{EMI} = P \times \frac{r(1+r)^n}{(1+r)^n - 1}$$
  Where $P = \text{Requested Amount}$, $r = \frac{\text{Annual Rate}}{12 \times 100}$, $n = \text{Tenure Months}$.
- **Affordability Multiplier**:
  - $\frac{\text{EMI}}{\text{Monthly Income}} \le 30\% \rightarrow 1.0$ (Full eligibility)
  - $\frac{\text{EMI}}{\text{Monthly Income}} \le 40\% \rightarrow 0.7$
  - $\frac{\text{EMI}}{\text{Monthly Income}} > 40\% \rightarrow 0.3$

---

## 9. SEARCH STRATEGY (Ripgrep Optimization)

```bash
# 1. Search specific service function
rg "async recalculateFinancialProfile" src/services/
rg "async assessWithFinguard" src/services/

# 2. Search Express controller or route
rg "export const reviewLoan" src/controllers/
rg "router\.post\('/submit'" src/routes/

# 3. Search Prisma model and relations
rg "model LoanApplication" prisma/schema.prisma

# 4. Search caching and socket methods
rg "socketCache\.registerConnection" src/services/cache/
rg "cacheManager\.getOrSet" src/services/
```

---

## 10. SHIPPING CHECKLIST

- [ ] All database queries enforce `{ where: { tenantId } }` unless accessing global supercontroller tables.
- [ ] Mutating routes invalidate corresponding cache keys (`cacheManager.delete`, `socketCache.invalidateUnreadCount`).
- [ ] No raw SQL string interpolation; all queries executed through Prisma client methods.
- [ ] Socket emissions target specific rooms (`user:<userId>`, `conversation:<conversationId>`).
- [ ] Lint check passes: `npm run lint`.
- [ ] Test suites pass: `npm test`.



#FASTAPI

# README.md — FinGuard Backend FastAPI (ML & CV Microservice)

> Source of truth for autonomous coding agents and machine learning engineers working in `backend-fastapi`.
> Extracted directly from the actual codebase. Read once per session before touching code or model pipelines.
> **Philosophy:** Search → Map → Read → Reuse → Extend → Modify. Never duplicate logic. Ship right once.

---

## 1. TECH STACK (Confirmed from Codebase & Dependencies)

- **Runtime**: Python `3.10+` / `3.11`
- **Web Framework**: FastAPI `0.115.11` (`fastapi`)
- **ASGI Server**: Uvicorn `0.34.0` (`uvicorn[standard]`)
- **Asynchronous Database Driver**: PostgreSQL via `asyncpg 0.30.0` & SQLAlchemy 2.0 async (`sqlalchemy>=2.0.38`)
- **Computer Vision & Face Verification**: DeepFace `0.0.93`, OpenCV (`opencv-python-headless 4.11.0.86`), Pillow `11.1.0`
- **Facial Model**: Facenet / VGG-Face with Cosine Distance metrics
- **OCR Engines**:
  - Primary: EasyOCR `1.7.2` (Bilingual: English & Nepali/Hindi)
  - Secondary/Fallback: PaddleOCR `2.9.1` (`paddlepaddle>=2.6.0`, `paddleocr>=2.9.1`)
  - Utilities: PyTesseract `0.3.13`
- **Machine Learning & Scoring Pipeline**:
  - Engine: LightGBM `4.6.0`, XGBoost `2.1.4`, Scikit-learn `1.6.1`
  - Data Processing: Pandas `2.2.3`, NumPy `1.26.4` / `2.0.2`, SciPy `1.15.2`
  - Model Artifacts: `finguard_model_v1.3.0/finguard_artifacts/` (`model.pkl`, `model_manifest.json`, `preprocessing.json`, `feature-schema.json`)
- **Validation & Environment Settings**: Pydantic `2.10.6` & Pydantic-Settings `2.8.1` (`BaseSettings`)
- **PDF & Document Parsing**: PyPDF `5.3.1`, pdfplumber `0.11.5`, python-docx `1.1.2`, openpyxl `3.1.5`
- **Testing Engine**: pytest `8.3.5`, pytest-asyncio `0.25.3`, httpx `0.28.1`

**Environment Variables (`backend-fastapi/.env` validated via `app/config.py`):**
- `NODE_ENV` (default: `development`)
- `DATABASE_URL` (default: `postgresql+asyncpg://postgres:admin@localhost:5432/finguard`)
- `API_HOST` (default: `0.0.0.0`), `API_PORT` (default: `8000`), `DEBUG` (default: `False`)
- `UPLOAD_DIR` (default: `uploads/kyc`), `MAX_FILE_SIZE` (default: `10485760` — 10MB)
- `FACE_MODEL` (default: `VGG-Face`), `FACE_MATCH_THRESHOLD` (default: `0.4`)
- `OCR_CONFIDENCE_THRESHOLD` (default: `0.5`), `OCR_FIELD_MATCH_THRESHOLD` (default: `60`)
- `ML_MODEL_PATH` (default: `../finguard_artifacts/model.pkl`)
- `ML_MANIFEST_PATH` (default: `../finguard_artifacts/model_manifest.json`)
- `ML_PREPROCESSING_PATH` (default: `../finguard_artifacts/preprocessing.json`)
- `ML_SCHEMA_PATH` (default: `../finguard_artifacts/feature-schema.json`)
- `LOG_LEVEL` (default: `INFO`)
- `FINANCIAL_OCR_ENABLED` (default: `false` — toggles legacy text extraction)

---

## 2. BOOT SEQUENCE & LIFESPAN (`main.py`) — Non-Negotiable Lifecycle

```
[1] Platform & Thread Optimization Flags (Top of main.py)
    ├─ os.environ['PYTHONIOENCODING'] = 'utf-8'
    ├─ os.environ['TF_USE_LEGACY_KERAS'] = '1' (ensures Keras 2 compatibility for DeepFace)
    ├─ os.environ['FLAGS_use_mkldnn'] = '0' & TF_ENABLE_ONEDNN_OPTS = '0' (prevents thread panics)
    └─ If Windows: asyncio.set_event_loop_policy(asyncio.WindowsSelectorEventLoopPolicy())

[2] Lifespan Startup Hook (lifespan in main.py)
    ├─ await init_db(): Establishes connection pool to PostgreSQL via SQLAlchemy asyncpg.
    ├─ Predictor Discovery (app/services/finguard/predictor.py):
    │   └─ Scans candidate directories:
    │      1. settings.ML_MODEL_PATH
    │      2. backend-fastapi/../finguard_model_v1.3.0/finguard_artifacts/
    │      3. backend-fastapi/../finguard_artifacts/
    │      4. backend-fastapi/finguard_artifacts/
    │   └─ Validates presence of model.pkl, model_manifest.json, preprocessing.json.
    │   └─ Calls init_predictor(model_path, manifest_path, preproc_path, schema_path).
    │   └─ Executes predictor.warmup() with synthetic sample vector to preheat JIT/caches.
    └─ Face & OCR Service Initialization:
        └─ Face matching service configured for lazy evaluation on demand.
        └─ Active KYC flow isolates face verification from heavy text extraction.

[3] Router Mounting & Spec Aliases (create_app in main.py)
    ├─ Mounts api_router under prefix /api/v1 (kyc, financial_ocr, nlu, finguard).
    ├─ Mounts Root Spec Aliases: /finguard/* and /nlu/* at service root for legacy callers.
    ├─ Configures OpenAPI Documentation: /api/v1/docs, /api/v1/redoc, /api/v1/openapi.json.
    └─ Mounts Health Endpoints: /health (liveness) and /ready (model readiness probe).

[4] Shutdown Hook
    └─ Cleanly disposes database connection pools and frees thread resources.
```

---

## 3. DATA & INFERENCE ARCHITECTURE (Non-Negotiable)

```
Stateless Microservice Model:
  ├─ All OCR and Computer Vision endpoints accept file paths on disk or multi-part uploads.
  ├─ Path Resolution Helper: resolve_image_path() handles cross-service relative paths
  │  (e.g., searches uploads/kyc, backend-node/, ../backend-node/).
  └─ Caller Responsibility: The Node.js Express backend orchestrates file persistence,
     passes paths to FastAPI, and persists extracted metadata to its central Postgres database.

Concurrency & Async/Sync Separation:
  ├─ CPU-intensive tasks (EasyOCR, DeepFace facial inference, LightGBM tree evaluation)
  │  MUST execute in threadpools (asyncio.to_thread or standard def route endpoints)
  │  to avoid starving the Uvicorn asyncio event loop.
  └─ Database access for internal verification records uses SQLAlchemy AsyncSession.

Graceful Model Degradation:
  ├─ If DeepFace fails or model artifacts are absent, /ready marks degraded: true
  │  without crashing the service, allowing core DB and health checks to stay alive.
  └─ OCR pipeline supports PaddleOCR -> EasyOCR fallback cascade.
```

---

## 4. REPOSITORY LAYOUT (Actual Tree from Codebase)

```
backend-fastapi/
├── main.py                       # App factory, lifespan, model pre-warming, health probes
├── requirements.txt              # Pinned Python package dependencies
├── Dockerfile                    # Containerization manifest with system OpenCV libraries
├── app/
│   ├── config.py                 # Pydantic Settings & environment variable configuration
│   ├── api/
│   │   └── v1/
│   │       └── __init__.py       # Aggregates kyc, financial_ocr, nlu, and finguard routers
│   ├── db/                       # SQLAlchemy 2.0 async engine and session factory
│   │   ├── __init__.py           # init_db(), get_async_session(), Base metadata
│   │   └── session.py            # AsyncSessionLocal provider
│   ├── models/                   # SQLAlchemy ORM database models
│   │   ├── __init__.py           # Exports User, KYCApplication, Document, OCRResult, FaceVerification
│   │   ├── user.py               # User model definition
│   │   ├── kyc.py                # KYCApplication and Document models
│   │   └── verification.py       # OCRResult and FaceVerification models
│   ├── routes/                   # HTTP Controller modules
│   │   ├── __init__.py
│   │   ├── kyc.py                # Document upload, face verification, OCR citizenship, status
│   │   ├── financial_ocr.py      # Salary slip & bank statement extraction (/financial/*)
│   │   ├── finguard.py           # Credit scoring inference, batch, explain, schema (/finguard/*)
│   │   └── nlu.py                # Natural language intent parsing & financial Q&A (/nlu/*)
│   ├── extraction/               # Native document extractors (PDF, docx, xlsx table parsers)
│   │   ├── pdf_extractor.py      # Native PDF text and transaction table extraction
│   │   └── table_extractor.py    # Structured table heuristics and regex column mapping
│   └── services/                 # Core domain services and ML pipelines
│       ├── identity_service.py   # DeepFace facial verification, cosine distance scoring
│       ├── ocr_service.py        # EasyOCR Nepali/English processing with bounding boxes
│       ├── financial_ocr_service.py # Image OCR for financial documents
│       ├── financial_extraction_service.py # Unified document parsing decision tree
│       └── finguard/             # Credit risk prediction subsystem
│           ├── __init__.py
│           ├── predictor.py      # FinGuardPredictor: artifact loader, warm-up, inference
│           ├── preprocessing.py  # Feature alignment, imputation, scaling, label encoding
│           ├── rules.py          # Hard financial business rules (DTI cutoffs, minimum income)
│           ├── schemas.py        # Pydantic models for predict, batch, explain, and chat
│           └── validators.py     # Request validation, SPEC_THRESHOLD, HomeCredit feature bounds
├── scripts/                      # Utility scripts for local testing and data inspection
└── tests/                        # Pytest suite for endpoints and predictor logic
```

---

## 5. ROUTE & API CATALOG

All routes are mounted under `/api/v1/*` as well as root-level spec aliases (`/finguard/*`, `/nlu/*`).

### 5.1 KYC & Identity Verification (`app/routes/kyc.py`)

| Method | Endpoint | Handler | Description |
|---|---|---|---|
| `POST` | `/api/v1/kyc/upload` | `upload_documents` | Uploads ID front, back, or selfie image; creates `KYCApplication` record |
| `POST` | `/api/v1/kyc/verify` | `verify_face` | Database-backed face match between uploaded selfie and ID document |
| `POST` | `/api/v1/kyc/ocr/citizenship` | `ocr_citizenship` | Stateless OCR on citizenship card image; extracts name, DOB, ID number |
| `POST` | `/api/v1/kyc/face/verify` | `verify_face_stateless` | Stateless DeepFace comparison between citizenship photo and selfie |
| `GET` | `/api/v1/kyc/status/{id}` | `get_kyc_status` | Retrieves KYC application status, document count, and verification details |

### 5.2 Financial Document OCR (`app/routes/financial_ocr.py`)

| Method | Endpoint | Handler | Description |
|---|---|---|---|
| `POST` | `/api/v1/financial/ocr` | `ocr_financial_document` | Legacy raw text extraction from salary slip or bank statement via EasyOCR |
| `POST` | `/api/v1/financial/ocr/extract-document` | `extract_document` | Structured document extraction: auto-detects text vs scanned image, parses transactions & tables |

### 5.3 FinGuard Credit Default Prediction (`app/routes/finguard.py`)

| Method | Endpoint | Handler | Description |
|---|---|---|---|
| `GET` | `/api/v1/finguard/health` | `health` | Predictor liveness, loaded model version, and active threshold |
| `GET` | `/api/v1/finguard/model-info` | `model_info` | Model metadata, training manifest, and feature ordering |
| `GET` | `/api/v1/finguard/schema` | `schema` | Full JSON schema of required features and types (`feature-schema.json`) |
| `POST` | `/api/v1/finguard/predict` | `predict` | Single application inference: default probability, risk tier, credit score |
| `POST` | `/api/v1/finguard/batch` | `batch` | Batch inference: evaluates up to hundreds of applicant feature vectors |
| `POST` | `/api/v1/finguard/explain` | `explain` | Feature contribution breakdown and top risk-driving factors |

*Note: The FinGuard router is also accessible at root `/finguard/*` (e.g., `/finguard/predict`).*

### 5.4 Natural Language Financial Assistant (`app/routes/nlu.py`)

| Method | Endpoint | Handler | Description |
|---|---|---|---|
| `POST` | `/api/v1/nlu/ask` | `ask_question` | Natural language question answering with intent & entity classification |
| `POST` | `/api/v1/nlu/chat` | `chat` | Conversational financial query handler |
| `POST` | `/api/v1/nlu/document/analyze` | `analyze_document` | Analyzes raw document text, extracts monetary entities, returns chart hints |
| `GET` | `/api/v1/nlu/health` | `health` | NLU subsystem health probe |

*Note: The NLU router is also accessible at root `/nlu/*` (e.g., `/nlu/ask`).*

### 5.5 System & Health Probes (`main.py`)

| Method | Endpoint | Handler | Description |
|---|---|---|---|
| `GET` | `/health` | `health_check` | General liveness probe (`{"status": "ok", "service": "kyc-service"}`) |
| `GET` | `/ready` | `readiness_check` | Model readiness probe (`ready: true`, reports model status and degradation) |
| `GET` | `/api/v1/docs` | `versioned_swagger_ui` | Interactive Swagger UI documentation |
| `GET` | `/api/v1/redoc` | `versioned_redoc` | ReDoc API specification viewer |

---

## 6. SERVICES & INFERENCE PIPELINES

### 6.1 `FinGuardPredictor` (`app/services/finguard/predictor.py`)
- **Singleton Management**: Initialized during application lifespan via `init_predictor(...)`, accessed via `get_predictor()`.
- **Pipeline Execution**:
  1. **Validation**: Validates input dictionary against `app/services/finguard/validators.py`.
  2. **Preprocessing**: Passes features through `FinGuardPreprocessor` (`preprocessing.py`) to align feature vectors, fill missing values via median/mode imputation, and apply standard scaling.
  3. **Prediction**: Invokes LightGBM/Scikit-learn model: `model.predict_proba(X)`.
  4. **Output Synthesis**:
     - `default_probability`: Float between `0.0` and `1.0`.
     - `credit_score`: Calibrated integer score (300 to 850).
     - `decision`: `"APPROVED"` | `"REJECTED"` | `"MANUAL_REVIEW"`.
     - `risk_tier`: `"LOW"` | `"MEDIUM"` | `"HIGH"`.

### 6.2 `IdentityService` (`app/services/identity_service.py`)
- **Face Detection & Alignment**: Loads OpenCV and DeepFace (`Facenet` or `VGG-Face`).
- **Core Method**: `verify_face_match_async(selfie_path, id_document_path, kyc_application_id, session)`.
- **Scoring & Match Threshold**:
  - Distance metric: Cosine distance.
  - `distance < 0.4`: Strong match (`status: MATCH`, `recommendation: APPROVE`).
  - `0.4 <= distance < 0.6`: Marginal match (`status: POSSIBLE_MATCH` / `LOW_CONFIDENCE`, `recommendation: REVIEW`).
  - `distance >= 0.6`: Mismatch (`status: MISMATCH`, `recommendation: REJECT`).
  - `similarity_score = max(0.0, 1.0 - distance)`.

### 6.3 `OcrService` (`app/services/ocr_service.py`)
- **Engine**: EasyOCR Reader initialized for `['en', 'ne']` (or `['en', 'hi']`).
- **Method**: `extract_text_async(image_path)` / `process_image_async(image_path)`.
- **Output**: Bounding boxes, extracted strings, confidence scores per token, and structured identity field mapping (citizenship number, full name, birth date, issuing district).

### 6.4 `FinancialExtractionService` (`app/services/financial_extraction_service.py`)
- **Decision Engine**:
  - Checks file extension:
    - Text-extractable (`.pdf`, `.docx`, `.xlsx`, `.txt`): Uses native parsers (`pdfplumber`, `python-docx`, `openpyxl`) for 100% accurate character rendering without OCR artifacts.
    - Image-based (`.jpg`, `.png`, scanned image PDFs): Routes to OCR pipeline.
- **Output Schema**: Returns unified JSON containing bank metadata, transaction ledger (`date`, `description`, `debit`, `credit`, `balance`), and parsing confidence.

---

## 7. SCHEMAS & DATA MODELS

### 7.1 Pydantic Validation Schemas (`app/services/finguard/schemas.py`)
- `FinguardPredictRequest`: Accepts applicant demographic, financial, and credit bureau features (HomeCredit dataset format). Includes helper `.to_validator_dict()`.
- `FinguardPredictResponse`: Returns dual-envelope response (internal names: `default_probability`, `credit_score`, `decision`, `risk_tier`; spec alias names: `status`, `prediction`, `probability`, `risk_score`).
- `FinguardBatchRequest` / `FinguardBatchResponse`: Accepts array of applicant dictionaries, supports `stop_on_error`.
- `FinguardExplainRequest` / `FinguardExplainResponse`: Explains key drivers behind risk score.
- `AskRequest` / `AskResponse`: NLU query format (`user_id`, `message`, `session_id`).
- `DocumentAnalyzeRequest` / `DocumentAnalyzeResponse`: Document analysis format with visualization hints (`chart_type`, `data_keys`).

### 7.2 Database Models (`app/models/`)
- `User` (`app/models/user.py`): Maps `auth.users` table (`id`, `email`, `role`, `tenant_id`).
- `KYCApplication` (`app/models/kyc.py`): Primary verification record (`id`, `user_id`, `status: PENDING|APPROVED|REJECTED`, `confidence_score`).
- `Document` (`app/models/kyc.py`): Uploaded file references (`id`, `kyc_application_id`, `document_type`, `file_path`, `file_size`, `mime_type`).
- `FaceVerification` (`app/models/verification.py`): Facial matching audit (`id`, `kyc_application_id`, `is_match`, `distance`, `verified_at`).
- `OCRResult` (`app/models/verification.py`): Extracted text records (`id`, `kyc_application_id`, `document_type`, `structured_data`, `confidence_score`).

---

## 8. ML DOMAIN RULES & RISK TIERS

### 8.1 Model Thresholds
- **Trained Model Threshold**: `0.0807` (derived from optimal F1 / ROC-AUC on imbalanced default dataset).
- **Spec Threshold**: `SPEC_THRESHOLD = 0.50` (standard binary classification cutoff).
- The service exposes both thresholds in `/finguard/health` and calibrates the credit score accordingly.

### 8.2 Hard Business Rules (`app/services/finguard/rules.py`)
Even if the ML model outputs a low default probability, the application enforces statutory guardrails:
1. **Maximum Debt-to-Income (DTI)**: Applications exceeding statutory limits are flagged for `MANUAL_REVIEW` or rejected.
2. **Minimum Income Threshold**: Monthly income below subsistence thresholds triggers auto-decline.
3. **Severe Delinquency**: Past severe defaults or active bureau write-offs override ML predictions to enforce rejection.

---

## 9. SEARCH STRATEGY (Ripgrep Precision)

Quickly locate critical components in `backend-fastapi` using these targeted ripgrep commands:

```bash
# 1. Locate FinGuard ML prediction handler
rg "async def predict" app/routes/

# 2. Locate FinGuardPredictor class and inference logic
rg "class FinGuardPredictor" app/services/finguard/

# 3. Locate Face Verification logic and DeepFace calls
rg "verify_face" app/services/identity_service.py

# 4. Locate OCR extraction methods
rg "process_image_async|extract_text" app/services/ocr_service.py

# 5. Search KYC router endpoints
rg "@router\.(post|get)" app/routes/kyc.py

# 6. Locate NLU intent definitions and regex matchers
rg "class Intent|def classify_intent" app/routes/nlu.py

# 7. Locate Pydantic settings and env variable declarations
rg "class Settings" app/config.py
```

---

## 10. SHIPPING CHECKLIST

Before deploying or committing changes to `backend-fastapi`, verify the following:

- [ ] **Model Artifacts**: Ensure `model.pkl`, `model_manifest.json`, and `preprocessing.json` are present in candidate paths.
- [ ] **Warmup Integrity**: Health endpoint `/finguard/health` reports `"ready": true` and `/ready` responds with `200 OK`.
- [ ] **Cross-Platform Compatibility**: Windows event loop policy guard remains active at the top of `main.py`.
- [ ] **Stateless Safety**: Image files used during verification do not leave unhandled file locks; temporary files are deleted in `finally` blocks.
- [ ] **Dual Schema Support**: FinGuard responses contain both internal keys (`default_probability`, `credit_score`) and spec keys (`prediction`, `probability`, `risk_score`).
- [ ] **Error Handling**: Missing files return HTTP 400; validation errors return HTTP 422; internal model failures return HTTP 500.
