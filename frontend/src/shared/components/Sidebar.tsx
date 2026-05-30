import { useMemo } from "react";
import { NavLink } from "react-router-dom";
import { LayoutDashboard, FileText, Gauge, ShieldCheck, Users, ScanSearch, FileBarChart2, UserCircle2 } from "lucide-react";
import useAuth from "@hooks/useAuth";

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
  { label: "Submit KYC", path: "/dashboard/kyc-submit", icon: ScanSearch },
  { label: "KYC Status", path: "/dashboard/kyc-status", icon: ShieldCheck },
  { label: "Profile", path: "/dashboard/profile", icon: UserCircle2 },
];

const adminItems: MenuItem[] = [
  { label: "Admin Dashboard", path: "/dashboard/admin", icon: Gauge },
  { label: "Users Management", path: "/dashboard/users", icon: Users },
  { label: "KYC Management", path: "/dashboard/kyc", icon: FileText },
  { label: "Reports", path: "/dashboard/reports", icon: FileBarChart2 },
];

export const Sidebar = ({ isOpen, onClose }: SidebarProps) => {
  const { userData } = useAuth();
  const isAdmin = useMemo(() => userData?.role?.trim().toUpperCase() === "ADMIN", [userData?.role]);
  const renderedItems = useMemo(() => userItems, []);
  const renderedAdminItems = useMemo(() => (isAdmin ? adminItems : []), [isAdmin]);

  const linkClassName = ({ isActive }: { isActive: boolean }) =>
    [
      "flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-left text-sm font-medium transition-colors",
      isActive
        ? "bg-[var(--green-footer)] text-[var(--green-background)] dark:bg-gray-800 dark:text-gray-100"
        : "text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-800",
    ].join(" ");

  return (
    <aside
      className={`fixed inset-y-0 left-0 z-50 w-72 border-r border-gray-200 bg-white px-4 py-5 text-gray-900 shadow-2xl transition-transform duration-300 dark:border-gray-800 dark:bg-gray-950 dark:text-gray-100 lg:static lg:translate-x-0 lg:shadow-none ${isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}`}
    >
      <div className="mb-6 flex items-center justify-between lg:justify-start">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[var(--green-icon)]">Navigation</p>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Workspace</h2>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="rounded-lg border border-gray-200 px-3 py-1 text-sm text-gray-600 transition-colors hover:bg-gray-100 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800 lg:hidden"
        >
          Close
        </button>
      </div>

      <nav className="space-y-2">
        {renderedItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.label}
              to={item.path}
              onClick={onClose}
              className={linkClassName}
            >
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[var(--green-footer)] text-[var(--green-background)] dark:bg-gray-800 dark:text-gray-100">
                <Icon className="h-4 w-4" />
              </span>
              <span>{item.label}</span>
            </NavLink>
          );
        })}

        {renderedAdminItems.length ? (
          <div className="pt-4">
            <p className="px-4 pb-2 text-xs font-semibold uppercase tracking-[0.22em] text-gray-400 dark:text-gray-500">
              Admin
            </p>
            <div className="space-y-2">
              {renderedAdminItems.map((item) => {
                const Icon = item.icon;
                return (
                  <NavLink
                    key={item.label}
                    to={item.path}
                    onClick={onClose}
                    className={linkClassName}
                  >
                    <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[var(--green-footer)] text-[var(--green-background)] dark:bg-gray-800 dark:text-gray-100">
                      <Icon className="h-4 w-4" />
                    </span>
                    <span>{item.label}</span>
                  </NavLink>
                );
              })}
            </div>
          </div>
        ) : null}
      </nav>
    </aside>
  );
};