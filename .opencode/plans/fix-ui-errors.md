# Fix UI Errors Plan

## 1. Fix `role?.trim is not a function` in Sidebar, AdminOnlyRoute, NonAdminOnlyRoute

### `frontend/src/shared/components/Sidebar.tsx` (line 41)
**Change:** Replace inline `userData?.role?.trim().toLowerCase()` with safe type-checked version.
```tsx
// Before:
const role = useMemo(() => userData?.role?.trim().toLowerCase() ?? "", [userData?.role]);

// After:
const role = useMemo(() => {
  const r = userData?.role;
  if (Array.isArray(r)) return r[0]?.trim().toLowerCase() ?? "";
  if (typeof r !== "string") return "";
  return r.trim().toLowerCase();
}, [userData?.role]);
```

### `frontend/src/shared/components/auth/AdminOnlyRoute.tsx` (line 4)
```tsx
// Before:
const normalizeRole = (role?: string | null) => role?.trim().toLowerCase() ?? "";

// After:
const normalizeRole = (role?: string | string[] | null): string => {
  if (Array.isArray(role)) return role[0]?.trim().toLowerCase() ?? "";
  if (typeof role !== "string") return "";
  return role.trim().toLowerCase();
};
```

### `frontend/src/app/NonAdminOnlyRoute.tsx` (line 4)
Same change as AdminOnlyRoute above.

---

## 2. Fix ProfilePage and UsersPage mirror/double layout

### `frontend/src/features/profile/pages/ProfilePage.tsx`
**Change:** Remove `<DashboardLayout>` wrapper since the parent route already provides it.
```tsx
// Before:
const ProfilePage = memo(() => {
  return (
    <DashboardLayout>
      <div className="mx-auto max-w-3xl space-y-6">...</div>
    </DashboardLayout>
  );
});

// After:
const ProfilePage = memo(() => {
  return (
    <div className="mx-auto max-w-3xl space-y-6">...</div>
  );
});
```

### `frontend/src/features/users/pages/UsersPage.tsx`
Same pattern — remove `<DashboardLayout>` wrapper, keep only the inner content div.

---

## 3. Fix skeleton pages stuck loading forever

### `frontend/src/features/loans/pages/LoanApplicationPage.tsx`
**Change:** Add `isError` state handling after loading.
```tsx
// Before:
const { data: kyc, isLoading } = useGetMyKYCStatus();

// After:
const { data: kyc, isLoading, isError } = useGetMyKYCStatus();
```
Then add an error block after the `isLoading` check:
```tsx
if (isError) {
  return (
    <section className="space-y-6">
      <div className="rounded-3xl border border-red-200 bg-danger-50 p-6 text-red-800 dark:border-red-900/40 dark:bg-danger-950/40 dark:text-red-200">
        Unable to load KYC status. Please try again later.
      </div>
    </section>
  );
}
```

### `frontend/src/features/loans/api/loansApi.ts`, `frontend/src/features/kyc/api/kycApi.ts`, `frontend/src/features/users/api/usersApi.ts`
**Change:** Replace `retry: true` with `retry: 1` in all `useQuery` calls to prevent infinite loading on failed API calls.

---

## 4. Fix light mode theme colors

### `frontend/src/shared/lib/theme.ts`
**Change:** Update light mode CSS variables:
```ts
// Before:
"--bg-color": "#f0f7f2",
"--surface-color": "#ffffff",
"--text-color": "#1f2937",
"--border-color": "#dbe5dc",
"--green-footer": "#e2ede3",
"--surface-muted": "#f4f8f5",

// After:
"--bg-color": "#ffffff",
"--surface-color": "#ffffff",
"--text-color": "#111827",
"--border-color": "#e5e7eb",
"--green-footer": "#f0fdf4",
"--surface-muted": "#f9fafb",
```

### `frontend/src/assets/styles/global.css`
**Change:** Update the `:root` fallback values to match:
```css
--bg-color: #ffffff;
--surface-color: #ffffff;
--surface-muted: #f9fafb;
--text-color: #111827;
--border-color: #e5e7eb;
--green-footer: #f0fdf4;
```

### `frontend/src/assets/styles/global.css`
**Change:** Update `.layout-shell` background to plain white instead of gradient:
```css
.layout-shell {
  min-height: 100vh;
  background: #ffffff;
  color: var(--text-color);
}
```

### `frontend/src/shared/layouts/DashboardLayout.tsx`
**Change:** Remove `dark:bg-[#10211a]` override and let CSS variables handle dark mode naturally.

---

## 5. Investigate and fix "Objects are not valid as a React child" error

Search all `.tsx` files for patterns like `{data}`, `{user}`, `{item}` in JSX where the value might be an object. Likely candidates:
- `DeleteUserModal.tsx` — may render `user` object directly
- `UserFormModal.tsx` — may render `user` object directly  
- ErrorPage rendering `error.message` when error is a plain object

**Fix:** Ensure all JSX expressions that render dynamic content access specific properties (`.name`, `.id`, etc.) rather than the entire object.
