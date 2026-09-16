import { useState, useRef, type RefObject } from 'react';
import { Building2, Users, CreditCard, Activity, Plus, Shield } from 'lucide-react';
import { MetricCard } from '../components/MetricCard';
import { TenantList } from '../components/TenantList';
import { TimeSeriesChart } from '../components/TimeSeriesChart';
import { UsageGauge } from '../components/UsageGauge';
import { FeatureTogglePanel } from '../components/FeatureTogglePanel';
import { ExportBar } from '@shared/components/export/ExportBar';
import { useSupercontrollerMetrics, useSupercontrollerTenants, useSupercontrollerTimeSeries, useTenantOverview, useCreateTenant, useUpdateTenantStatus, type TenantDto } from '../api/supercontrollerApi';

export default function SupercontrollerDashboardPage() {
  const { data: metrics, isLoading: metricsLoading } = useSupercontrollerMetrics();
  const { data: tenantsRes, isLoading: tenantsLoading } = useSupercontrollerTenants(1, 20);
  const { data: series, isLoading: seriesLoading } = useSupercontrollerTimeSeries(30);
  const [selected, setSelected] = useState<TenantDto | null>(null);
  const { data: overview } = useTenantOverview(selected?.id ?? null);
  const createMut = useCreateTenant();
  const statusMut = useUpdateTenantStatus();
  const chartWrapRef = useRef<HTMLDivElement>(null);

  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ slug: '', name: '', companyType: 'fintech', subscriptionTier: 'professional' as const });

  const tenants = tenantsRes?.data ?? [];
  const tenantColumns = [
    { key: 'slug', header: 'Slug' },
    { key: 'name', header: 'Name' },
    { key: 'status', header: 'Status' },
    { key: 'subscriptionTier', header: 'Tier', accessor: (r: TenantDto) => r.subscriptionTier ?? '' },
    { key: 'usageUsers', header: 'Users', accessor: (r: TenantDto) => `${r.usageUsers}/${r.maxUsers}` },
    { key: 'usageLoans', header: 'Loans', accessor: (r: TenantDto) => `${r.usageLoans}/${r.maxLoans}` },
  ] as const;

  const handleCreate = async () => {
    if (!form.slug || !form.name) return;
    await createMut.mutateAsync({ slug: form.slug, name: form.name, companyType: form.companyType, subscriptionTier: form.subscriptionTier });
    setShowCreate(false); setForm({ slug: '', name: '', companyType: 'fintech', subscriptionTier: 'professional' });
  };

  return (
    <div className="min-h-screen bg-[#f7f9fb] p-4 lg:p-6">
      <div className="max-w-[1440px] mx-auto flex flex-col gap-5">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#15803D] flex items-center justify-center text-white"><Shield className="w-5 h-5" /></div>
            <div>
              <h1 className="text-xl font-bold text-slate-800">SuperController</h1>
              <p className="text-xs text-slate-500">Manage tenants, features, and platform health — live data</p>
            </div>
          </div>
          <button onClick={() => setShowCreate(true)} className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#15803D] text-white text-sm font-medium hover:bg-[#166534]"><Plus className="w-4 h-4" /> Create Tenant</button>
        </div>

        {/* Metrics */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          <MetricCard title="Total tenants" value={metricsLoading ? '—' : metrics?.totalTenants ?? 0} subtitle="Across all tiers" icon={<Building2 className="w-5 h-5" />} accent="#15803D" />
          <MetricCard title="Active tenants" value={metricsLoading ? '—' : metrics?.activeTenants ?? 0} subtitle="Currently serving" icon={<Activity className="w-5 h-5" />} accent="#0ea5e9" />
          <MetricCard title="Total users" value={metricsLoading ? '—' : (metrics?.totalUsers ?? 0).toLocaleString()} subtitle="All tenants" icon={<Users className="w-5 h-5" />} accent="#6366f1" />
          <MetricCard title="Total loans" value={metricsLoading ? '—' : (metrics?.totalLoans ?? 0).toLocaleString()} subtitle="Under management" icon={<CreditCard className="w-5 h-5" />} accent="#f59e0b" />
        </div>

        {/* Charts */}
        <div ref={chartWrapRef} className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          <div className="lg:col-span-8"><TimeSeriesChart data={series} isLoading={seriesLoading} /></div>
          <div className="lg:col-span-4">
            {selected && overview ? (
              <UsageGauge usersPct={overview.usagePercentage.users} loansPct={overview.usagePercentage.loans} title={`${selected.slug} capacity`} />
            ) : (
              <UsageGauge usersPct={tenants.length ? Math.round((tenants.reduce((a, t) => a + t.usageUsers, 0) / Math.max(1, tenants.reduce((a, t) => a + t.maxUsers, 0))) * 100) : 0} loansPct={tenants.length ? Math.round((tenants.reduce((a, t) => a + t.usageLoans, 0) / Math.max(1, tenants.reduce((a, t) => a + t.maxLoans, 0))) * 100) : 0} title="Platform capacity" />
            )}
          </div>
        </div>

        {/* Tenants */}
        <div className="bg-white rounded-xl border border-[#eceef2] shadow-sm p-5">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
            <h2 className="text-sm font-semibold text-slate-800">Tenants — {tenantsRes?.pagination.total ?? tenants.length} total</h2>
            <ExportBar data={tenants as unknown as Record<string, unknown>[]} columns={tenantColumns as unknown as Array<{ key: string; header: string; accessor?: (r: Record<string, unknown>) => string | number }>} filename={`tenants-${new Date().toISOString().slice(0,10)}`} chartRef={chartWrapRef as unknown as RefObject<HTMLElement>} />
          </div>
          <TenantList tenants={tenants} isLoading={tenantsLoading} onStatusChange={(id, s) => statusMut.mutate({ id, status: s })} onSelect={setSelected} />
        </div>

        {/* Tenant detail drawer */}
        {selected && overview && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            <div className="bg-white rounded-xl border border-[#eceef2] p-5 shadow-sm">
              <h3 className="text-sm font-semibold text-slate-800 mb-2">{selected.name} — overview</h3>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="p-3 rounded-lg bg-slate-50"><p className="text-xs text-slate-500">Users live</p><p className="font-bold text-slate-800">{overview.live.users} / {selected.maxUsers}</p></div>
                <div className="p-3 rounded-lg bg-slate-50"><p className="text-xs text-slate-500">Loans live</p><p className="font-bold text-slate-800">{overview.live.loans} / {selected.maxLoans}</p></div>
                <div className="p-3 rounded-lg bg-slate-50"><p className="text-xs text-slate-500">Tier</p><p className="font-semibold" style={{ color: '#15803D' }}>{selected.subscriptionTier}</p></div>
                <div className="p-3 rounded-lg bg-slate-50"><p className="text-xs text-slate-500">Company type</p><p className="font-semibold text-slate-700">{selected.companyType}</p></div>
              </div>
              <button onClick={() => setSelected(null)} className="mt-4 text-xs text-slate-500 hover:text-slate-700">Close</button>
            </div>
            <FeatureTogglePanel tenantId={selected.id} tenantName={selected.name} />
          </div>
        )}

        {/* Create modal */}
        {showCreate && (
          <div className="fixed inset-0 bg-black/30 flex items-center justify-center p-4 z-50" onClick={() => setShowCreate(false)}>
            <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-xl" onClick={e => e.stopPropagation()}>
              <h3 className="font-semibold text-slate-800 mb-4">Create tenant</h3>
              <div className="space-y-3">
                <input placeholder="slug e.g. finguard-newco" value={form.slug} onChange={e => setForm(f => ({ ...f, slug: e.target.value }))} className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm" />
                <input placeholder="Company name" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm" />
                <div className="grid grid-cols-2 gap-3">
                  <select value={form.companyType} onChange={e => setForm(f => ({ ...f, companyType: e.target.value }))} className="px-3 py-2 rounded-lg border border-slate-200 text-sm"><option value="bank">bank</option><option value="fintech">fintech</option><option value="credit-union">credit-union</option><option value="microfinance">microfinance</option></select>
                  <select value={form.subscriptionTier} onChange={e => setForm(f => ({ ...f, subscriptionTier: e.target.value as never }))} className="px-3 py-2 rounded-lg border border-slate-200 text-sm"><option value="basic">basic</option><option value="professional">professional</option><option value="enterprise">enterprise</option></select>
                </div>
              </div>
              <div className="flex gap-2 mt-6">
                <button onClick={() => setShowCreate(false)} className="flex-1 px-4 py-2 rounded-lg border border-slate-200 text-sm">Cancel</button>
                <button onClick={handleCreate} disabled={createMut.isPending} className="flex-1 px-4 py-2 rounded-lg bg-[#15803D] text-white text-sm disabled:opacity-50">{createMut.isPending ? 'Creating…' : 'Create'}</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
