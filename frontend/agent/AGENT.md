# AGENT.md (Frontend Single Page Application)

> Canonical knowledge for autonomous coding agents modifying `frontend`.
> Read once per session before making modifications in this service.

## 1. Tech Stack
- **Framework**: React 18 / 19 with TypeScript
- **Bundler**: Vite
- **Routing**: `react-router-dom` (Data router via `createBrowserRouter`)
- **Global State**: Redux Toolkit (`@reduxjs/toolkit`)
- **Server State / Cache**: TanStack React Query (`@tanstack/react-query`)
- **Styling**: Tailwind CSS + PostCSS
- **Icons**: Lucide React (`lucide-react`)
- **Real-Time WebSockets**: Socket.io-client (`socket.io-client`)
- **HTTP Client**: Axios with bearer auth interceptors

---

## 2. Boot Flow (`src/main.tsx` & `src/app/router.tsx`)
1. **Root Mounting**: Attaches to `#root` in `index.html`.
2. **Provider Hierarchy**:
   - `Provider` (`store.ts` Redux store: `authSlice`, `tenantSlice`, `accountSlice`, `uiSlice`)
   - `QueryClientProvider` (`queryClient.ts`)
   - `RouterProvider` (`router.tsx`)
3. **Route Resolution**:
   - Matches route paths (e.g., `/dashboard/loans`).
   - Evaluates `ProtectedRoute` (verifies access token in Redux / localStorage).
   - Evaluates `RoleProtectedRoute` (verifies user role against `requiredRoles`).
   - Renders `DashboardLayout` containing dynamic sub-page via `<Outlet />`.

---

## 3. Architecture Rules
1. **Route-Level Lazy Loading**: All pages in `src/app/router.tsx` MUST be lazy-loaded via `React.lazy()` to maintain small bundle sizes.
2. **Path Aliases**:
   - `@app/*` -> `src/app/*`
   - `@features/*` -> `src/features/*`
   - `@shared/*` -> `src/shared/*`
   - `@services/*` -> `src/services/*`
   - `@components/*` -> `src/components/*`
   - `@hooks/*` -> `src/hooks/*`
3. **State Separation**:
   - Server data: Always fetch and cache with TanStack Query (`useQuery`, `useMutation`).
   - Client session & UI state: Use Redux Toolkit (`useAppSelector`, `useAppDispatch`).
4. **No Tailwind Arbitrary Spam**: Use standardized utility classes. Maintain responsive mobile-first layouts.

---

## 4. Directory Layout
```
frontend/
├── src/
│   ├── app/                      # router.tsx, ProtectedRoute.tsx, store.ts, queryClient.ts
│   ├── features/                 # Domain feature slices
│   │   ├── auth/                 # LoginPage, RegisterPage, SlugLoginPage
│   │   ├── dashboard/            # AdminDashboardPage, ReportsPage
│   │   ├── kyc/                  # UserKYCPage, KYCListPage, KYCStatusPage
│   │   ├── loans/                # LoanApplicationPage, LoanOfficerDashboardPage, PortfolioPage
│   │   ├── finguard/             # FinguardDashboardPage
│   │   ├── company/              # CompanyOnboardingPage, AdminCompanyRequestsPage
│   │   ├── supercontroller/      # SupercontrollerDashboardPage
│   │   └── users/                # UsersPage
│   ├── shared/                   # layouts/DashboardLayout.tsx, ui/, components/
│   ├── services/                 # apiService.ts, authService.ts, kycService.ts
│   ├── store/                    # store.ts, hooks.ts, slices/ (authSlice, tenantSlice)
│   ├── pages/                    # Public pages, ChatPage, NotFoundPage
│   └── utils/                    # Formatting & token helpers
```

---

## 5. Search Strategy (Ripgrep Precision)
```bash
# Search React page definition
rg "export default function LoanApplicationPage" src/features/

# Search Redux action or selector
rg "useAppSelector" src/features/
rg "setCredentials" src/store/

# Search React Query mutation/query
rg "useMutation" src/features/
rg "useQuery" src/features/

# Search route path definition
rg "path: \"loans/apply\"" src/app/router.tsx
```

---

## 6. Shipping Checklist
- [ ] Role protection verified in `router.tsx` (`requiredRoles`).
- [ ] TanStack Query keys invalidated upon successful mutation.
- [ ] No broken CSS or unstyled raw elements.
- [ ] Build compiles cleanly: `npm run build` or `npm run lint`.
