import StatusBadge from '@shared/components/StatusBadge';
import { Button } from '@shared/components/Button';
import type { TenantDto } from '../api/supercontrollerApi';

export function TenantList({ tenants, onStatusChange, onSelect, isLoading }: { tenants: TenantDto[]; onStatusChange: (id: number, status: 'active'|'suspended') => void; onSelect?: (t: TenantDto) => void; isLoading?: boolean }) {
  if (isLoading) return <div className="p-8 text-center text-sm text-slate-500">Loading tenants…</div>;
  if (!tenants.length) return <div className="p-8 text-center text-sm text-slate-500">No tenants found</div>;
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
      {tenants.map(t => {
        const usersPct = t.maxUsers ? Math.min(100, Math.round((t.usageUsers / t.maxUsers) * 100)) : 0;
        const loansPct = t.maxLoans ? Math.min(100, Math.round((t.usageLoans / t.maxLoans) * 100)) : 0;
        const tierColor = t.subscriptionTier === 'enterprise' ? '#15803D' : t.subscriptionTier === 'professional' ? '#0ea5e9' : '#64748b';
        return (
          <div key={t.id} className="bg-white rounded-xl border border-[#eceef2] p-5 shadow-sm hover:shadow-md transition flex flex-col gap-4">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <h3 className="font-semibold text-slate-800 truncate" title={t.name}>{t.name}</h3>
                <p className="text-xs text-slate-500 truncate">{t.slug} • {t.companyType ?? 'fintech'}</p>
              </div>
              <StatusBadge status={t.status} tone={t.status === 'active' ? 'success' : 'warning'} />
            </div>
            <div className="flex items-center gap-2 text-xs">
              <span className="px-2 py-1 rounded-full text-white text-[11px] font-semibold" style={{ background: tierColor }}>{t.subscriptionTier ?? 'basic'}</span>
              <span className="text-slate-400">ID #{t.id}</span>
            </div>
            <div className="space-y-3">
              <div>
                <div className="flex justify-between text-[11px] font-semibold text-slate-500 uppercase tracking-wide"><span>Users</span><span>{t.usageUsers}/{t.maxUsers} • {usersPct}%</span></div>
                <div className="h-1.5 bg-[#f1f5f9] rounded-full overflow-hidden mt-1"><div className="h-full bg-[#15803D] transition-all" style={{ width: `${usersPct}%` }} /></div>
              </div>
              <div>
                <div className="flex justify-between text-[11px] font-semibold text-slate-500 uppercase tracking-wide"><span>Loans</span><span>{t.usageLoans}/{t.maxLoans} • {loansPct}%</span></div>
                <div className="h-1.5 bg-[#f1f5f9] rounded-full overflow-hidden mt-1"><div className="h-full bg-[#0ea5e9] transition-all" style={{ width: `${loansPct}%` }} /></div>
              </div>
            </div>
            <div className="flex gap-2 pt-2 border-t border-slate-100 mt-auto">
              <Button size="sm" variant={t.status === 'active' ? 'ghost' : 'primary'} onClick={() => onStatusChange(t.id, t.status === 'active' ? 'suspended' : 'active')} className="flex-1">{t.status === 'active' ? 'Suspend' : 'Activate'}</Button>
              <Button size="sm" variant="secondary" onClick={() => onSelect?.(t)} className="flex-1">Details</Button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
