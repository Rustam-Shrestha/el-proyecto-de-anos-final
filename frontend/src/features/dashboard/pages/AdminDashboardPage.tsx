import { memo, useEffect, useRef } from "react";
import { Activity, CheckCircle, FileText, Users, XCircle } from "lucide-react";
import Highcharts from "highcharts";
import { useAdminStats } from "@features/dashboard/api/dashboardApi";
import Card from "@shared/components/Card";
import PageHeader from "@shared/components/PageHeader";
import { Button } from "@shared/components/Button";
import { ExportBar } from "@shared/components/export/ExportBar";
import ErrorState from "@shared/components/ErrorState";

const KycPieChart = ({ data }: { data: Array<{ name: string; y: number; color: string }> }) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    if (!containerRef.current) return;
    const total = data.reduce((s, d) => s + d.y, 0);
    const chart = Highcharts.chart(containerRef.current, {
      chart: { type: "pie", height: 300, backgroundColor: "transparent", style: { fontFamily: "Inter, sans-serif" } },
      title: { text: undefined },
      credits: { enabled: false },
      tooltip: { pointFormat: "<b>{point.y}</b> ({point.percentage:.1f}%)", backgroundColor: "#FFFFFF", borderColor: "#E2E8F0", style: { color: "#0F172A" } },
      plotOptions: {
        pie: {
          innerSize: "58%",
          borderWidth: 2,
          borderColor: "#FFFFFF",
          allowPointSelect: true,
          cursor: "pointer",
          dataLabels: {
            enabled: true,
            format: "<b>{point.name}</b>: {point.y}",
            style: { color: "#334155", fontSize: "12px", fontWeight: "600", textOutline: "none" },
            distance: 18,
          },
          showInLegend: true,
        },
      },
      legend: { layout: "horizontal", align: "center", verticalAlign: "bottom", itemStyle: { color: "#334155", fontWeight: "500", fontSize: "12px" } },
      series: [{ type: "pie", name: "Applications", colorByPoint: true, data } as unknown as Highcharts.SeriesPieOptions],
    });
    // center total label
    if (total > 0 && containerRef.current) {
      const center = document.createElement("div");
      center.style.position = "absolute";
      center.style.top = "50%";
      center.style.left = "50%";
      center.style.transform = "translate(-50%, -58%)";
      center.style.textAlign = "center";
      center.style.pointerEvents = "none";
      center.innerHTML = `<div style="font-size:22px;font-weight:700;color:#0F172A;line-height:1">${total}</div><div style="font-size:11px;font-weight:600;letter-spacing:0.08em;color:#64748B;text-transform:uppercase">Total</div>`;
      containerRef.current.style.position = "relative";
      containerRef.current.appendChild(center);
    }
    return () => chart.destroy();
  }, [data]);
  return <div ref={containerRef} className="w-full" />;
};

type StatCardProps = { label: string; value: number; icon: typeof Users; colorClass: string; hint?: string };

const StatCard = ({ label, value, icon: Icon, colorClass, hint }: StatCardProps) => (
  <Card className="flex flex-col gap-3">
    <div className="flex items-start justify-between gap-4">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.08em] text-[#64748B]">{label}</p>
        <p className="mt-2 text-[24px] font-semibold text-[#0F172A] tabular-nums">{value}</p>
        {hint ? <p className="mt-1 text-xs text-[#64748B]">{hint}</p> : null}
      </div>
      <span className={`flex h-10 w-10 items-center justify-center rounded-[8px] ${colorClass}`}>
        <Icon className="h-5 w-5" />
      </span>
    </div>
  </Card>
);

const Skeleton = () => (
  <div className="grid grid-cols-2 gap-4 lg:grid-cols-3">
    {Array.from({ length: 5 }).map((_, i) => (
      <Card key={i} className="animate-pulse">
        <div className="h-4 w-24 rounded bg-[#E2E8F0]" />
        <div className="mt-3 h-8 w-16 rounded bg-[#E2E8F0]" />
      </Card>
    ))}
  </div>
);

