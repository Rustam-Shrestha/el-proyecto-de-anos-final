import { memo } from "react";
import AdminStats from "@features/admin/components/AdminStats";
import Breadcrumb from "@components/seo/Breadcrumb";
import PageHeader from "@shared/components/PageHeader";

const AdminDashboardPage = () => {
  return (
    <section className="space-y-4">
      <PageHeader
        breadcrumb={<Breadcrumb items={[{ label: "Dashboard", href: "/dashboard" }, { label: "Admin Overview" }]} />}
        title="Admin Overview"
      />

      <AdminStats />
    </section>
  );
};

export default memo(AdminDashboardPage);