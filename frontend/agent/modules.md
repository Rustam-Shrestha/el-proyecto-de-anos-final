# Frontend Modules

> Feature modules and component structures in `frontend/src/features`.

---

## 1. Authentication & Onboarding (`features/auth`)
- **Pages**: `LoginPage.tsx`, `RegisterPage.tsx`, `SlugLoginPage.tsx`, `SlugCustomerLoginPage.tsx`.
- **State**: `store/slices/authSlice.ts`, `store/slices/tenantSlice.ts`.
- **Responsibilities**: User credential submission, token storage in Redux, tenant slug routing.

---

## 2. KYC Verification Wizard (`features/kyc`)
- **Pages**: `UserKYCPage.tsx`, `KYCStatusPage.tsx`, `KYCListPage.tsx`.
- **Components**: Document upload zones, selfie camera capture, verification progress tracker.
- **Responsibilities**: Identity submission, reviewer inspection queue, rejection resubmission flow.

---

## 3. Loan Origination & Decisioning (`features/loans`)
- **Pages**: `LoanApplicationPage.tsx`, `LoanStatusPage.tsx`, `LoanOfficerDashboardPage.tsx`, `LendersPage.tsx`, `CustomerApplyPage.tsx`.
- **Components**: EMI slider, tenure picker, underwriting decision cards (Approve/Reject).
- **Responsibilities**: Loan request submission, lender marketplace, loan officer review queue.

---

## 4. Borrower Portfolio & Bureau Oversight (`features/loans/pages/admin`)
- **Pages**: `PortfolioPage.tsx`, `PortfolioAdminListPage.tsx`, `PortfolioAdminDetailPage.tsx`.
- **Components**: Active loan cards, repayment progress bar, bureau verification checklist.
- **Responsibilities**: Outstanding loan monitoring, bureau debt status, repayment tracking.

---

## 5. FinGuard Statement Analytics (`features/finguard`)
- **Pages**: `FinguardDashboardPage.tsx`.
- **Components**: Monthly trend chart, spending category breakdown, savings rate badge.
- **Responsibilities**: Bank statement file drop, cash-flow visualization, financial health score.

---

## 6. Supercontroller Console (`features/supercontroller`)
- **Pages**: `SupercontrollerDashboardPage.tsx`, `SupercontrollerLoginPage.tsx`.
- **Components**: Tenant table, feature toggle switches, platform KPI cards.
- **Responsibilities**: Cross-company provisioning, system feature flag toggling, global health overview.

---

## 7. Company Requests (`features/company`)
- **Pages**: `CompanyOnboardingPage.tsx`, `AdminCompanyRequestsPage.tsx`.
- **Components**: Company registration form, request approval actions.
- **Responsibilities**: Tenant company registration request and supercontroller decisioning.
