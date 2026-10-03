import { memo, useRef, type RefObject } from "react";
import { Activity, BarChart3, CheckCircle, Clock, FileText, Users, XCircle } from "lucide-react";
import { useAdminStats } from "@features/dashboard/api/dashboardApi";
import PageHeader from "@shared/components/PageHeader";
import Breadcrumb from "@components/seo/Breadcrumb";
import { ExportBar } from "@shared/components/export/ExportBar";

type StatCardProps = {
  label: string;
  value: number;
  icon: typeof Users;
  colorClass: string;
};

const StatCard = ({ label, value, icon: Icon, colorClass }: StatCardProps) => (
  <article className="rounded-3xl border border-gray-200 bg-white p-5 shadow-sm transition-transform duration-200 hover:-translate-y-0.5 hover:shadow-md  ">
    <div className="flex items-start justify-between gap-4">
      <div>
        <p className="text-sm font-medium text-gray-500 ">{label}</p>
        <p className="mt-3 text-3xl font-semibold text-gray-900 ">{value}</p>
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
      <div key={i} className="rounded-3xl border border-gray-200 bg-white p-5 shadow-sm  ">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 space-y-3">
            <div className="h-4 w-24 animate-pulse rounded-full bg-gray-200 " />
            <div className="h-8 w-16 animate-pulse rounded-full bg-gray-200 " />
          </div>
          <div className="h-12 w-12 animate-pulse rounded-2xl bg-gray-200 " />
        </div>
      </div>
    ))}
  </div>
);

const auditColumns = [
  { key: "id", header: "Log ID" },
  { key: "action", header: "Action" },
  { key: "userEmail", header: "User Email", accessor: (r: Record<string, unknown>) => String(r.userEmail || r.userId || "--") },
  { key: "createdAt", header: "Timestamp", accessor: (r: Record<string, unknown>) => r.createdAt ? new Date(String(r.createdAt)).toLocaleString() : "--" },
];

const kycColumns = [
  { key: "id", header: "Application ID" },
  { key: "userEmail", header: "Applicant Email", accessor: (r: Record<string, unknown>) => String(r.userEmail || r.userId || "--") },
  { key: "status", header: "KYC Status" },
  { key: "submittedAt", header: "Submitted Date", accessor: (r: Record<string, unknown>) => r.submittedAt ? new Date(String(r.submittedAt)).toLocaleString() : "--" },
];

