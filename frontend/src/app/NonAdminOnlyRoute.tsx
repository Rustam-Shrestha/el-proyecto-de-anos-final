import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAppSelector } from "@hooks/reduxHooks";

const normalizeRole = (role?: string | string[] | null): string => {
  if (Array.isArray(role)) return role[0]?.trim().toLowerCase() ?? "";
  if (typeof role !== "string") return "";
  return role.trim().toLowerCase();
};

const getRoleFromLocalStorage = () => {
  try {
    const rawUser = localStorage.getItem("userData");
    if (rawUser) {
      const parsed = JSON.parse(rawUser) as { role?: string };
      if (parsed?.role) {
        return parsed.role;
      }
    }

    const rawAuth = localStorage.getItem("userAuth");
    if (!rawAuth) {
      return null;
    }

    const parsedAuth = JSON.parse(rawAuth) as {
      user?: { role?: string };
    };

    return parsedAuth?.user?.role ?? null;
  } catch {
    return null;
  }
};

export const NonAdminOnlyRoute = () => {
  const location = useLocation();
  const authUserRole = useAppSelector((state) => state.auth.user?.role);
  const role = normalizeRole(authUserRole ?? getRoleFromLocalStorage());
  const token = localStorage.getItem("accessToken");

  if (!token) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  if (role === "admin") {
    return <Navigate to="/dashboard/kyc" replace state={{ from: location.pathname }} />;
  }

  return <Outlet />;
};
