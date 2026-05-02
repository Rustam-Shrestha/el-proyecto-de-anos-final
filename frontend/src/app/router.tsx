import { lazy } from "react";
import { createBrowserRouter, Navigate } from "react-router-dom";
import { MainLayout } from "@shared/components/layout/MainLayout";

// Route-level lazy loading keeps the initial bundle light.
const LoginPage = lazy(() => import("@auth/index"));
const UsersPage = lazy(() => import("@features/users/pages/UsersPage"));
const DashboardPage = lazy(() => import("@pages/DashboardPage"));
const NotFoundPage = lazy(() => import("@pages/NotFoundPage"));

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
      { path: "users", element: <UsersPage /> }
    ]
  },
  { path: "/auth", element: <LoginPage /> },
  { path: "*", element: <NotFoundPage /> }
]);
