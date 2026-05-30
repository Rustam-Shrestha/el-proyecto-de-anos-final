import { useState, type ReactNode } from "react";
import { Outlet } from "react-router-dom";
import { Navbar } from "@shared/components/Navbar";
import { Sidebar } from "@shared/components/Sidebar";

type DashboardLayoutProps = {
  children?: ReactNode;
};

export const DashboardLayout = ({ children }: DashboardLayoutProps) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[var(--bg-color)] text-[var(--text-color)] transition-colors dark:bg-[#10211a] dark:text-gray-100">
      <Navbar onToggleSidebar={() => setIsSidebarOpen((value) => !value)} />
      <div className="flex min-h-[calc(100vh-4rem)]">
        <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
        {isSidebarOpen ? (
          <button
            type="button"
            onClick={() => setIsSidebarOpen(false)}
            className="fixed inset-0 z-40 bg-black/40 lg:hidden"
            aria-label="Close sidebar overlay"
          />
        ) : null}
        <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8">
          <div className="mx-auto w-full max-w-7xl">
            {children ?? <Outlet />}
          </div>
        </main>
      </div>
    </div>
  );
};