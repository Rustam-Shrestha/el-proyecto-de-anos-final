import { memo, useState } from "react";
import { ChevronLeft, ChevronRight, Eye } from "lucide-react";
import { SkeletonLoader } from "@shared/components/SkeletonLoader";
import RiskScoreBadge from "@features/loans/components/RiskScoreBadge";
import { LoanDetailsModal } from "@features/loans/components/LoanDetailsModal";
import { useLoansList } from "@features/loans/api/loansApi";
import type { LoanApplication, RiskLevel } from "@shared/types/common";
import StatusBadge from "@shared/components/StatusBadge";
import ErrorState from "@shared/components/ErrorState";
import EmptyState from "@shared/components/EmptyState";
import { Button } from "@shared/components/Button";
import Card from "@shared/components/Card";

const formatDate = (value?: string) => {
  if (!value) return "--";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "--" : new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric" }).format(date);
};
const formatNPR = (value?: number) => value == null ? "--" : new Intl.NumberFormat("en-IN", { style: "currency", currency: "NPR", maximumFractionDigits: 0 }).format(value);
const purposeLabel: Record<string, string> = { HOME: "Home", EDUCATION: "Education", BUSINESS: "Business", PERSONAL: "Personal", VEHICLE: "Vehicle", AGRICULTURE: "Agriculture", OTHER: "Other" };

type LoansListProps = { status: string };

const LoansList = ({ status }: LoansListProps) => {
  const [page, setPage] = useState(1);
  const limit = 10;
  const [selectedLoan, setSelectedLoan] = useState<LoanApplication | null>(null);
  const loansQuery = useLoansList(page, limit, status);
  const loans = loansQuery.data?.loans ?? [];
  const totalPages = Math.max(1, Math.ceil((loansQuery.data?.total ?? 0) / limit));

  if (loansQuery.isLoading) return <SkeletonLoader count={6} type="table" />;
  if (loansQuery.isError) return <ErrorState message="Failed to load loan applications" onRetry={() => loansQuery.refetch()} />;
  if (!loans.length) return <EmptyState title="No applications found" description="Try a different filter or refresh later." />;

  return (
    <>
      <Card padding="none" className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead className="bg-[#F8FAFC] border-b border-[#E2E8F0]">
              <tr>
                <th className="px-4 py-3 text-left text-[13px] font-semibold text-[#0F172A]">Applicant</th>
                <th className="px-4 py-3 text-left text-[13px] font-semibold text-[#0F172A]">Amount</th>
                <th className="px-4 py-3 text-left text-[13px] font-semibold text-[#0F172A]">Tenure</th>
                <th className="px-4 py-3 text-left text-[13px] font-semibold text-[#0F172A]">EMI</th>
                <th className="px-4 py-3 text-left text-[13px] font-semibold text-[#0F172A]">Purpose</th>
                <th className="px-4 py-3 text-left text-[13px] font-semibold text-[#0F172A]">Risk</th>
                <th className="px-4 py-3 text-left text-[13px] font-semibold text-[#0F172A]">Status</th>
                <th className="px-4 py-3 text-left text-[13px] font-semibold text-[#0F172A]">Applied</th>
                <th className="px-4 py-3 text-right text-[13px] font-semibold text-[#0F172A]">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E2E8F0]">
              {loans.map((loan) => (
                <tr key={loan.id} className="hover:bg-[#F8FAFC]">
                  <td className="px-4 py-3 text-sm text-[#0F172A]">{loan.userId ? <span className="font-mono text-xs">{loan.userId.slice(0, 8)}...</span> : "--"}</td>
                  <td className="whitespace-nowrap px-4 py-3 text-sm font-medium tabular-nums text-[#0F172A]">{formatNPR(loan.amount)}</td>
                  <td className="px-4 py-3 text-sm text-[#334155]">{loan.termMonths} mo</td>
                  <td className="px-4 py-3 text-sm tabular-nums text-[#334155]">{loan.monthlyPayment ? formatNPR(loan.monthlyPayment) : "--"}</td>
                  <td className="px-4 py-3 text-sm text-[#334155]">{purposeLabel[loan.purpose] ?? loan.purpose}</td>
                  <td className="px-4 py-3 text-sm"><RiskScoreBadge score={null} level={(loan.riskLevel as RiskLevel) ?? null} /></td>
                  <td className="px-4 py-3 text-sm"><StatusBadge status={loan.status} /></td>
                  <td className="whitespace-nowrap px-4 py-3 text-sm text-[#64748B]">{formatDate(loan.appliedAt)}</td>
                  <td className="px-4 py-3"><div className="flex justify-end"><Button variant="ghost" size="sm" aria-label="View loan details" onClick={() => setSelectedLoan(loan)} className="h-8 w-8 p-0"><Eye className="h-4 w-4" /></Button></div></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="flex flex-col gap-3 border-t border-[#E2E8F0] px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-[#64748B]">Page {page} of {totalPages}</p>
          <div className="flex items-center gap-2">
            <Button variant="secondary" size="sm" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page <= 1}><ChevronLeft className="h-4 w-4" />Previous</Button>
            <Button variant="secondary" size="sm" onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page >= totalPages}>Next<ChevronRight className="h-4 w-4" /></Button>
          </div>
        </div>
      </Card>
      <LoanDetailsModal isOpen={Boolean(selectedLoan)} loan={selectedLoan} onClose={() => setSelectedLoan(null)} />
    </>
  );
};

export default memo(LoansList);
