type Tone = "success" | "warning" | "danger" | "info" | "neutral" | "pending";

const toneClasses: Record<Tone, string> = {
  success: "bg-[#DCFCE7] text-[#166534] border-[#BBF7D0]",
  warning: "bg-[#FEF3C7] text-[#92400E] border-[#FDE68A]",
  danger: "bg-[#FEE2E2] text-[#991B1B] border-[#FECACA]",
  info: "bg-[#E0F2FE] text-[#0C4A6E] border-[#BAE6FD]",
  neutral: "bg-[#F1F5F9] text-[#334155] border-[#E2E8F0]",
  pending: "bg-[#FEF3C7] text-[#92400E] border-[#FDE68A]",
};

export function getStatusTone(status: string): Tone {
  const s = status?.toUpperCase();
  if (["APPROVED", "VERIFIED", "COMPLETED", "LOW", "ACTIVE"].includes(s)) return "success";
  if (["PENDING", "SUBMITTED", "UNDER_REVIEW", "IN_PROGRESS", "MEDIUM", "PROCESSING", "NEEDS_RESUBMISSION"].includes(s)) return "warning";
  if (["REJECTED", "FAILED", "HIGH", "FLAGGED_REVIEW", "EXPIRED"].includes(s)) return "danger";
  if (["REVIEW", "MANUAL_REVIEW", "INFO"].includes(s)) return "info";
  return "neutral";
}

export default function StatusBadge({ status, tone, className = "" }: { status: string; tone?: Tone; className?: string }) {
  const t = tone ?? getStatusTone(status);
  return (
    <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold ${toneClasses[t]} ${className}`}>
      {status}
    </span>
  );
}