const AdminDashboardPage = () => {
  const { data, isLoading, isError, refetch } = useAdminStats();
  const kycTotal = (data?.stats?.kyc?.approved ?? 0) + (data?.stats?.kyc?.pending ?? 0) + (data?.stats?.kyc?.rejected ?? 0);
  return (
    <section className="space-y-6">
      <Card>
        <PageHeader label="Admin Overview" title="Admin Dashboard" description="Review platform health, user activity, and KYC performance." />
      </Card>

      {isLoading ? (
        <Skeleton />
      ) : isError || !data?.stats ? (
        <ErrorState message="Unable to load admin statistics." onRetry={() => refetch()} />
      ) : (
        <>
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-3">
            <StatCard label="Total Users" value={data.stats.users?.total ?? 0} icon={Users} colorClass="bg-[#DCFCE7] text-[#15803D]" hint="Registered accounts" />
            <StatCard label="Active Users" value={data.stats.users?.active ?? 0} icon={Activity} colorClass="bg-[#E0F2FE] text-[#0284C7]" hint="Verified & active" />
            <StatCard label="Pending KYC" value={data.stats.kyc?.pending ?? 0} icon={FileText} colorClass="bg-[#FEF3C7] text-[#D97706]" hint="Awaiting review" />
            <StatCard label="Approved KYC" value={data.stats.kyc?.approved ?? 0} icon={CheckCircle} colorClass="bg-[#DCFCE7] text-[#16A34A]" hint="Verified" />
            <StatCard label="Rejected KYC" value={data.stats.kyc?.rejected ?? 0} icon={XCircle} colorClass="bg-[#FEE2E2] text-[#DC2626]" hint="Needs action" />
          </div>

          <div className="grid gap-4 lg:grid-cols-3">
            <Card className="lg:col-span-2">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h3 className="text-sm font-semibold text-[#0F172A]">KYC Application Status</h3>
                  <p className="mt-1 text-sm text-[#64748B]">Distribution of KYC applications by current status.</p>
                </div>
                <div className="flex items-center gap-2">
                  <ExportBar data={[{ name: 'Approved', value: data.stats.kyc?.approved ?? 0 }, { name: 'Pending', value: data.stats.kyc?.pending ?? 0 }, { name: 'Rejected', value: data.stats.kyc?.rejected ?? 0 }]} columns={[{ key: 'name', header: 'Status' }, { key: 'value', header: 'Count' }]} filename={`kyc-status-${new Date().toISOString().slice(0,10)}`} />
                  <span className="rounded-full border border-[#E2E8F0] bg-[#F8FAFC] px-2.5 py-1 text-xs font-medium text-[#334155]">{kycTotal} total</span>
                </div>
              </div>
              <div className="mt-4">
                <KycPieChart
                  data={[
                    { name: "Approved", y: data.stats.kyc?.approved ?? 0, color: "#16A34A" },
                    { name: "Pending", y: data.stats.kyc?.pending ?? 0, color: "#D97706" },
                    { name: "Rejected", y: data.stats.kyc?.rejected ?? 0, color: "#DC2626" },
                  ]}
                />
              </div>
              <div className="mt-4 grid grid-cols-3 gap-2 border-t border-[#E2E8F0] pt-4">
                {[
                  { label: "Approved", value: data.stats.kyc?.approved ?? 0, dot: "bg-[#16A34A]" },
                  { label: "Pending", value: data.stats.kyc?.pending ?? 0, dot: "bg-[#D97706]" },
                  { label: "Rejected", value: data.stats.kyc?.rejected ?? 0, dot: "bg-[#DC2626]" },
                ].map((s) => (
                  <div key={s.label} className="flex items-center gap-2 rounded-[6px] bg-[#F8FAFC] px-3 py-2">
                    <span className={`h-2.5 w-2.5 rounded-full ${s.dot}`} />
                    <span className="text-xs font-medium text-[#334155]">{s.label}</span>
                    <span className="ml-auto text-sm font-semibold text-[#0F172A]">{s.value}</span>
                  </div>
                ))}
              </div>
            </Card>

            <Card>
              <h3 className="text-sm font-semibold text-[#0F172A]">At a glance</h3>
              <p className="mt-1 text-xs text-[#64748B]">Key ratios</p>
              <dl className="mt-4 space-y-3">
                <div className="flex items-center justify-between rounded-[6px] border border-[#E2E8F0] px-3 py-3">
                  <dt className="text-sm text-[#64748B]">Approval rate</dt>
                  <dd className="text-sm font-semibold text-[#0F172A]">{kycTotal ? Math.round(((data.stats.kyc?.approved ?? 0) / kycTotal) * 100) : 0}%</dd>
                </div>
                <div className="flex items-center justify-between rounded-[6px] border border-[#E2E8F0] px-3 py-3">
                  <dt className="text-sm text-[#64748B]">Pending share</dt>
                  <dd className="text-sm font-semibold text-[#D97706]">{kycTotal ? Math.round(((data.stats.kyc?.pending ?? 0) / kycTotal) * 100) : 0}%</dd>
                </div>
                <div className="flex items-center justify-between rounded-[6px] border border-[#FECACA] bg-[#FEF2F2] px-3 py-3">
                  <dt className="text-sm text-[#991B1B]">Rejection share</dt>
                  <dd className="text-sm font-semibold text-[#DC2626]">{kycTotal ? Math.round(((data.stats.kyc?.rejected ?? 0) / kycTotal) * 100) : 0}%</dd>
                </div>
              </dl>
              <Button variant="secondary" size="sm" className="mt-4 w-full" onClick={() => refetch()}>Refresh</Button>
            </Card>
          </div>
        </>
      )}
    </section>
  );
};

export default memo(AdminDashboardPage);
