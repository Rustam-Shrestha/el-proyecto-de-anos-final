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
const ReportsPage = lazy(() => import("@features/dashboard/pages/ReportsPage"));
const DashboardPage = lazy(() => import("@pages/DashboardPage"));
const PortfolioPage = lazy(() => import("@features/loans/pages/PortfolioPage"));
const NotFoundPage = lazy(() => import("@pages/NotFoundPage"));

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
              <RoleProtectedRoute requiredRoles={["user", "admin"]}>
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
