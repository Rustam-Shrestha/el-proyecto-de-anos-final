import { lazy } from "react";
import { createBrowserRouter, Navigate } from "react-router-dom";
import { ProtectedRoute } from "@app/ProtectedRoute";
import { RoleProtectedRoute } from "@app/RoleProtectedRoute";
import { DashboardLayout } from "@shared/layouts/DashboardLayout";
import ErrorPage from "../pages/ErrorPage";

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
const DashboardPage = lazy(() => import("@pages/DashboardPage"));
const NotFoundPage = lazy(() => import("@pages/NotFoundPage"));

const RoutePlaceholder = ({ title, description }: { title: string; description: string }) => (
  <section className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900">
    <p className="text-sm font-semibold uppercase tracking-[0.22em] text-[var(--green-icon)]">Coming Soon</p>
    <h2 className="mt-2 text-3xl font-semibold text-gray-900 dark:text-gray-100">{title}</h2>
    <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">{description}</p>
  </section>
);

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
              <RoleProtectedRoute requiredRoles={["admin", "reviewer"]}>
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
                  description="Reporting views will be added here in a later "
                />
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
              <RoleProtectedRoute requiredRoles={["user", "admin"]}>
                <ProfilePage />
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
          }
        ]
      },
      { path: "/login", element: <LoginPage /> },
      { path: "/register", element: <RegisterPage /> },
      { path: "/auth", element: <Navigate to="/login" replace /> },
      { path: "*", element: <NotFoundPage /> }
    ]
  }
]);
