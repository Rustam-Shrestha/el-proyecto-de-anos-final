import { Outlet } from "react-router-dom";
import Header from "@components/header";
import Footer from "@components/footer";

export const MainLayout = () => {
  return (
    <div className="layout-shell bg-[var(--bg-color)] text-[var(--text-color)]">
      <Header />
      <main className="layout-main">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
};
