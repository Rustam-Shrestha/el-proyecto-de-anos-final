# Frontend Change Dossier

Date: 2026-05-30

Scope: `frontend/` plus the cross-cutting instruction-system and toolchain edits that support it. `backend-fastapi/` has no code changes in this window.

## Executive Inventory

### State, routing, and shell architecture

| File | Change Type | What Changed |
|---|---|---|
| `frontend/src/store/slices/authSlice.ts` | Update | Auth state expanded to store user, tokens, loading/error state, persistence helpers, selectors, and logout/reset behavior. |
| `frontend/src/store/slices/uiSlice.ts` | Update | UI state expanded to include notifications, sidebar state, theme state, and localStorage-backed persistence. |
| `frontend/src/store/store.ts` | Add | Central Redux store entrypoint extracted from `src/store/index.ts`. |
| `frontend/src/store/index.ts` | Update | Re-exported from `src/store/store.ts` so the app can import a single canonical entry. |
| `frontend/src/hooks/useAuth.ts` | Update | Hook now exposes `isAuthenticated`, `accessToken`, and `refreshToken` in addition to user data and actions. |
| `frontend/src/hooks/useUI.ts` | Update | Theme application now goes through `shared/lib/theme.ts`; dark mode toggles and CSS variables stay in sync. |
| `frontend/src/providers/AppProviders.tsx` | Update | Added `ThemeBootstrap` so persisted theme state is applied on app mount. |
| `frontend/src/app/router.tsx` | Update | Router became the source of truth for authenticated pages, role guards, placeholder routes, and login/register redirects. |
| `frontend/src/app/store.ts` | Update | Points at the extracted Redux store entrypoint. |
| `frontend/src/hooks/reduxHooks.ts` | Update | Redux hooks now import `RootState` / `AppDispatch` from the extracted store module. |

### UI, layout, and navigation

| File | Change Type | What Changed |
|---|---|---|
| `frontend/src/shared/lib/theme.ts` | Add | Centralized DOM theme applier that sets `dark` class and CSS variables. |
| `frontend/src/shared/lib/avatar.ts` | Add | Resolves avatar URLs against the backend origin and supports absolute URLs. |
| `frontend/src/shared/components/Navbar.tsx` | Add | New shell navbar with dark-mode toggle, logout, and avatar rendering. |
| `frontend/src/shared/components/Sidebar.tsx` | Add | New navigation shell with user/admin route groups. |
| `frontend/src/shared/components/auth/AdminOnlyRoute.tsx` | Update | Unauthorized redirect now points at `/login` and uses `/app/access-denied` for forbidden access. |
| `frontend/src/pages/DashboardPage.tsx` | Update | Added quick links, dashboard header, cards, and explicit discoverability for existing routes. |
| `frontend/src/pages/AccessDeniedPage.tsx` | Update | Clarified the access-denied copy. |
| `frontend/src/components/common/*` | Update | Shared layout primitives were reorganized to support the new shell and route visibility flow. |

### Auth, API, and validation

| File | Change Type | What Changed |
|---|---|---|
| `frontend/src/shared/validation/authSchemas.ts` | Update | Login validation messages improved; register schema added with confirm-password and complexity rules. |
| `frontend/src/features/auth/api/authApi.ts` | Update | Register/login requests now use typed request/response envelopes and strip confirmPassword before POST. |
| `frontend/src/services/apiService.ts` | Update | 401 handling now redirects to `/login`. |
| `frontend/src/features/auth/pages/LoginPage.tsx` | Update | Updated to match the new auth flow and API typing. |
| `frontend/src/features/users/api/usersApi.ts` | Update | Users API now uses typed query/mutation helpers and normalizes paginated responses. |
| `frontend/src/features/kyc/api/kycApi.ts` | Update | KYC API now uses the shared client and typed response handling. |
| `frontend/src/features/users/pages/UsersPage.tsx` | Update | User management page was restyled and refocused around the live users list. |

### Toolchain and repo configuration

