import { useMemo, useState } from "react";
import { Menu, LogOut } from "lucide-react";
import { Link } from "react-router-dom";
import { useAuth } from "@store/hooks";
import { Button } from "@components/common/Button";
import { resolveAvatarUrl } from "@shared/lib/avatar";
import { NotificationBell } from "@features/notifications/components/NotificationBell";
import { MessageIcon } from "../../assets/data/icons";
import { normalizeRole } from "@shared/utils/roleUtils";

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

  const roleLabel = useMemo(() => {
    const role = userData?.role;
    if (!role) return "Account";
    return role.charAt(0) + role.slice(1).toLowerCase();
  }, [userData?.role]);

  const normalizedRole = useMemo(() => normalizeRole(userData?.role), [userData?.role]);
  const isPrivileged = normalizedRole === "admin" || normalizedRole === "reviewer";
  const tenantName = (userData as any)?.tenant?.name || (userData as any)?.tenantName || null;
  const tenantLogo = (userData as any)?.tenant?.logoUrl || null;

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
          {tenantName ? <span className="hidden md:inline-flex items-center gap-1 rounded-full border bg-green-50 px-2 py-1 text-xs font-medium text-green-700">{tenantLogo ? <img src={tenantLogo} alt={tenantName} className="h-5 w-5 rounded object-cover" onError={(e)=>{(e.currentTarget as HTMLImageElement).style.display='none'}}/> : null}{tenantName}</span> : <Link to="/company" className="hidden md:inline-flex rounded-full border bg-amber-50 px-2 py-1 text-xs font-medium text-amber-700">No Company – Setup</Link>}
          <Link
            to="/dashboard/chat"
            aria-label="Messages"
            className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-[#E2E8F0] bg-white text-[#334155] hover:bg-[#F1F5F9] transition-colors"
          >
            <MessageIcon />
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
              <span className="block text-xs text-gray-500">{roleLabel}</span>
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
