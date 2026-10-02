import { Navigate } from "react-router-dom";
import DashboardPage from "@pages/DashboardPage";
import { useAppSelector } from "@hooks/reduxHooks";
import { selectUserData } from "@store/slices/authSlice";
import { roleKind } from "@shared/utils/roleUtils";

/** Landing per account type: staff go straight to their workspace. */
export const DashboardIndex = () => {
  const userData = useAppSelector(selectUserData);
  const kind = roleKind(userData?.role);
  const isSuper = Boolean((userData as any)?.isSuperUser) || kind === "superadmin";
  if (isSuper) return <Navigate to="/supercontroller" replace />;
  if (kind === "admin") return <Navigate to="/dashboard/admin" replace />;
  if (kind === "reviewer") return <Navigate to="/dashboard/loans" replace />;
  return <DashboardPage />;
};