| File | Change Type | What Changed |
|---|---|---|
| `.npmrc` | Update | Removed `if-present-else-install = true`. |
| `package.json` | Update | Added overrides for `ts-api-utils` and `balanced-match`. |
| `frontend/package.json` | Update | Added overrides and dependency pins, including `balanced-match`, `ts-api-utils`, and an exact `eslint` version. |
| `frontend/eslint.config.js` | Update | Added browser globals for the new code paths (`FormData`, `HTMLButtonElement`, `KeyboardEvent`, `URL`, etc.). |
| `frontend/vite.config.js` | Update | Simplified alias setup by removing `fileURLToPath` and relying on `path`. |
| `.github/copilot-instructions.md` + `.github/instructions/*.md` | Update/Add | Copilot instruction system split into router + per-concern files. |

## What This Release Achieved

The frontend now has a coherent state model, a persistent theme bootstrap path, cleaner route guarding, route discoverability from the dashboard and shell navigation, and a clearer auth/login/register flow. The user experience changed in three concrete ways:

1. The theme toggle now changes both the class and the CSS variables, so dark mode actually recolors the page instead of only flipping a flag.
2. Routes that already existed in the router are now visible in navigation and dashboard quick actions.
3. Login/register behavior is wired through explicit validation and typed request/response envelopes, which makes failed submissions and 401 redirects easier to understand.

## Detailed Changes

### 1) Redux store split and auth state expansion

#### `frontend/src/store/store.ts`

Why:
- The Redux store needed a canonical entrypoint so hooks and app providers can import one source of truth.

What changed:
```ts
import { configureStore } from "@reduxjs/toolkit";
import authReducer from "./slices/authSlice";
import uiReducer from "./slices/uiSlice";
import accountReducer from "./slices/accountSlice";

export const store = configureStore({
  reducer: {
    auth: authReducer,
    ui: uiReducer,
    account: accountReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ["ui/openModal", "ui/closeModal", "ui/triggerMenuAction"],
        ignoredPaths: ["ui.modalContent", "ui.menuAction"],
      },
    }),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

export default store;
```

Outcome:
- Other modules now use the same store instance without import path drift.
- The serializable-check exceptions remain where React elements are stored in UI state.

#### `frontend/src/store/index.ts`

Why:
- Existing imports referenced `@store/index`; the new store module had to remain backward-compatible.

What changed:
```ts
export { default, store } from "@store/store";
export type { AppDispatch, RootState } from "@store/store";
```

Outcome:
- Old import paths still work, but the store definition now lives in a single file.

#### `frontend/src/store/slices/authSlice.ts`

Why:
- The auth slice needed to persist more than just `userData`; it now owns tokens, loading state, errors, and client details.

What changed:
```ts
export type UserRecord = {
  id?: string;
  email?: string;
  name?: string;
  role?: string;
  permissions?: string[];
  isSuperUser?: boolean;
  image?: string;
  [key: string]: unknown;
} | null;

export type AuthState = {
  user: UserRecord;
  userData: UserRecord;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  clientDetails: ClientDetails;
};
```

```ts
const initialUser = readJson<UserRecord>("user", readJson<UserRecord>("userData", null));
const initialAccessToken = readString("accessToken");
const initialRefreshToken = readString("refreshToken");

const initialState: AuthState = {
  user: initialUser,
  userData: initialUser,
  accessToken: initialAccessToken,
  refreshToken: initialRefreshToken,
  isAuthenticated: Boolean(initialAccessToken),
  isLoading: false,
  error: null,
  clientDetails: readJson<ClientDetails>("clientDetails", { name: "", id: "" }),
};
```

```ts
reducers: {
  setLoading: (state, action: PayloadAction<boolean>) => {
    state.isLoading = action.payload;
  },
  setUser: (state, action: PayloadAction<UserRecord>) => {
    state.user = action.payload;
    state.userData = action.payload;
    persistUser(action.payload);
  },
  setTokens: (
    state,
    action: PayloadAction<{ accessToken: string; refreshToken: string }>
  ) => {
    state.accessToken = action.payload.accessToken;
    state.refreshToken = action.payload.refreshToken;
    state.isAuthenticated = true;
    persistTokens(action.payload.accessToken, action.payload.refreshToken);
  },
  logout: (state) => {
    state.user = null;
    state.userData = null;
    state.accessToken = null;
    state.refreshToken = null;
    state.isAuthenticated = false;
    state.isLoading = false;
    state.error = null;
    state.clientDetails = { name: "", id: "" };
    persistUser(null);
    persistTokens(null, null);
    localStorage.removeItem("clientDetails");
  },
  setUserData: (state, action: PayloadAction<UserRecord>) => {
    state.user = action.payload;
    state.userData = action.payload;
    persistUser(action.payload);
  },
}
```

