import { useEffect, useRef } from 'react';
import Highcharts from 'highcharts';
import type { TimeSeriesPoint } from '../api/supercontrollerApi';

export function TimeSeriesChart({ data, title = 'Platform activity (30 days)', isLoading }: { data?: TimeSeriesPoint[]; title?: string; isLoading?: boolean }) {
  const ref = useRef<HTMLDivElement>(null);
  const chartRef = useRef<Highcharts.Chart | null>(null);

  useEffect(() => {
    if (!ref.current || !data) return;
    const cats = data.map(d => new Date(d.metricDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }));
    const users = data.map(d => d.totalUsers);
    const loans = data.map(d => d.totalLoans);
    const opts: Highcharts.Options = {
      chart: { type: 'spline', backgroundColor: 'transparent', height: 280, style: { fontFamily: 'inherit' } },
      title: { text: undefined },
      credits: { enabled: false },
      legend: { enabled: false },
      xAxis: { categories: cats, gridLineColor: '#f1f5f9', lineColor: '#e2e8f0', tickColor: '#e2e8f0', labels: { style: { color: '#64748b', fontSize: '11px' } } },
      yAxis: { title: { text: undefined }, gridLineColor: '#f1f5f9', labels: { style: { color: '#64748b', fontSize: '11px' } }, allowDecimals: false },
      tooltip: { shared: true, backgroundColor: '#fff', borderColor: '#e2e8f0', style: { fontSize: '12px' } },
      plotOptions: { spline: { marker: { enabled: true, radius: 3, lineWidth: 2, lineColor: '#fff' }, lineWidth: 2 } },
      series: [
        { name: 'Users', data: users, color: '#15803D', type: 'spline' },
        { name: 'Loans', data: loans, color: '#0ea5e9', type: 'spline' },
      ],
    };
    if (chartRef.current) chartRef.current.destroy();
    chartRef.current = Highcharts.chart(ref.current, opts);
    return () => { chartRef.current?.destroy(); chartRef.current = null; };
  }, [data]);

  return (
    <div className="bg-white rounded-xl border border-[#eceef2] p-5 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-slate-800">{title}</h3>
        <div className="flex items-center gap-3 text-xs">
          <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-[#15803D]" /> Users</span>
          <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-[#0ea5e9]" /> Loans</span>
        </div>
      </div>
      {isLoading ? <div className="h-[280px] flex items-center justify-center text-sm text-slate-400">Loading chart…</div> : <div ref={ref} className="min-h-[280px]" />}
    </div>
  );
}
