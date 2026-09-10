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
    <div className="min-h-screen bg-[#F8FAFC] text-[#0F172A]">
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
          <div className="mx-auto w-full max-w-[1440px]">
            {children ?? <Outlet />}
          </div>
        </main>
      </div>
      <Footer />
    </div>
  );
};