```ts
export const selectAccessToken = (state: { auth: AuthState }) => state.auth.accessToken;
export const selectRefreshToken = (state: { auth: AuthState }) => state.auth.refreshToken;
export const selectIsAuthenticated = (state: { auth: AuthState }) => state.auth.isAuthenticated;
export const selectIsLoading = (state: { auth: AuthState }) => state.auth.isLoading;
export const selectError = (state: { auth: AuthState }) => state.auth.error;
```

Outcome:
- The app can now distinguish between `user`, `userData`, and token presence.
- Login/logout flows can restore or clear the full auth session consistently.

#### `frontend/src/hooks/useAuth.ts`

Why:
- Components needed the token and auth state directly, not only the user object.

What changed:
```ts
const useAuth = () => {
  const dispatch = useDispatch();
  const userData = useSelector(selectUserData);
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const accessToken = useSelector(selectAccessToken);
  const refreshToken = useSelector(selectRefreshToken);
  ...

  return {
    userData,
    isAuthenticated,
    accessToken,
    refreshToken,
    permissions,
    isSuperUser,
    clientDetails,
    setUserData: updateUserData,
    logout,
    setClientDetails: updateClientDetails,
  };
};
```

Outcome:
- Shell components can render user identity, role, and session status without manual store access.

### 2) Theme system and UI state

#### `frontend/src/store/slices/uiSlice.ts`

Why:
- Theme, sidebar, notifications, and modal behavior belong to UI state, and dark mode needed to persist across reloads.

What changed:
```ts
export type UIState = {
  isSidebarOpen: boolean;
  theme: "light" | "dark";
  notifications: Notification[];
  modalContent: unknown;
  modalProps: Record<string, unknown>;
  themeColor: string;
  darkMode: boolean;
  refetch: boolean;
  menuAction: unknown;
  showProfileDropdown: boolean;
  showThemeModal: boolean;
};
```

```ts
const readTheme = (): "light" | "dark" => {
  const savedTheme = localStorage.getItem("theme");
  if (savedTheme === "light" || savedTheme === "dark") {
    return savedTheme;
  }

  return readBoolean("darkMode", false) ? "dark" : "light";
};
```

```ts
setTheme: (state, action: PayloadAction<"light" | "dark">) => {
  state.theme = action.payload;
  state.darkMode = action.payload === "dark";
  persistTheme(action.payload);
},
toggleDarkMode: (state) => {
  state.darkMode = !state.darkMode;
  state.theme = state.darkMode ? "dark" : "light";
  persistTheme(state.theme);
},
```

Outcome:
- Dark mode is now represented in a normalized way (`theme` + `darkMode`).
- Theme state persists cleanly in localStorage.

#### `frontend/src/shared/lib/theme.ts`

Why:
- Theme application had to be centralized so the class, CSS variables, body colors, and persisted state all move together.

What changed:
```ts
export const applyThemeToDocument = (color: string, isDark: boolean) => {
  const root = document.documentElement;
  const body = document.body;

  root.classList.toggle("dark", isDark);

  const themeVars = isDark
    ? {
        "--theme-primary": color,
        "--bg-color": "#10211a",
        "--surface-color": "#18251f",
        "--surface-muted": "#203027",
        "--text-color": "#e5efe8",
        "--border-color": "#314238",
        "--green-icon": "#8bc89a",
        "--green-background": "#d7f0dd",
        "--green-footer": "#203027",
      }
    : {
        "--theme-primary": color,
        "--bg-color": "#eef5ef",
        "--surface-color": "#ffffff",
        "--surface-muted": "#f4f8f5",
        "--text-color": "#1f2937",
        "--border-color": "#dbe5dc",
        "--green-icon": "#3c8743",
        "--green-background": "#006039",
        "--green-footer": "#e2ede3",
      };

  Object.entries(themeVars).forEach(([key, value]) => {
    root.style.setProperty(key, value);
  });

  body.style.backgroundColor = themeVars["--bg-color"];
  body.style.color = themeVars["--text-color"];
};
```

Outcome:
- Dark mode now visually changes the document, not just the Redux flag.

