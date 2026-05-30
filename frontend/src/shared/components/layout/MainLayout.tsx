import { Outlet } from "react-router-dom";
import Header from "@components/header";
import Footer from "@components/footer";
import LeftSidebar from "@components/common/LeftSidebar";
import HeroSlider from "@components/common/HeroSlider";

export const MainLayout = () => {
  return (
    <div className="layout-shell bg-[var(--bg-color)] text-[var(--text-color)] min-h-screen">
      {/* show header only on small screens */}
      <div className="lg:hidden">
        <Header />
      </div>

      <div className="flex">
        <LeftSidebar />

        <div className="flex-1">
          <div className="px-4 lg:px-8 pt-6">
            <HeroSlider />
            <main className="layout-main">
              <Outlet />
            </main>
          </div>
          <Footer />
        </div>
      </div>
    </div>
  );
};
