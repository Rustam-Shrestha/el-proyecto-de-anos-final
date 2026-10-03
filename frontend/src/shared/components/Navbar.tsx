import { useMemo, useState } from "react";
import { Menu, LogOut, MessageSquare } from "lucide-react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@store/hooks";
import { Button } from "@components/common/Button";
import { resolveAvatarUrl } from "@shared/lib/avatar";
import { NotificationBell } from "@features/notifications/components/NotificationBell";
import { roleKind, roleLabel } from "@shared/utils/roleUtils";
import { companyApi } from "@features/company/api/companyApi";

type NavbarProps = {
  onToggleSidebar: () => void;
};

export const Navbar = ({ onToggleSidebar }: NavbarProps) => {
  const [openMenu, setOpenMenu] = useState(false);
  const { userData, logout } = useAuth();

  const displayName: string = useMemo(() => {
    const rawName =
      userData?.fullName ||
      userData?.name ||
      userData?.firstName ||
      userData?.email?.split('@')[0] ||
      'User';

    return rawName.trim() || 'User';
  }, [userData]);

  const handleLogout = async () => {
    await logout();
    window.location.href = "/login";
  };

  const initials = useMemo(() => {
    const name = displayName.trim();
    if (!name) return "U";
    const parts = name.split(/\s+/);
    const first = parts[0]?.[0] ?? "";
    const last = parts.length > 1 ? parts[parts.length - 1][0] : "";
    return (first + last).toUpperCase();
  }, [displayName]);

  const avatarBg = useMemo(() => {
    const colors = [
      "bg-red-500", "bg-blue-500", "bg-green-500", "bg-purple-500",
      "bg-yellow-500", "bg-pink-500", "bg-indigo-500", "bg-cyan-500",
    ];
    const index = (displayName.charCodeAt(0) || 0) % colors.length;
    return colors[index];
  }, [displayName]);

  // Explicit role badge: Super Admin / Company Admin / Reviewer / Customer
  const badge = useMemo(() => (userData?.role ? roleLabel(userData.role) : "Account"), [userData?.role]);

  const kind = useMemo(() => roleKind(userData?.role), [userData?.role]);
  const isPrivileged = kind === "admin" || kind === "reviewer" || kind === "superadmin";
  const isSuper = kind === "superadmin";
  // Company emblem: always fresh from /company/me so members see slug+logo,
  // never a stale "No Company" label after joining.
  const tenantQuery = useQuery({
    queryKey: ["company", "me"],
    queryFn: () => companyApi.meTenant(),
    staleTime: 60 * 1000,
    retry: false,
  });
  const tenant = (tenantQuery.data as any) || (userData as any)?.tenant || null;
  const inCompany = Boolean(tenant && tenant.slug && tenant.slug !== "default");
  const tenantName = inCompany ? tenant.name : null;
  const tenantSlug = inCompany ? tenant.slug : null;
  const tenantLogo = inCompany ? (tenant.logoUrl || tenant.logo) : null;
  const tenantInitials = useMemo(() => {
    if (!tenantName) return "CO";
    const parts = tenantName.trim().split(/\s+/);
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }, [tenantName]);

  return (
    <header className="sticky top-0 z-40 flex h-16 shrink-0 items-center border-b border-[#E2E8F0] bg-white/90 backdrop-blur">
      <div className="flex w-full items-center justify-between px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onToggleSidebar}
            className="inline-flex h-10 w-10 items-center justify-center rounded-[6px] border border-[#E2E8F0] text-[#334155] transition-colors hover:bg-[#F1F5F9] lg:hidden"
            aria-label="Toggle sidebar"
          >
            <Menu className="h-5 w-5" />
          </button>
          <Link to="/dashboard" className="flex items-center gap-3">
            <img
              src="/images/logo512.png"
              alt="FinGuard logo"
              className="h-10 w-10 rounded-[6px] object-cover p-0"
              onError={(e) => {
                (e.currentTarget as HTMLImageElement).src = "/logo512.png";
              }}
            />
            <div className="hidden sm:block"></div>
            <span className="sm:hidden text-sm font-semibold text-[#0F172A]">FinGuard</span>
          </Link>
        </div>

        <div className="relative flex items-center gap-2">
          {tenantName ? (
            <Link
              to="/company"
              title={`Company: ${tenantName} (@${tenantSlug})`}
              className="hidden md:inline-flex items-center gap-1.5 rounded-full border border-green-200 bg-[var(--primary-soft)] px-2.5 py-1 text-xs font-semibold text-[var(--primary)] hover:bg-green-100 transition-colors"
            >
              {tenantLogo && !tenantLogo.includes("logo512") ? (
                <img
                  src={tenantLogo}
                  alt={tenantName}
                  className="h-5 w-5 rounded-full object-cover shrink-0"
                  onError={(e) => {
                    const target = e.currentTarget;
                    target.style.display = "none";
                    if (target.nextElementSibling) {
                      (target.nextElementSibling as HTMLElement).style.display = "flex";
                    }
                  }}
                />
              ) : null}
              <span
                className="flex h-5 w-5 items-center justify-center rounded-full bg-[var(--primary)] text-[10px] font-bold text-white shrink-0"
                style={{ display: tenantLogo && !tenantLogo.includes("logo512") ? "none" : "flex" }}
              >
                {tenantInitials}
              </span>
              <span>{tenantName}</span>
              <span className="text-green-600 font-mono text-[11px]">@{tenantSlug}</span>
            </Link>
          ) : isSuper ? (
            <Link
              to="/dashboard/admin/company-requests"
              className="hidden md:inline-flex items-center gap-1.5 rounded-full border border-blue-200 bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-700 hover:bg-blue-100 transition-colors"
            >
              Platform Super Admin
            </Link>
          ) : (
            <Link to="/company" className="hidden md:inline-flex rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-700 hover:bg-amber-100 transition-colors">
              Setup Company
            </Link>
          )}

          <Link
            to="/dashboard/chat"
            aria-label="Messages"
            className="relative inline-flex h-9 w-9 items-center justify-center rounded-full border border-[#E2E8F0] bg-white text-[#334155] hover:bg-[#F1F5F9] transition-colors"
          >
            <MessageSquare className="h-4 w-4" />
            <span
              className="absolute top-1 right-1 h-2.5 w-2.5 rounded-full ring-2 ring-white"
              style={{ backgroundColor: "var(--danger, #DC2626)" }}
            />
          </Link>
          <NotificationBell />
          <button
            type="button"
            onClick={() => setOpenMenu((value) => !value)}
            className="flex items-center gap-3 rounded-full border border-[#E2E8F0] bg-white px-2 py-1 pr-3 text-left text-[#0F172A] shadow-subtle transition-colors hover:bg-[#F8FAFC]"
          >
            <span className={`flex h-9 w-9 items-center justify-center overflow-hidden rounded-full text-sm font-semibold text-white ${isPrivileged && !userData?.avatarUrl ? "bg-white border border-[#E2E8F0]" : avatarBg}`}>
              {userData?.avatarUrl ? (
                <img
                  src={typeof userData.avatarUrl === "string" ? resolveAvatarUrl(userData.avatarUrl) || undefined : undefined}
                  alt="User avatar"
                  className="h-full w-full rounded-full object-cover"
                />
              ) : isPrivileged ? (
                <img src="/images/client.webp" alt="Admin avatar" className="h-full w-full object-cover" />
              ) : (
                initials
              )}
            </span>
            <span className="hidden sm:block">
              <span className="block text-sm font-semibold leading-4">{displayName}</span>
              <span className="block text-xs text-gray-500">{badge}</span>
            </span>
          </button>

          {openMenu ? (
            <div className="absolute right-0 top-12 w-56 rounded-[8px] border border-[#E2E8F0] bg-white p-2 shadow-modal">
              <div className="px-3 py-2">
                <p className="text-sm font-semibold text-gray-900">{displayName}</p>
                <p className="text-xs text-gray-500">{userData?.email || "Signed in user"}</p>
              </div>
              <div className="my-2 h-px bg-gray-100" />
              <Button variant="ghost" className="w-full justify-start px-3 py-2 text-sm text-gray-700" onClick={handleLogout}>
                <LogOut className="mr-2 h-4 w-4" />
                Logout
              </Button>
            </div>
          ) : null}
        </div>
      </div>
    </header>
  );
};