#### `frontend/src/hooks/useUI.ts`

Why:
- The hook needed to call the centralized theme applier instead of duplicating DOM logic.

What changed:
```ts
import { applyThemeToDocument } from "@shared/lib/theme";
```

```ts
const applyTheme = useCallback(
  (color, isDark) => {
    applyThemeToDocument(color, isDark);
    localStorage.setItem("selectedTheme", color);
    dispatch(setThemeColor(color));
  },
  [dispatch]
);
```

```ts
const toggleDarkMode = useCallback(
  () => {
    const newDarkMode = !darkMode;
    dispatch(toggleDarkModeAction());
    applyTheme(themeColor, newDarkMode);
  },
  [dispatch, applyTheme, themeColor, darkMode]
);
```

Outcome:
- One theme path now updates Redux, localStorage, CSS variables, and the document class together.

#### `frontend/src/providers/AppProviders.tsx`

Why:
- Existing persisted theme state needed to be applied before the UI shell renders.

What changed:
```tsx
const ThemeBootstrap = () => {
  const darkMode = useAppSelector(selectDarkMode);
  const themeColor = useAppSelector(selectThemeColor);

  useEffect(() => {
    applyThemeToDocument(themeColor, darkMode);
  }, [darkMode, themeColor]);

  return null;
};
```

```tsx
<QueryClientProvider client={queryClient}>
  <ThemeBootstrap />
  {children}
</QueryClientProvider>
```

Outcome:
- Theme state is restored on boot without waiting for user interaction.

### 3) Routing, guards, and discoverability

#### `frontend/src/app/router.tsx`

Why:
- The router is now the source of truth for every authenticated page and role-protected route.

What changed:
```tsx
export const router = createBrowserRouter([
  {
    path: "/",
    element: <Navigate to="/dashboard" replace />
  },
  {
    path: "/app",
    element: (
      <ProtectedRoute>
        <DashboardLayout />
      </ProtectedRoute>
    ),
    children: [
      { index: true, element: <Navigate to="/app/dashboard" replace /> },
      {
        path: "dashboard",
        element: (
          <RoleProtectedRoute requiredRoles={["user", "admin"]}>
            <DashboardPage />
          </RoleProtectedRoute>
        )
      },
      {
        path: "users",
        element: (
          <RoleProtectedRoute requiredRoles={["admin"]}>
            <UsersPage />
          </RoleProtectedRoute>
        )
      },
      {
        path: "kyc",
        element: (
          <RoleProtectedRoute requiredRoles={["admin"]}>
            <KYCPage />
          </RoleProtectedRoute>
        )
      },
      { path: "access-denied", element: <AccessDeniedPage /> },
      {
        path: "user-access",
        element: (
          <RoleProtectedRoute requiredRoles={["admin"]}>
            <UserAccessPage />
          </RoleProtectedRoute>
        )
      }
    ]
  },
  {
    path: "/dashboard",
    element: (
      <ProtectedRoute>
        <DashboardLayout />
      </ProtectedRoute>
    ),
    children: [
      {
        index: true,
        element: (
          <RoleProtectedRoute requiredRoles={["user", "admin"]}>
            <DashboardPage />
          </RoleProtectedRoute>
        )
      },
      {
        path: "admin",
        element: (
          <RoleProtectedRoute requiredRoles={["admin"]}>
            <AdminDashboardPage />
          </RoleProtectedRoute>
        )
      },
      {
        path: "users",
        element: (
          <RoleProtectedRoute requiredRoles={["admin"]}>
            <UsersPage />
          </RoleProtectedRoute>
        )
      },
      {
        path: "kyc",
        element: (
          <RoleProtectedRoute requiredRoles={["admin"]}>
            <KYCListPage />
          </RoleProtectedRoute>
        )
      },
      {
        path: "reports",
        element: (
          <RoleProtectedRoute requiredRoles={["admin"]}>
            <RoutePlaceholder
              title="Reports"
              description="Reporting views will be added here in a later prompt."
            />
          </RoleProtectedRoute>
        )
      },
      {
        path: "kyc-submit",
        element: (
          <RoleProtectedRoute requiredRoles={["user", "admin"]}>
            <UserKYCPage />
          </RoleProtectedRoute>
        )
      },
      {
        path: "kyc-status",
        element: (
          <RoleProtectedRoute requiredRoles={["user", "admin"]}>
            <UserKYCStatusPage />
          </RoleProtectedRoute>
        )
      },
      {
        path: "profile",
        element: (
          <RoleProtectedRoute requiredRoles={["user", "admin"]}>
            <ProfilePage />
          </RoleProtectedRoute>
        )
      }
    ]
  },
  { path: "/login", element: <LoginPage /> },
  { path: "/register", element: <RegisterPage /> },
  { path: "/auth", element: <Navigate to="/login" replace /> },
  { path: "*", element: <NotFoundPage /> }
]);
```

