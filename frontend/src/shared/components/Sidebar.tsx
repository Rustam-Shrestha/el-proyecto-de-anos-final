import { useMemo } from "react";
import { NavLink } from "react-router-dom";
import { LayoutDashboard, FileText, Gauge, ShieldCheck, Users, FileBarChart2, UserCircle2, HandCoins, Landmark, ShieldPlus, Briefcase, MessageSquareText, Sparkles, Building2 } from "lucide-react";
import { useAuth } from "@store/hooks";
import { roleKind } from "@shared/utils/roleUtils";
import { useGetMyKYCStatus } from "@features/kyc/api/kycApi";

type SidebarProps = {
  isOpen: boolean;
  onClose: () => void;
};

type MenuItem = {
  label: string;
  path: string;
  icon: typeof LayoutDashboard;
};

// End customer: own KYC, loans, assistant, chat with company staff.
const userItems: MenuItem[] = [
  { label: "Dashboard", path: "/dashboard", icon: LayoutDashboard },
  { label: "KYC Status", path: "/dashboard/kyc-status", icon: ShieldCheck },
  { label: "Financial Profile", path: "/dashboard/portfolio", icon: Briefcase },
  { label: "Financial Assistant", path: "/dashboard/finguard", icon: Sparkles },
  { label: "Messages", path: "/dashboard/chat", icon: MessageSquareText },
  { label: "Apply for Loan", path: "/dashboard/loans/apply", icon: HandCoins },
  { label: "My Loans", path: "/dashboard/loans/status", icon: FileBarChart2 },
  { label: "Profile", path: "/dashboard/profile", icon: UserCircle2 },
];

// Tenant admin: own company only. Platform pages are never shown here.
const adminItems: MenuItem[] = [
  { label: "Admin Dashboard", path: "/dashboard/admin", icon: Gauge },
  { label: "Users Management", path: "/dashboard/users", icon: Users },
  { label: "KYC Applications", path: "/dashboard/kyc", icon: FileText },
  { label: "Loan Applications", path: "/dashboard/loans", icon: Landmark },
  { label: "Reports", path: "/dashboard/reports", icon: FileBarChart2 },
  { label: "Messages", path: "/dashboard/chat", icon: MessageSquareText },
  { label: "Profile", path: "/dashboard/profile", icon: UserCircle2 },
];

// Reviewer: the review queue + staff chat + profile. Nothing else.
const reviewerItems: MenuItem[] = [
  { label: "Loan Applications", path: "/dashboard/loans", icon: Landmark },
  { label: "KYC Applications", path: "/dashboard/kyc", icon: FileText },
  { label: "Messages", path: "/dashboard/chat", icon: MessageSquareText },
  { label: "Profile", path: "/dashboard/profile", icon: UserCircle2 },
];

// Platform owner only: all companies, creation approvals, new companies.
const platformItems: MenuItem[] = [
  { label: "SuperController", path: "/supercontroller", icon: ShieldCheck },
  { label: "Company Requests", path: "/admin/company-requests", icon: Building2 },
  { label: "Profile", path: "/dashboard/profile", icon: UserCircle2 },
];

const sectionOf = (items: MenuItem[], title: string, onClose: () => void, linkClassName: (p: { isActive: boolean }) => string) => (
  <div className="pt-4">
    <p className="px-4 pb-2 text-xs font-semibold uppercase tracking-[0.22em] text-gray-400 ">
      {title}
    </p>
    <div className="space-y-2">
      {items.map((item) => {
        const Icon = item.icon;
        return (
          <NavLink
            key={item.label}
            to={item.path}
            onClick={onClose}
            className={linkClassName}
          >
            <span className="flex h-8 w-8 items-center justify-center rounded-[6px] bg-[#DCFCE7] text-[#15803D]">
              <Icon className="h-4 w-4" />
            </span>
            <span>{item.label}</span>
          </NavLink>
        );
      })}
    </div>
  </div>
);

export const Sidebar = ({ isOpen, onClose }: SidebarProps) => {
  const { userData } = useAuth();
  const kind = useMemo(() => roleKind(userData?.role), [userData?.role]);
  const isSuper = Boolean((userData as any)?.isSuperUser) || kind === "superadmin";
  const showUserItems = !isSuper && kind === "user";
  const showAdminItems = !isSuper && kind === "admin";
  const showReviewerItems = !isSuper && kind === "reviewer";

  const { data: kycStatus } = useGetMyKYCStatus();
  const kycApproved = kycStatus?.status === "APPROVED";
  const showSubmitKyc = useMemo(() => showUserItems && !kycApproved, [showUserItems, kycApproved]);

  const linkClassName = ({ isActive }: { isActive: boolean }) =>
    [
      "flex w-full items-center gap-3 rounded-[8px] px-3 py-2.5 text-left text-sm font-medium transition-colors",
      isActive
        ? "bg-[#DCFCE7] text-[#166534]"
        : "text-[#334155] hover:bg-[#F1F5F9]",
    ].join(" ");

  return (
    <aside
      className={`fixed inset-y-0 left-0 z-50 w-[256px] border-r border-[#E2E8F0] bg-white px-3 py-5 text-[#0F172A] shadow-card transition-transform duration-200 lg:static lg:translate-x-0 lg:shadow-none ${isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}`}
    >
      <div className="mb-6 flex items-center justify-between lg:justify-start">
        <button
          type="button"
          onClick={onClose}
          className="rounded-lg border border-gray-200 px-3 py-1 text-sm text-gray-600 transition-colors hover:bg-gray-100   :bg-gray-800 lg:hidden"
        >
          Close
        </button>
      </div>

      <nav className="space-y-2">
        {isSuper && sectionOf(platformItems, "Platform", onClose, linkClassName)}

        {showUserItems && (
          <>
            {userItems.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.label}
                  to={item.path}
                  onClick={onClose}
                  className={linkClassName}
                >
                  <span className="flex h-8 w-8 items-center justify-center rounded-[6px] bg-[#DCFCE7] text-[#15803D]">
                    <Icon className="h-4 w-4" />
                  </span>
                  <span>{item.label}</span>
                </NavLink>
              );
            })}
            {showSubmitKyc && (
              <NavLink
                to="/dashboard/kyc-submit"
                onClick={onClose}
                className={linkClassName}
              >
                <span className="flex h-8 w-8 items-center justify-center rounded-[6px] bg-[#DCFCE7] text-[#15803D]">
                  <ShieldPlus className="h-4 w-4" />
                </span>
                <span>Submit KYC</span>
              </NavLink>
            )}
          </>
        )}

        {showAdminItems && sectionOf(adminItems, "Company", onClose, linkClassName)}
        {showReviewerItems && sectionOf(reviewerItems, "Review", onClose, linkClassName)}
      </nav>
    </aside>
  );
};
