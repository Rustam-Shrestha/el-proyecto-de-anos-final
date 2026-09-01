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

  if (!currentRole) {
    return (
      <div className="min-h-screen bg-[var(--bg-color)] p-6">
        <div className="flex min-h-[40vh] items-center justify-center text-sm text-slate-600">
          Loading access permissions...
        </div>
      </div>
    );
  }

  if (!allowedRoles.includes(currentRole)) {
    return fallback ?? <AccessDeniedPage />;
  }

  return <>{children}</>;
};