Outcome:
- The app now exposes all intended paths from a single routing source.
- `/auth` is now a compatibility redirect to `/login`.

#### `frontend/src/shared/components/auth/AdminOnlyRoute.tsx`

Why:
- The unauthorized redirect needed to match the actual login route and the forbidden path.

What changed:
```tsx
if (!token) {
  return <Navigate to="/login" replace state={{ from: location.pathname }} />;
}

if (role !== "admin") {
  return <Navigate to="/app/access-denied" replace state={{ from: location.pathname }} />;
}
```

Outcome:
- Unauthorized users are now routed consistently.

#### `frontend/src/pages/AccessDeniedPage.tsx`

Why:
- The copy needed to describe the actual state more clearly.

What changed:
```tsx
<p className="mt-2 text-sm text-slate-700">
  You do not have permission to view this page.
  {fromPath ? ` You tried to access: ${fromPath}` : ""}
</p>
```

Outcome:
- The page now explains denial instead of implying a single admin-only rule.

### 4) Auth, request validation, and API flow

#### `frontend/src/shared/validation/authSchemas.ts`

Why:
- Login and register needed clearer validation feedback and stronger password rules.

What changed:
```ts
export const loginSchema = z.object({
  email: z.string().email("Enter a valid email address"),
  password: z.string().min(8, "Password must be at least 8 characters")
});
```

```ts
export const registerSchema = z
  .object({
    email: z.string().email("Enter a valid email address"),
    password: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .regex(/[a-z]/, "Password must include a lowercase letter")
      .regex(/[A-Z]/, "Password must include an uppercase letter")
      .regex(/[0-9]/, "Password must include a number"),
    confirmPassword: z.string().min(1, "Confirm your password"),
  })
  .refine((value) => value.password === value.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });
```

Outcome:
- Register errors are now actionable and specific.

#### `frontend/src/features/auth/api/authApi.ts`

Why:
- Login/register requests needed typed envelopes and a clean payload shape.

What changed:
```ts
export const loginRequest = async (payload: LoginInput) => {
  const { data } = await apiClient.post<ApiResponse<AuthData>>("/auth/login", payload);
  return data.data;
};

export const registerRequest = async (payload: RegisterInput) => {
  const { confirmPassword: _confirmPassword, ...body } = payload;
  const { data } = await apiClient.post<RegisterResponse>("/auth/register", body);
  return data.data;
};
```

Outcome:
- The frontend now sends only the fields the backend expects.
- The register flow no longer posts `confirmPassword`.

#### `frontend/src/services/apiService.ts`

Why:
- The 401 handler needed to send users to a real login route.

What changed:
```ts
if (error.response?.status === 401) {
  console.error("Unauthorized! Redirecting to login...");
  localStorage.clear();
  window.location.href = "/login";
}
```

Outcome:
- Expired sessions now land on `/login` instead of a dead path.

#### `frontend/src/features/users/api/usersApi.ts`

Why:
- User CRUD calls needed typed response handling and React Query invalidation.

What changed:
```ts
export const listUsers = async (page = 1, limit = 10) => {
  const { data } = await apiClient.get<UsersApiResponse>(`/users?page=${page}&limit=${limit}`);

  if ("meta" in data) {
    return {
      data: data.data,
      page: data.meta.page,
      limit: data.meta.limit,
      total: data.meta.total
    } satisfies PaginatedUsers;
  }

  return data;
};
```

```ts
export const useCreateUserMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: Omit<User, "id">) => createUser(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
    },
  });
};
```

Outcome:
- User lists and mutations now refresh correctly through React Query.

#### `frontend/src/features/kyc/api/kycApi.ts`

