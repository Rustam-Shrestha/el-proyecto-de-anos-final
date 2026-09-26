import { lazy } from "react";
import { createBrowserRouter, Navigate } from "react-router-dom";
import { ProtectedRoute } from "@app/ProtectedRoute";
import { RoleProtectedRoute } from "@app/RoleProtectedRoute";
import { DashboardIndex } from "@app/DashboardIndex";
import { DashboardLayout } from "@shared/layouts/DashboardLayout";
import ErrorPage from "../pages/ErrorPage";
import UnauthorizedPage from "../pages/UnauthorizedPage";

// Route-level lazy loading keeps the initial bundle light.
const LoginPage = lazy(() => import("@features/auth/pages/LoginPage"));
const RegisterPage = lazy(() => import("@features/auth/pages/RegisterPage"));
const AdminDashboardPage = lazy(() => import("@features/dashboard/pages/AdminDashboardPage"));
const ProfilePage = lazy(() => import("@features/profile/pages/ProfilePage"));
const UsersPage = lazy(() => import("@features/users/pages/UsersPage"));
const KYCListPage = lazy(() => import("@features/kyc/pages/KYCListPage"));
const UserKYCPage = lazy(() => import("@features/kyc/pages/UserKYCPage"));
const KYCStatusPage = lazy(() => import("@features/kyc/pages/KYCStatusPage"));
const LoanApplicationPage = lazy(() => import("@features/loans/pages/LoanApplicationPage"));
const LoanStatusPage = lazy(() => import("@features/loans/pages/LoanStatusPage"));
const LoanOfficerDashboardPage = lazy(() => import("@features/loans/pages/LoanOfficerDashboardPage"));
const ReportsPage = lazy(() => import("@features/dashboard/pages/ReportsPage"));
const FinguardDashboardPage = lazy(() => import("@features/finguard/pages/FinguardDashboardPage"));
const PortfolioPage = lazy(() => import("@features/loans/pages/PortfolioPage"));
const PortfolioAdminListPage = lazy(() => import("@features/loans/pages/admin/PortfolioAdminListPage"));
const PortfolioAdminDetailPage = lazy(() => import("@features/loans/pages/admin/PortfolioAdminDetailPage"));
const ChatPage = lazy(() => import("@pages/chat/ChatPage"));
const NotFoundPage = lazy(() => import("@pages/NotFoundPage"));
const ContactPage = lazy(() => import("../pages/public/ContactPage"));
const AboutPage = lazy(() => import("../pages/public/AboutPage"));
const SimplePublicPage = lazy(() => import("../pages/public/SimplePublicPage"));
const SupercontrollerDashboardPage = lazy(() => import("@features/supercontroller/pages/SupercontrollerDashboardPage"));
const SupercontrollerLoginPage = lazy(() => import("@features/supercontroller/pages/SupercontrollerLoginPage"));
const CompanyOnboardingPage = lazy(() => import("@features/company/pages/CompanyOnboardingPage"));
const AdminCompanyRequestsPage = lazy(() => import("@features/company/pages/AdminCompanyRequestsPage"));
// Multi-tenant compat pages (MD Part 12): slug-scoped login + customer apply.
const SlugLoginPage = lazy(() => import("@features/auth/pages/SlugLoginPage"));
const SlugCustomerLoginPage = lazy(() => import("@features/auth/pages/SlugCustomerLoginPage"));
const CustomerApplyPage = lazy(() => import("@features/loans/pages/CustomerApplyPage"));

