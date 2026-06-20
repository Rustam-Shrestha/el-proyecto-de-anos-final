import { type ReactNode } from "react";
import { Navigate } from "react-router-dom";
import AccessDeniedPage from "@pages/AccessDeniedPage";
import { normalizeRole } from "@shared/utils/roleUtils";
import { useAppSelector } from "@hooks/reduxHooks";
import { selectIsAuthenticated, selectUserData } from "@store/slices/authSlice";

type RoleProtectedRouteProps = {
  children: ReactNode;
  requiredRoles: string[];
  fallback?: ReactNode;
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