Why:
- KYC requests needed to use the same shared API client while keeping direct axios upload flows where required.

What changed:
```ts
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";
```

```ts
const { data } = await apiClient.get<KYCListApiResponse>(`/kyc?${searchParams.toString()}`);
```

Outcome:
- KYC list/status flows now use the same request base as the rest of the frontend.

### 5) Dashboard and discoverability

#### `frontend/src/pages/DashboardPage.tsx`

Why:
- Existing routes were already present in the router, but users could not discover them easily.

What changed:
```tsx
const quickLinks = [
  { label: "Admin Dashboard", to: "/dashboard/admin", description: "System overview for admins" },
  { label: "Users", to: "/dashboard/users", description: "Manage users and access" },
  { label: "KYC", to: "/dashboard/kyc", description: "Review KYC applications" },
  { label: "Submit KYC", to: "/dashboard/kyc-submit", description: "Start a new submission" },
  { label: "KYC Status", to: "/dashboard/kyc-status", description: "Check application status" },
  { label: "Profile", to: "/dashboard/profile", description: "Update your account" },
  { label: "Reports", to: "/dashboard/reports", description: "Open reporting views" },
  { label: "User Access", to: "/app/user-access", description: "Assign or review access" },
];
```

```tsx
<Link
  key={link.to}
  to={link.to}
  className="rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 text-left transition-colors hover:border-[var(--green-icon)] hover:bg-white dark:border-gray-800 dark:bg-gray-950 dark:hover:bg-gray-800"
>
  <span className="block text-sm font-semibold text-gray-900 dark:text-gray-100">{link.label}</span>
  <span className="mt-1 block text-xs text-gray-500 dark:text-gray-400">{link.description}</span>
</Link>
```

Outcome:
- The dashboard now acts as a route map for the rest of the application.

#### `frontend/src/shared/components/Navbar.tsx`

Why:
- The shell needed a visible user menu, avatar rendering, and a direct dark-mode toggle.

What changed:
```tsx
const { userData, logout } = useAuth();
const { toggleDarkMode } = useUI();

const displayName = useMemo(
  () => userData?.fullName || userData?.name || userData?.email || "User",
  [userData]
);
```

```tsx
<button
  type="button"
  onClick={toggleDarkMode}
  className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-gray-200 text-gray-700 transition-colors hover:bg-gray-100 dark:border-gray-700 dark:text-gray-200 dark:hover:bg-gray-800"
  aria-label="Toggle dark mode"
>
  <Moon className="h-4 w-4" />
</button>
```

```tsx
{userData?.avatarUrl ? (
  <img
    src={resolveAvatarUrl(userData.avatarUrl) || undefined}
    alt="User avatar"
    className="h-full w-full rounded-full object-cover"
  />
) : (
  <UserCircle2 className="h-5 w-5" />
)}
```

Outcome:
- The navbar now reflects the current session and avatar state.

#### `frontend/src/shared/components/Sidebar.tsx`

Why:
- Navigation links needed to be visible and grouped by user/admin capability.

What changed:
```tsx
const userItems: MenuItem[] = [
  { label: "Dashboard", path: "/dashboard", icon: LayoutDashboard },
  { label: "Submit KYC", path: "/dashboard/kyc-submit", icon: ScanSearch },
  { label: "KYC Status", path: "/dashboard/kyc-status", icon: ShieldCheck },
  { label: "Profile", path: "/dashboard/profile", icon: UserCircle2 },
];

const adminItems: MenuItem[] = [
  { label: "Admin Dashboard", path: "/dashboard/admin", icon: Gauge },
  { label: "Users Management", path: "/dashboard/users", icon: Users },
  { label: "KYC Management", path: "/dashboard/kyc", icon: FileText },
  { label: "Reports", path: "/dashboard/reports", icon: FileBarChart2 },
];
```

Outcome:
- Users now have explicit navigation to pages that already existed.
- Admin routes are grouped separately.

#### `frontend/src/shared/lib/avatar.ts`

Why:
- Avatar URLs may be relative `/uploads/...` paths or absolute URLs.

