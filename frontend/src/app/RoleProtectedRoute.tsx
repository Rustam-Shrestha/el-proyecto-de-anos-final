import { type ReactNode } from "react";
import { Navigate } from "react-router-dom";
import AccessDeniedPage from "@pages/AccessDeniedPage";
import { useAppSelector } from "@hooks/reduxHooks";
import { selectIsAuthenticated, selectUserData } from "@store/slices/authSlice";

type RoleProtectedRouteProps = {
  children: ReactNode;
  requiredRoles: string[];
  fallback?: ReactNode;
};

const normalizeRole = (role?: string | string[] | null): string => {
  if (Array.isArray(role)) return role[0]?.trim().toLowerCase() ?? "";
  if (typeof role !== "string") return "";
  return role.trim().toLowerCase();
};

export const RoleProtectedRoute = ({ children, requiredRoles, fallback }: RoleProtectedRouteProps) => {
  const isAuthenticated = useAppSelector(selectIsAuthenticated);
  const userData = useAppSelector(selectUserData);
  const currentRole = normalizeRole(userData?.role);
  const allowedRoles = requiredRoles.map((role) => normalizeRole(role));

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (!allowedRoles.includes(currentRole)) {
    return fallback ?? <AccessDeniedPage />;
  }

  return <>{children}</>;
};