import type { ReactNode } from "react";
import Card from "./Card";

type Props = { label: string; value: ReactNode; hint?: string; icon?: ReactNode; accent?: string };

export default function StatCard({ label, value, hint, icon, accent = "bg-[#DCFCE7] text-[#15803D]" }: Props) {
  return (
    <Card className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold uppercase tracking-[0.08em] text-[#64748B]">{label}</p>
        {icon ? <span className={`inline-flex h-9 w-9 items-center justify-center rounded-[8px] ${accent}`}>{icon}</span> : null}
      </div>
      <p className="text-[24px] font-semibold text-[#0F172A] tabular-nums">{value}</p>
      {hint ? <p className="text-xs text-[#64748B]">{hint}</p> : null}
    </Card>
  );
}
