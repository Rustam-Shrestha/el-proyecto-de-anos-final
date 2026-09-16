import { useEffect, useRef } from 'react';
import Highcharts from 'highcharts';
import HighchartsMore from 'highcharts/highcharts-more';
import SolidGauge from 'highcharts/modules/solid-gauge';

// init once
try { HighchartsMore(Highcharts); } catch {}
try { SolidGauge(Highcharts); } catch {}

export function UsageGauge({ usersPct, loansPct, title = 'Capacity' }: { usersPct: number; loansPct: number; title?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const chartRef = useRef<Highcharts.Chart | null>(null);

  useEffect(() => {
    if (!ref.current) return;
    const opts: Highcharts.Options = {
      chart: { type: 'solidgauge', backgroundColor: 'transparent', height: 220 },
      title: { text: undefined },
      credits: { enabled: false },
      pane: { startAngle: -90, endAngle: 90, background: [{ outerRadius: '112%', innerRadius: '88%', backgroundColor: '#f1f5f9', borderWidth: 0 } as never, { outerRadius: '88%', innerRadius: '64%', backgroundColor: '#f1f5f9', borderWidth: 0 } as never] },
      yAxis: { min: 0, max: 100, lineWidth: 0, tickPositions: [] },
      plotOptions: { solidgauge: { dataLabels: { enabled: false }, rounded: true } as never },
      tooltip: { enabled: true },
      series: [
        { name: 'Users', data: [{ y: Math.min(100, usersPct), color: '#15803D', radius: '112%', innerRadius: '88%' } as never], type: 'solidgauge' },
        { name: 'Loans', data: [{ y: Math.min(100, loansPct), color: '#0ea5e9', radius: '88%', innerRadius: '64%' } as never], type: 'solidgauge' },
      ],
    };
    if (chartRef.current) chartRef.current.destroy();
    chartRef.current = Highcharts.chart(ref.current, opts);
    return () => { chartRef.current?.destroy(); chartRef.current = null; };
  }, [usersPct, loansPct]);

  return (
    <div className="bg-white rounded-xl border border-[#eceef2] p-5 shadow-sm">
      <h3 className="text-sm font-semibold text-slate-800 mb-2">{title}</h3>
      <div ref={ref} />
      <div className="flex justify-between text-xs text-slate-600 -mt-6">
        <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-[#15803D]" /> Users {usersPct.toFixed(0)}%</span>
        <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-[#0ea5e9]" /> Loans {loansPct.toFixed(0)}%</span>
      </div>
    </div>
  );
}
