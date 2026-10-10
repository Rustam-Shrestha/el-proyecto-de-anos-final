# Frontend Routes

> Full client-side routing tree defined in `frontend/src/app/router.tsx`.

---

| Client Route | Component Path | Required Role / Protection |
|---|---|---|
| `/login` | `features/auth/pages/LoginPage.tsx` | Public |
| `/register` | `features/auth/pages/RegisterPage.tsx` | Public |
| `/forgot-password` | `pages/auth/ForgotPasswordPage.tsx` | Public |
| `/reset-password` | `pages/auth/ResetPasswordPage.tsx` | Public |
| `/:slug/login` | `features/auth/pages/SlugLoginPage.tsx` | Public |
| `/:slug/customer/login` | `features/auth/pages/SlugCustomerLoginPage.tsx` | Public |
| `/:slug/apply` | `features/loans/pages/CustomerApplyPage.tsx` | Public |
| `/supercontroller/login` | `features/supercontroller/pages/SupercontrollerLoginPage.tsx` | Public |
| `/dashboard` | `app/DashboardIndex.tsx` | Authenticated (`user`, `admin`, `reviewer`, `superadmin`) |
| `/dashboard/admin` | `features/dashboard/pages/AdminDashboardPage.tsx` | `admin`, `superadmin` |
| `/dashboard/users` | `features/users/pages/UsersPage.tsx` | `admin`, `superadmin` |
| `/dashboard/kyc` | `features/kyc/pages/KYCListPage.tsx` | `superadmin`, `admin`, `reviewer` |
| `/dashboard/kyc-submit` | `features/kyc/pages/UserKYCPage.tsx` | `user`, `admin`, `superadmin` |
| `/dashboard/kyc-status` | `features/kyc/pages/KYCStatusPage.tsx` | `user`, `admin`, `superadmin` |
| `/dashboard/reports` | `features/dashboard/pages/ReportsPage.tsx` | `admin`, `superadmin` |
| `/dashboard/loans` | `features/loans/pages/LoanOfficerDashboardPage.tsx` | `admin`, `reviewer`, `superadmin` |
| `/dashboard/loans/apply`| `features/loans/pages/LoanApplicationPage.tsx` | `user`, `admin`, `superadmin` |
| `/dashboard/loans/status`| `features/loans/pages/LoanStatusPage.tsx` | `user`, `admin`, `superadmin` |
| `/dashboard/lenders` | `features/loans/pages/LendersPage.tsx` | `user`, `superadmin` |
| `/dashboard/profile` | `features/profile/pages/ProfilePage.tsx` | `user`, `admin`, `reviewer`, `superadmin` |
| `/dashboard/portfolio` | `features/loans/pages/PortfolioPage.tsx` | `user`, `admin`, `reviewer`, `superadmin` |
| `/dashboard/portfolio/admin` | `features/loans/pages/admin/PortfolioAdminListPage.tsx` | `admin`, `reviewer`, `superadmin` |
| `/dashboard/portfolio/admin/:userId`| `features/loans/pages/admin/PortfolioAdminDetailPage.tsx` | `admin`, `reviewer`, `superadmin` |
| `/dashboard/chat` | `pages/chat/ChatPage.tsx` | `user`, `admin`, `reviewer`, `superadmin` |
| `/dashboard/finguard` | `features/finguard/pages/FinguardDashboardPage.tsx` | `user`, `admin`, `superadmin` |
| `/company` | `features/company/pages/CompanyOnboardingPage.tsx` | Authenticated |
| `/admin/company-requests` | `features/company/pages/AdminCompanyRequestsPage.tsx` | `superadmin` |
| `/supercontroller` | `features/supercontroller/pages/SupercontrollerDashboardPage.tsx` | `superadmin` |
