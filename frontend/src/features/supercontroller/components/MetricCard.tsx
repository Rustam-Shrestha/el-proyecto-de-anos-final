import type { ReactNode } from 'react';

interface Props { title: string; value: string | number; subtitle?: string; icon?: ReactNode; accent?: string }
export function MetricCard({ title, value, subtitle, icon, accent = '#15803D' }: Props) {
  return (
    <div className="bg-white rounded-xl border border-[#eceef2] p-4 shadow-sm min-h-[110px] flex flex-col justify-between hover:shadow-md transition-shadow">
      <div className="flex justify-between items-start gap-3">
        <div>
          <p className="text-[11px] uppercase tracking-widest text-slate-400 font-semibold">{title}</p>
          <p className="text-xl font-bold text-slate-800 mt-1 tabular-nums">{value}</p>
          {subtitle && <p className="text-xs text-slate-500 mt-1">{subtitle}</p>}
        </div>
        {icon && <div className="w-9 h-9 rounded-lg flex items-center justify-center text-white shrink-0" style={{ background: accent }}>{icon}</div>}
      </div>
      <div className="h-1 rounded-full mt-3 opacity-20" style={{ background: accent }} />
    </div>
  );
}
