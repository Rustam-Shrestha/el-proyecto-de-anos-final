import { useState, type ReactNode } from "react";
import { Outlet } from "react-router-dom";
import { Navbar } from "@shared/components/Navbar";
import { Sidebar } from "@shared/components/Sidebar";
import Footer from "@components/footer";

type DashboardLayoutProps = {
  children?: ReactNode;
};

export const DashboardLayout = ({ children }: DashboardLayoutProps) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <div className="flex min-h-screen flex-col bg-[#F8FAFC] text-[#0F172A]">
      <Navbar onToggleSidebar={() => setIsSidebarOpen((value) => !value)} />
      <div className="flex flex-1 min-h-0 overflow-hidden">
        <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
        {isSidebarOpen ? (
          <button
            type="button"
            onClick={() => setIsSidebarOpen(false)}
            className="fixed inset-0 z-40 bg-black/40 lg:hidden"
            aria-label="Close sidebar overlay"
          />
        ) : null}
        <main className="flex flex-1 min-h-0 flex-col overflow-hidden px-4 py-6 sm:px-6 lg:px-8">
          <div className="mx-auto flex w-full max-w-[1440px] flex-1 min-h-0 flex-col overflow-hidden">
            {children ?? <Outlet />}
          </div>
        </main>
      </div>
      <Footer />
    </div>
  );
};