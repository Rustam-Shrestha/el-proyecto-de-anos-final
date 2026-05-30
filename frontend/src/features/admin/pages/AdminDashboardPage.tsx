import { memo } from "react";
import AdminStats from "@features/admin/components/AdminStats";

const AdminDashboardPage = () => {
  return (
    <section className="space-y-6">
      <div className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900">
        <p className="text-sm font-semibold uppercase tracking-[0.22em] text-[var(--green-icon)]">
          Admin Overview
        </p>
        <h2 className="mt-2 text-3xl font-semibold text-gray-900 dark:text-gray-100">Admin Dashboard</h2>
        <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
          Review platform health, user activity, and KYC performance.
        </p>
      </div>

      <AdminStats />
    </section>
  );
};

export default memo(AdminDashboardPage);