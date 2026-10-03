import { type ReactNode } from "react";
import { Navigate } from "react-router-dom";
import UnauthorizedPage from "@pages/UnauthorizedPage";
import { normalizeRole, roleKind } from "@shared/utils/roleUtils";
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
  const kind = roleKind(userData?.role);
  const isSuper = Boolean((userData as any)?.isSuperUser) || kind === "superadmin";
  const allowedRoles = requiredRoles.map((role) => normalizeRole(role));
  const allowedKinds = requiredRoles.map((role) => roleKind(role));

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

  // Platform owner passes every gate. Otherwise match by kind so
  // company_admin/customer aliases work, not just exact role strings.
  if (!isSuper && !allowedRoles.includes(currentRole) && !allowedKinds.includes(kind)) {
    return fallback ?? <UnauthorizedPage />;
  }

  return <>{children}</>;
};
