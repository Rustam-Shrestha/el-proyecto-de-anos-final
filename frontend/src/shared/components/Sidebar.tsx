import { useMemo } from "react";
import { NavLink } from "react-router-dom";
import { LayoutDashboard, FileText, Gauge, ShieldCheck, Users, FileBarChart2, UserCircle2, HandCoins, Landmark } from "lucide-react";
import { useAuth } from "@store/hooks";
import { normalizeRole } from "@shared/utils/roleUtils";

type SidebarProps = {
  isOpen: boolean;
  onClose: () => void;
};

type MenuItem = {
  label: string;
  path: string;
  icon: typeof LayoutDashboard;
};

const userItems: MenuItem[] = [
  { label: "Dashboard", path: "/dashboard", icon: LayoutDashboard },
  { label: "KYC Status", path: "/dashboard/kyc-status", icon: ShieldCheck },
  { label: "Apply for Loan", path: "/dashboard/loans/apply", icon: HandCoins },
  { label: "My Loans", path: "/dashboard/loans/status", icon: FileBarChart2 },
  { label: "Profile", path: "/dashboard/profile", icon: UserCircle2 },
];

const adminItems: MenuItem[] = [
  { label: "Admin Dashboard", path: "/dashboard/admin", icon: Gauge },
  { label: "Users Management", path: "/dashboard/users", icon: Users },
  { label: "KYC Applications", path: "/dashboard/kyc", icon: FileText },
  { label: "Loan Applications", path: "/dashboard/loans", icon: Landmark },
  { label: "Reports", path: "/dashboard/reports", icon: FileBarChart2 },
  { label: "Profile", path: "/dashboard/profile", icon: UserCircle2 },
];

const reviewerItems: MenuItem[] = [
  { label: "KYC Applications", path: "/dashboard/kyc", icon: FileText },
  { label: "Loan Applications", path: "/dashboard/loans", icon: Landmark },
];

export const Sidebar = ({ isOpen, onClose }: SidebarProps) => {
  const { userData } = useAuth();
  const role = useMemo(() => normalizeRole(userData?.role), [userData?.role]);
  const showUserItems = useMemo(() => role === "user", [role]);
  const showAdminItems = useMemo(() => role === "admin", [role]);
  const showReviewerItems = useMemo(() => role === "reviewer", [role]);

  const linkClassName = ({ isActive }: { isActive: boolean }) =>
    [
      "flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-left text-sm font-medium transition-colors",
      isActive
        ? "bg-[var(--green-footer)] text-[var(--green-background)]"
        : "text-gray-700 hover:bg-gray-100",
    ].join(" ");

  return (
    <aside
      className={`fixed inset-y-0 left-0 z-50 w-72 border-r border-gray-200 bg-white px-4 py-5 text-gray-900 shadow-2xl transition-transform duration-300    lg:static lg:translate-x-0 lg:shadow-none ${isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}`}
    >
      <div className="mb-6 flex items-center justify-between lg:justify-start">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[var(--green-icon)]">Navigation</p>
          <h2 className="text-lg font-semibold text-gray-900 ">Workspace</h2>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="rounded-lg border border-gray-200 px-3 py-1 text-sm text-gray-600 transition-colors hover:bg-gray-100   :bg-gray-800 lg:hidden"
        >
          Close
        </button>
      </div>

      <nav className="space-y-2">
        {showUserItems && userItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.label}
              to={item.path}
              onClick={onClose}
              className={linkClassName}
            >
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[var(--green-footer)] text-[var(--green-background)]  ">
                <Icon className="h-4 w-4" />
              </span>
              <span>{item.label}</span>
            </NavLink>
          );
        })}

        {showAdminItems && (
          <div className="pt-4">
            <p className="px-4 pb-2 text-xs font-semibold uppercase tracking-[0.22em] text-gray-400 ">
              Admin
            </p>
            <div className="space-y-2">
              {adminItems.map((item) => {
                const Icon = item.icon;
                return (
                  <NavLink
                    key={item.label}
                    to={item.path}
                    onClick={onClose}
                    className={linkClassName}
                  >
                    <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[var(--green-footer)] text-[var(--green-background)]  ">
                      <Icon className="h-4 w-4" />
                    </span>
                    <span>{item.label}</span>
                  </NavLink>
                );
              })}
            </div>
          </div>
        )}

        {showReviewerItems && (
          <div className="pt-4">
            <p className="px-4 pb-2 text-xs font-semibold uppercase tracking-[0.22em] text-gray-400 ">
              Reviewer
            </p>
            <div className="space-y-2">
              {reviewerItems.map((item) => {
                const Icon = item.icon;
                return (
                  <NavLink
                    key={item.label}
                    to={item.path}
                    onClick={onClose}
                    className={linkClassName}
                  >
                    <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[var(--green-footer)] text-[var(--green-background)]  ">
                      <Icon className="h-4 w-4" />
                    </span>
                    <span>{item.label}</span>
                  </NavLink>
                );
              })}
            </div>
          </div>
        )}
      </nav>
    </aside>
  );
};