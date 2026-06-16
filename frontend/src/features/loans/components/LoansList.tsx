import { memo, useState } from "react";
import { ChevronLeft, ChevronRight, Eye, RefreshCcw, XCircle } from "lucide-react";
import { SkeletonLoader } from "@shared/components/SkeletonLoader";
import RiskScoreBadge from "@features/loans/components/RiskScoreBadge";
import { LoanDetailsModal } from "@features/loans/components/LoanDetailsModal";
import { useLoansList } from "@features/loans/api/loansApi";
import type { LoanApplication, RiskLevel } from "@shared/types/common";

const statusBadgeClasses: Record<string, string> = {
  PENDING: "bg-yellow-100 text-yellow-800 dark:bg-yellow-500/15 dark:text-yellow-300",
  UNDER_REVIEW: "bg-blue-100 text-blue-800 dark:bg-blue-500/15 dark:text-blue-300",
  APPROVED: "bg-green-100 text-green-800 dark:bg-green-500/15 dark:text-green-300",
  REJECTED: "bg-red-100 text-red-800 dark:bg-red-500/15 dark:text-red-300",
  DISBURSED: "bg-purple-100 text-purple-800 dark:bg-purple-500/15 dark:text-purple-300",
  ACTIVE: "bg-indigo-100 text-indigo-800 dark:bg-indigo-500/15 dark:text-indigo-300",
  CLOSED: "bg-gray-100 text-gray-800 dark:bg-gray-500/15 dark:text-gray-300",
  DEFAULTED: "bg-orange-100 text-orange-800 dark:bg-orange-500/15 dark:text-orange-300",
};

const formatDate = (value?: string) => {
  if (!value) return "--";
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? "--"
    : new Intl.DateTimeFormat("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      }).format(date);
};

const formatNPR = (value?: number) => {
  if (value == null) return "--";
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "NPR",
    maximumFractionDigits: 0,
  }).format(value);
};

const purposeLabel: Record<string, string> = {
  HOME: "Home",
  EDUCATION: "Education",
  BUSINESS: "Business",
  PERSONAL: "Personal",
  VEHICLE: "Vehicle",
  AGRICULTURE: "Agriculture",
  OTHER: "Other",
};

type LoansListProps = {
  status: string;
};

const LoansList = ({ status }: LoansListProps) => {
  const [page, setPage] = useState(1);
  const limit = 10;
  const [selectedLoan, setSelectedLoan] = useState<LoanApplication | null>(null);

  const loansQuery = useLoansList(page, limit, status);
  const loans = loansQuery.data?.loans ?? [];
  const totalPages = Math.max(1, Math.ceil((loansQuery.data?.total ?? 0) / limit));

  if (loansQuery.isLoading) {
    return <SkeletonLoader count={6} type="table" />;
  }

  if (loansQuery.isError) {
    return (
      <div className="rounded-3xl border border-red-200 bg-red-50 p-6 text-red-800 dark:border-red-900/40 dark:bg-red-950/40 dark:text-red-200">
        <div className="flex items-start gap-3">
          <XCircle className="mt-0.5 h-5 w-5" />
          <div className="flex-1">
            <h3 className="text-sm font-semibold">Failed to load loan applications</h3>
            <p className="mt-1 text-sm opacity-90">Please try again.</p>
            <button
              type="button"
              onClick={() => loansQuery.refetch()}
              className="mt-4 inline-flex items-center gap-2 rounded-xl bg-red-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-red-700"
            >
              <RefreshCcw className="h-4 w-4" />
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!loans.length) {
    return (
      <div className="rounded-3xl border border-dashed border-gray-300 bg-white p-10 text-center text-gray-500 shadow-sm dark:border-gray-700 dark:bg-gray-900 dark:text-gray-400">
        <p className="text-base font-medium text-gray-900 dark:text-gray-100">No applications found</p>
        <p className="mt-2 text-sm">Try a different filter or refresh later.</p>
      </div>
    );
  }

  return (
    <>
      <div className="overflow-hidden rounded-3xl border border-gray-200 bg-white shadow-sm dark:border-gray-800 dark:bg-gray-900">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-800">
            <thead className="bg-gray-50 dark:bg-gray-950/60">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700 dark:text-gray-200">Applicant</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700 dark:text-gray-200">Amount</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700 dark:text-gray-200">Tenure</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700 dark:text-gray-200">EMI</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700 dark:text-gray-200">Purpose</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700 dark:text-gray-200">Risk</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700 dark:text-gray-200">Status</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700 dark:text-gray-200">Applied</th>
                <th className="px-6 py-4 text-right text-sm font-semibold text-gray-700 dark:text-gray-200">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {loans.map((loan) => (
                <tr key={loan.id} className="transition-colors hover:bg-gray-50 dark:hover:bg-gray-800/60">
                  <td className="px-6 py-4 text-sm text-gray-900 dark:text-gray-100">
                    {loan.userId ? (
                      <span className="font-mono text-xs">{loan.userId.slice(0, 8)}...</span>
                    ) : "--"}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-gray-900 dark:text-gray-100">
                    {formatNPR(loan.amount)}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-700 dark:text-gray-300">
                    {loan.termMonths} mo
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-700 dark:text-gray-300">
                    {loan.monthlyPayment ? formatNPR(loan.monthlyPayment) : "--"}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-700 dark:text-gray-300">
                    {purposeLabel[loan.purpose] ?? loan.purpose}
                  </td>
                  <td className="px-6 py-4 text-sm">
                    <RiskScoreBadge
                      score={null}
                      level={(loan.riskLevel as RiskLevel) ?? null}
                    />
                  </td>
                  <td className="px-6 py-4 text-sm">
                    <span className={`rounded-full px-3 py-1 text-xs font-semibold ${statusBadgeClasses[loan.status] ?? statusBadgeClasses.PENDING}`}>
                      {loan.status}
                    </span>
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                    {formatDate(loan.appliedAt)}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex justify-end">
                      <button
                        type="button"
                        onClick={() => setSelectedLoan(loan)}
                        className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-gray-200 text-gray-600 transition-colors hover:bg-gray-100 dark:border-gray-700 dark:text-gray-200 dark:hover:bg-gray-800"
                        aria-label="View loan details"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="flex flex-col gap-3 border-t border-gray-200 px-4 py-4 sm:flex-row sm:items-center sm:justify-between dark:border-gray-800">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Page {page} of {totalPages}
          </p>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="inline-flex items-center gap-2 rounded-xl border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-700 dark:text-gray-200 dark:hover:bg-gray-800"
            >
              <ChevronLeft className="h-4 w-4" />
              Previous
            </button>
            <button
              type="button"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              className="inline-flex items-center gap-2 rounded-xl border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-700 dark:text-gray-200 dark:hover:bg-gray-800"
            >
              Next
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      <LoanDetailsModal
        isOpen={Boolean(selectedLoan)}
        loan={selectedLoan}
        onClose={() => setSelectedLoan(null)}
      />
    </>
  );
};

export default memo(LoansList);