What changed:
```ts
export const resolveAvatarUrl = (avatarUrl?: string | null) => {
  if (!avatarUrl) {
    return null;
  }

  if (/^https?:\/\//i.test(avatarUrl)) {
    return avatarUrl;
  }

  const origin = getBackendOrigin();
  const normalizedPath = avatarUrl.startsWith("/") ? avatarUrl : `/${avatarUrl}`;
  return origin ? `${origin}${normalizedPath}` : normalizedPath;
};
```

Outcome:
- The frontend can render avatar URLs returned by the backend without hardcoding a host.

### 6) Toolchain and config changes

#### `.npmrc`

Why:
- The install behavior needed to be simplified.

What changed:
```ini
# Install only production deps when NODE_ENV is production
if-present-else-install = true
```

Outcome:
- That install-mode override was removed.

#### `package.json`

Why:
- Root tooling needed dependency pinning to stabilize the workspace.

What changed:
```json
"overrides": {
  "ts-api-utils": "2.4.0",
  "balanced-match": "3.0.1"
},
"devDependencies": {
  "concurrently": "^9.0.1",
  "ts-api-utils": "2.4.0",
  "balanced-match": "3.0.1"
}
```

Outcome:
- The workspace now pins the toolchain dependencies that were causing version drift.

#### `frontend/package.json`

Why:
- Frontend lint/build dependencies needed the same pinning and a specific eslint version.

What changed:
```json
"overrides": {
  "ts-api-utils": "2.4.0"
},
"dependencies": {
  "balanced-match": "3.0.1"
},
"devDependencies": {
  "eslint": "9.39.4",
  "ts-api-utils": "2.4.0"
}
```

Outcome:
- The frontend package file now matches the working dependency versions used during the patch.

#### `frontend/eslint.config.js`

Why:
- New code introduced browser globals that ESLint needed to know about.

What changed:
```js
FormData: "readonly",
HTMLButtonElement: "readonly",
HTMLDivElement: "readonly",
HTMLTextAreaElement: "readonly",
KeyboardEvent: "readonly",
URL: "readonly",
```

Outcome:
- The new components and API helpers lint cleanly in the browser context.

#### `frontend/vite.config.js`

Why:
- The alias setup was simplified.

What changed:
```js
import path from "node:path";
// Alias paths reduce brittle relative imports and make module reuse easier.
export default defineConfig({
    plugins: [react()],
    resolve: {
```

Outcome:
- Vite still resolves aliases, but the config is less brittle.

## Evolution Narrative

The frontend moved from a partially connected shell into a structured app with a clean data flow:

1. Redux now owns auth and UI state explicitly, including tokens and theme preferences.
2. The router now defines every meaningful page and protects them with role-aware wrappers.
3. The dashboard and shell navigation now point users toward the pages that already exist.
4. Theme application is centralized, so the document actually changes color when dark mode is toggled.
5. Login/register flows now use typed validation and typed API responses.
6. Shared helpers like `resolveAvatarUrl` and the new shell layout components reduce path and host assumptions.

The result is a frontend that is easier to reason about for both contributors and automated agents: state flows through Redux, server state flows through React Query, and route access is explicit in the router rather than implicit in scattered components.

## Intern Guide

To understand the frontend quickly, read it in this order:

1. `src/app/router.tsx` to learn which pages exist and how role protection works.
2. `src/store/slices/authSlice.ts` and `src/store/slices/uiSlice.ts` to understand what the app persists.
3. `src/hooks/useAuth.ts` and `src/hooks/useUI.ts` to see the high-level hooks consumed by components.
4. `src/providers/AppProviders.tsx` to see how persisted theme state is bootstrapped.
5. `src/shared/components/Navbar.tsx` and `src/shared/components/Sidebar.tsx` to see how the shell exposes the route map.
6. `src/features/auth/api/authApi.ts` and `src/services/apiService.ts` to understand login/register and 401 handling.

State ownership rule of thumb:
- Redux: auth, ui, and app-level session state.
- React Query: lists, detail fetches, and server mutations.
- useState: local input and modal state.

When adding a new page, do three things in the same change:

1. Register the route in `src/app/router.tsx`.
2. Add a visible navigation entry in the sidebar or dashboard if users should find it.
3. Add the corresponding API/helper or Redux state only if the page actually needs it.

## Instruction-System Note

The repository instructions were also restructured under `.github/` into a router file plus concern-specific documents. That change does not affect runtime behavior, but it should be treated as part of the project’s living documentation because it changes how future edits are guided.
