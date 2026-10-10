# Frontend Entities & State Types

> Client-side data models and Redux state slices.

---

### Redux State Slices (`src/store/slices`)
- **`authSlice`**: `user`, `token`, `isAuthenticated`, `role`, `loading`, `error`.
- **`tenantSlice`**: `currentTenantId`, `currentSlug`, `companyName`, `joinMode`.
- **`uiSlice`**: `sidebarOpen`, `notificationsCount`, `activeTheme`, `toastMessage`.
- **`accountSlice`**: `selectedAccount`, `recentTransactions`.

### Core Data Interfaces (`src/types`)
- **`User`**: `{ id: string; email: string; role: string; fullName?: string; isVerified: boolean }`
- **`KycApplication`**: `{ id: string; status: string; idType: string; documentNumber: string; ocrResult?: any; faceVerification?: any }`
- **`LoanApplication`**: `{ id: string; amount: number; tenureMonths: number; purpose: string; status: string; eligibleAmount?: number }`
- **`FinancialProfile`**: `{ avgMonthlyIncome: number; avgMonthlyExpense: number; savingsRate: number; debtToIncomeRatio: number }`
