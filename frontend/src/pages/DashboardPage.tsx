import { memo } from "react";
import { Navigate } from "react-router-dom";
import useAuth from "@hooks/useAuth";
import { normalizeRole } from "@shared/utils/roleUtils";
import { UserDashboard } from "@features/dashboard/pages/UserDashboard";

const DashboardPage = () => {
  const { userData } = useAuth();
  const role = normalizeRole(userData?.role);

  if (role === "admin") return <Navigate to="/dashboard/admin" replace />;
  if (role === "reviewer") return <Navigate to="/dashboard/loans" replace />;

  return <UserDashboard />;
};

export default memo(DashboardPage);
