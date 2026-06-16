import { memo } from "react";
import { Activity, CheckCircle, FileText, Users, XCircle } from "lucide-react";
import { useAdminStats } from "@features/dashboard/api/dashboardApi";

type StatCardProps = {
  label: string;
  value: number;
  icon: typeof Users;
  colorClass: string;
};

const StatCard = ({ label, value, icon: Icon, colorClass }: StatCardProps) => (
  <article className="rounded-3xl border border-gray-200 bg-white p-5 shadow-sm transition-transform duration-200 hover:-translate-y-0.5 hover:shadow-md dark:border-gray-800 dark:bg-gray-900">
    <div className="flex items-start justify-between gap-4">
      <div>
        <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{label}</p>
        <p className="mt-3 text-3xl font-semibold text-gray-900 dark:text-gray-100">{value}</p>
      </div>
      <span className={`flex h-12 w-12 items-center justify-center rounded-2xl ${colorClass}`}>
        <Icon className="h-5 w-5" />
      </span>
    </div>
  </article>
);

const Skeleton = () => (
  <div className="grid grid-cols-2 gap-4 lg:grid-cols-3">
    {Array.from({ length: 5 }).map((_, i) => (
      <div key={i} className="rounded-3xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-900">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 space-y-3">
            <div className="h-4 w-24 animate-pulse rounded-full bg-gray-200 dark:bg-gray-800" />
            <div className="h-8 w-16 animate-pulse rounded-full bg-gray-200 dark:bg-gray-800" />
            <div className="h-4 w-32 animate-pulse rounded-full bg-gray-200 dark:bg-gray-800" />
          </div>
          <div className="h-12 w-12 animate-pulse rounded-2xl bg-gray-200 dark:bg-gray-800" />
        </div>
      </div>
    ))}
  </div>
);

const AdminDashboardPage = () => {
  const { data, isLoading, isError, refetch } = useAdminStats();

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

      {isLoading ? (
        <Skeleton />
      ) : isError || !data ? (
        <div className="rounded-3xl border border-red-200 bg-white p-6 shadow-sm dark:border-red-900/40 dark:bg-gray-900">
          <p className="text-sm font-medium text-red-600 dark:text-red-400">Unable to load admin statistics.</p>
          <button
            type="button"
            onClick={() => refetch()}
            className="mt-4 rounded-xl bg-red-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-red-700"
          >
            Retry
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-3">
          <StatCard label="Total Users" value={data.stats.users.total} icon={Users} colorClass="bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-300" />
          <StatCard label="Active Users" value={data.stats.users.active} icon={Activity} colorClass="bg-cyan-50 text-cyan-600 dark:bg-cyan-500/10 dark:text-cyan-300" />
          <StatCard label="Pending KYC" value={data.stats.kyc.pending} icon={FileText} colorClass="bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-300" />
          <StatCard label="Approved KYC" value={data.stats.kyc.approved} icon={CheckCircle} colorClass="bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-300" />
          <StatCard label="Rejected KYC" value={data.stats.kyc.rejected} icon={XCircle} colorClass="bg-rose-50 text-rose-600 dark:bg-rose-500/10 dark:text-rose-300" />
        </div>
      )}
    </section>
  );
};

export default memo(AdminDashboardPage);
