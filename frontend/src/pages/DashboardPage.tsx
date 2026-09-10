import { memo } from "react";
import { Navigate } from "react-router-dom";
import useAuth from "@hooks/useAuth";
import { normalizeRole } from "@shared/utils/roleUtils";
import { UserDashboard } from "@features/dashboard/pages/UserDashboard";
import { Seo } from "@components/seo/Seo";

const DashboardPage = () => {
  const { userData } = useAuth();
  const role = normalizeRole(userData?.role);

  if (role === "admin") return <Navigate to="/dashboard/admin" replace />;
  if (role === "reviewer") return <Navigate to="/dashboard/loans" replace />;

  return (
    <>
      <Seo path="/dashboard" />
      <UserDashboard />
    </>
  );
};

export default memo(DashboardPage);