export const router = createBrowserRouter([
  {
    errorElement: <ErrorPage />,
    children: [
      {
        path: "/",
        element: <Navigate to="/dashboard" replace />
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
              <RoleProtectedRoute requiredRoles={["user", "admin", "reviewer", "superadmin"]}>
                <DashboardIndex />
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
              <RoleProtectedRoute requiredRoles={["admin", "reviewer"]}>
                <KYCListPage />
              </RoleProtectedRoute>
            )
          },
          {
            path: "reports",
            element: (
              <RoleProtectedRoute requiredRoles={["admin"]}>
                <ReportsPage />
              </RoleProtectedRoute>
            )
          },
          {
            path: "loans",
            element: (
              <RoleProtectedRoute requiredRoles={["admin", "reviewer"]}>
                <LoanOfficerDashboardPage />
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
                <KYCStatusPage />
              </RoleProtectedRoute>
            )
          },
          {
            path: "profile",
            element: (
              <RoleProtectedRoute requiredRoles={["user", "admin", "reviewer", "superadmin"]}>
                <ProfilePage />
              </RoleProtectedRoute>
            )
          },
          {
            path: "portfolio",
            element: (
              <RoleProtectedRoute requiredRoles={["user", "admin"]}>
                <PortfolioPage />
              </RoleProtectedRoute>
            )
          },
          {
            path: "portfolio/admin",
            element: (
              <RoleProtectedRoute requiredRoles={["admin", "reviewer"]}>
                <PortfolioAdminListPage />
              </RoleProtectedRoute>
            )
          },
          {
            path: "portfolio/admin/:userId",
            element: (
              <RoleProtectedRoute requiredRoles={["admin", "reviewer"]}>
                <PortfolioAdminDetailPage />
              </RoleProtectedRoute>
            )
          },
          {
            path: "loans/apply",
            element: (
              <RoleProtectedRoute requiredRoles={["user", "admin"]}>
                <LoanApplicationPage />
              </RoleProtectedRoute>
            )
          },
          {
            path: "loans/status",
            element: (
              <RoleProtectedRoute requiredRoles={["user", "admin"]}>
                <LoanStatusPage />
              </RoleProtectedRoute>
            )
          },
          {
            path: "chat",
            element: (
              <RoleProtectedRoute requiredRoles={["user", "admin", "reviewer"]}>
                <ChatPage />
              </RoleProtectedRoute>
            )
          },
          {
            path: "finguard",
            element: (
              <RoleProtectedRoute requiredRoles={["user", "admin"]}>
                <FinguardDashboardPage />
              </RoleProtectedRoute>
            )
          }
        ]
      },
      { path: "/login", element: <LoginPage /> },
      { path: "/register", element: <RegisterPage /> },
      // Multi-tenant compat routes (MD Part 12). Static routes rank above
      // these dynamic segments, so /login, /apply, etc. are unaffected.
      { path: "/:slug/login", element: <SlugLoginPage /> },
      { path: "/:slug/customer/login", element: <SlugCustomerLoginPage /> },
      { path: "/:slug/apply", element: <CustomerApplyPage /> },
      { path: "/auth", element: <Navigate to="/login" replace /> },
      { path: "/supercontroller/login", element: <SupercontrollerLoginPage /> },
      {
        path: "/company",
        element: (
          <ProtectedRoute>
            <DashboardLayout>
              <CompanyOnboardingPage />
            </DashboardLayout>
          </ProtectedRoute>
        ),
      },
      {
        // Platform only: approving new-company requests creates tenants.
        path: "/admin/company-requests",
        element: (
          <ProtectedRoute>
            <DashboardLayout>
              <RoleProtectedRoute requiredRoles={["superadmin"]}>
                <AdminCompanyRequestsPage />
              </RoleProtectedRoute>
            </DashboardLayout>
          </ProtectedRoute>
        ),
      },
      {
        path: "/supercontroller",
        element: (
          <ProtectedRoute>
            <DashboardLayout>
              <RoleProtectedRoute requiredRoles={["superadmin"]}>
                <SupercontrollerDashboardPage />
              </RoleProtectedRoute>
            </DashboardLayout>
          </ProtectedRoute>
        ),
      },
      { path: "/unauthorized", element: <UnauthorizedPage /> },
      { path: "/401", element: <UnauthorizedPage /> },
      { path: "/about", element: <AboutPage /> },
      { path: "/contact", element: <ContactPage /> },
      { path: "/pricing", element: <SimplePublicPage path="/pricing" title="Pricing" description="Affordable loan risk prediction pricing. Pay per prediction or unlimited tier. No hidden fees." /> },
      { path: "/docs", element: <SimplePublicPage path="/docs" title="API Documentation" description="API documentation for FinGuard loan risk model. Integrate default risk prediction into your platform." /> },
      { path: "/terms", element: <SimplePublicPage path="/terms" title="Terms of Service" description="Terms of Service. Legal agreement governing FinGuard platform use." /> },
      { path: "/privacy", element: <SimplePublicPage path="/privacy" title="Privacy Policy" description="Privacy Policy. How FinGuard protects your data. GDPR-compliant." /> },
      { path: "/apply", element: <SimplePublicPage path="/apply" title="Apply for a Loan" description="Apply for a loan in 5 minutes. FinGuard's AI analyzes your financial profile and gives instant decision." /> },
      { path: "*", element: <NotFoundPage /> }
    ]
  }
]);
