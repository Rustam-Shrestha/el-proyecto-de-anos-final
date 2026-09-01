import { useMemo, useState } from "react";
import { Menu, LogOut } from "lucide-react";
import { useAuth } from "@store/hooks";
import { Button } from "@components/common/Button";
import { resolveAvatarUrl } from "@shared/lib/avatar";
import { NotificationBell } from "@features/notifications/components/NotificationBell";

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

  return (
    <header className="sticky top-0 z-40 border-b border-gray-200 bg-white/90 backdrop-blur">
      <div className="flex items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onToggleSidebar}
            className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-gray-200 text-gray-700 transition-colors hover:bg-gray-100 lg:hidden"
            aria-label="Toggle sidebar"
          >
            <Menu className="h-5 w-5" />
          </button>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[var(--green-icon)]">Finguard</p>
            <h1 className="text-base font-semibold text-gray-900">Dashboard</h1>
          </div>
        </div>

        <div className="relative flex items-center gap-3">
          <NotificationBell />
          <button
            type="button"
            onClick={() => setOpenMenu((value) => !value)}
            className="flex items-center gap-3 rounded-full border border-gray-200 bg-white px-2 py-1 pr-3 text-left text-gray-900 shadow-sm transition-colors hover:bg-gray-50"
          >
            <span className={`flex h-9 w-9 items-center justify-center rounded-full text-sm font-semibold text-white ${avatarBg}`}>
              {userData?.avatarUrl ? (
                <img
                  src={typeof userData.avatarUrl === "string" ? resolveAvatarUrl(userData.avatarUrl) || undefined : undefined}
                  alt="User avatar"
                  className="h-full w-full rounded-full object-cover"
                />
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
            <div className="absolute right-0 top-12 w-56 rounded-2xl border border-gray-200 bg-white p-2 shadow-xl">
              <div className="px-3 py-2">
                <p className="text-sm font-semibold text-gray-900">{displayName}</p>
                <p className="text-xs text-gray-500">{userData?.email || "Signed in user"}</p>
              </div>
              <div className="my-2 h-px bg-gray-100" />
              <a href="/dashboard/chat" className="flex w-full items-center justify-start rounded-lg px-3 py-2 text-sm text-gray-700 transition-colors hover:bg-gray-100">
                Messages
              </a>
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