const ReportsPage = () => {
  const { data, isLoading, isError, refetch } = useAdminStats();
  const summaryRef = useRef<HTMLDivElement>(null);

  const auditLogs = data?.recentActivity?.auditLogs ?? [];
  const kycApplications = data?.recentActivity?.kycApplications ?? [];

  const summaryData = [
    { metric: "Total Users", count: data?.stats?.users?.total ?? 0 },
    { metric: "Active Users", count: data?.stats?.users?.active ?? 0 },
    { metric: "Pending KYC", count: data?.stats?.kyc?.pending ?? 0 },
    { metric: "Approved KYC", count: data?.stats?.kyc?.approved ?? 0 },
    { metric: "Rejected KYC", count: data?.stats?.kyc?.rejected ?? 0 },
  ];

  return (
    <section className="space-y-4">
      <PageHeader
        breadcrumb={<Breadcrumb items={[{ label: "Dashboard", href: "/dashboard" }, { label: "Reports" }]} />}
        title="Analytics & Reports"
        description="Aggregate platform metrics and performance statistics."
        actions={
          <ExportBar
            data={summaryData as unknown as Record<string, unknown>[]}
            columns={[{ key: "metric", header: "Metric" }, { key: "count", header: "Count" }]}
            filename={`platform-summary-${new Date().toISOString().slice(0, 10)}`}
            chartRef={summaryRef as unknown as RefObject<HTMLElement>}
          />
        }
      />

      {isLoading ? (
        <Skeleton />
      ) : isError || !data?.stats ? (
        <div className="rounded-3xl border border-red-200 bg-white p-6 shadow-sm  ">
          <p className="text-sm font-medium text-red-600 ">Unable to load report data.</p>
          <button
            type="button"
            onClick={() => refetch()}
            className="mt-4 rounded-xl bg-danger-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-danger-700"
          >
            Retry
          </button>
        </div>
      ) : (
        <>
          <div ref={summaryRef} className="grid grid-cols-2 gap-4 lg:grid-cols-3">
            <StatCard label="Total Users" value={data!.stats!.users?.total ?? 0} icon={Users} colorClass="bg-blue-50 text-blue-600  " />
            <StatCard label="Active Users" value={data!.stats!.users?.active ?? 0} icon={Activity} colorClass="bg-cyan-50 text-cyan-600  " />
            <StatCard label="Pending KYC" value={data!.stats!.kyc?.pending ?? 0} icon={FileText} colorClass="bg-amber-50 text-amber-600  " />
            <StatCard label="Approved KYC" value={data!.stats!.kyc?.approved ?? 0} icon={CheckCircle} colorClass="bg-emerald-50 text-emerald-600  " />
            <StatCard label="Rejected KYC" value={data!.stats!.kyc?.rejected ?? 0} icon={XCircle} colorClass="bg-rose-50 text-rose-600  " />
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <section className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
              <div className="mb-4 flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-gray-400" />
                  <h3 className="text-lg font-semibold text-gray-900">Audit Logs ({auditLogs.length})</h3>
                </div>
                {auditLogs.length > 0 && (
                  <ExportBar
                    data={auditLogs as unknown as Record<string, unknown>[]}
                    columns={auditColumns as unknown as Array<{ key: string; header: string; accessor?: (r: Record<string, unknown>) => string | number }>}
                    filename={`audit-logs-${new Date().toISOString().slice(0, 10)}`}
                  />
                )}
              </div>
              {auditLogs.length === 0 ? (
                <p className="text-sm text-gray-500">No audit logs recorded yet.</p>
              ) : (
                <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
                  {auditLogs.map((log) => (
                    <div key={log.id} className="flex items-center justify-between text-sm py-1 border-b border-gray-50 last:border-0">
                      <div>
                        <span className="font-medium text-gray-800">{log.action}</span>
                        <p className="text-xs text-gray-400">{log.userEmail || log.userId || "System"}</p>
                      </div>
                      <span className="text-xs text-gray-400">{log.createdAt ? new Date(log.createdAt).toLocaleString() : ""}</span>
                    </div>
                  ))}
                </div>
              )}
            </section>

            <section className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
              <div className="mb-4 flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <BarChart3 className="h-4 w-4 text-gray-400" />
                  <h3 className="text-lg font-semibold text-gray-900">KYC Submissions ({kycApplications.length})</h3>
                </div>
                {kycApplications.length > 0 && (
                  <ExportBar
                    data={kycApplications as unknown as Record<string, unknown>[]}
                    columns={kycColumns as unknown as Array<{ key: string; header: string; accessor?: (r: Record<string, unknown>) => string | number }>}
                    filename={`kyc-submissions-${new Date().toISOString().slice(0, 10)}`}
                  />
                )}
              </div>
              {kycApplications.length === 0 ? (
                <p className="text-sm text-gray-500">No KYC submissions found.</p>
              ) : (
                <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
                  {kycApplications.map((app) => (
                    <div key={app.id} className="flex items-center justify-between text-sm py-1 border-b border-gray-50 last:border-0">
                      <span className="text-gray-700 font-medium">
                        {app.userEmail ?? app.userId?.slice(0, 8) ?? "Applicant"}
                      </span>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                        app.status === 'APPROVED' ? 'bg-green-100 text-green-800' :
                        app.status === 'REJECTED' ? 'bg-red-100 text-red-800' :
                        'bg-amber-100 text-amber-800'
                      }`}>
                        {app.status}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </div>
        </>
      )}
    </section>
  );
};

export default memo(ReportsPage);
