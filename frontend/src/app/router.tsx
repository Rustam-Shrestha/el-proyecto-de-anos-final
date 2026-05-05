import { lazy } from "react";
import { createBrowserRouter, Navigate } from "react-router-dom";
import { MainLayout } from "@shared/components/layout/MainLayout";
import { AdminOnlyRoute } from "@shared/components/auth/AdminOnlyRoute";

// Route-level lazy loading keeps the initial bundle light.
const LoginPage = lazy(() => import("@auth/index"));
const UsersPage = lazy(() => import("@features/users/pages/UsersPage"));
const UserAccessPage = lazy(() => import("@features/users/pages/UserAccessPage"));
const KYCPage = lazy(() => import("@features/kyc/pages/KYCPage"));
const DashboardPage = lazy(() => import("@pages/DashboardPage"));
const NotFoundPage = lazy(() => import("@pages/NotFoundPage"));
const AccessDeniedPage = lazy(() => import("@pages/AccessDeniedPage"));

export const router = createBrowserRouter([
  {
    path: "/",
    element: <Navigate to="/auth" replace />
  },
  {
    path: "/app",
    element: <MainLayout />,
    children: [
      { index: true, element: <Navigate to="/app/dashboard" replace /> },
      { path: "dashboard", element: <DashboardPage /> },
      { path: "users", element: <UsersPage /> },
      { path: "kyc", element: <KYCPage /> },
      { path: "access-denied", element: <AccessDeniedPage /> },
      {
        element: <AdminOnlyRoute />,
        children: [{ path: "user-access", element: <UserAccessPage /> }]
      }
    ]
  },
  { path: "/auth", element: <LoginPage /> },
  { path: "*", element: <NotFoundPage /> }
]);
