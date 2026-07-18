import { useMemo, useState } from "react";
import { Menu, LogOut, UserCircle2 } from "lucide-react";
import { useAuth } from "@store/hooks";
import { Button } from "@components/common/Button";
import { resolveAvatarUrl } from "@shared/lib/avatar";

type NavbarProps = {
  onToggleSidebar: () => void;
};

export const Navbar = ({ onToggleSidebar }: NavbarProps) => {
  const [openMenu, setOpenMenu] = useState(false);
  const { userData, logout } = useAuth();

const displayName: string = useMemo(() => {
  return userData?.name || 'User';
}, [userData]);

  const handleLogout = async () => {
    await logout();
    window.location.href = "/login";
  };

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
          <button
            type="button"
            onClick={() => setOpenMenu((value) => !value)}
            className="flex items-center gap-3 rounded-full border border-gray-200 bg-white px-2 py-1 pr-3 text-left text-gray-900 shadow-sm transition-colors hover:bg-gray-50"
          >
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[var(--green-footer)] text-[var(--green-background)]">
              {userData?.avatarUrl ? (
                <img
                  src={typeof userData.avatarUrl === "string" ? resolveAvatarUrl(userData.avatarUrl) || undefined : undefined}
                  alt="User avatar"
                  className="h-full w-full rounded-full object-cover"
                />
              ) : (
                <UserCircle2 className="h-5 w-5" />
              )}
            </span>
            <span className="hidden sm:block">
              <span className="block text-sm font-semibold leading-4">{displayName}</span>
              <span className="block text-xs text-gray-500">Account</span>
            </span>
          </button>

          {openMenu ? (
            <div className="absolute right-0 top-12 w-56 rounded-2xl border border-gray-200 bg-white p-2 shadow-xl">
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
