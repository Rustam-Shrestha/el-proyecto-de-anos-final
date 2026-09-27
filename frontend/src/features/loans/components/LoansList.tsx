import { memo, useState } from "react";
import { Eye } from "lucide-react";
import { SkeletonLoader } from "@shared/components/SkeletonLoader";
import RiskScoreBadge from "@features/loans/components/RiskScoreBadge";
import { LoanDetailsModal } from "@features/loans/components/LoanDetailsModal";
import { useLoansList } from "@features/loans/api/loansApi";
import type { LoanApplication, RiskLevel } from "@shared/types/common";
import StatusBadge from "@shared/components/StatusBadge";
import ErrorState from "@shared/components/ErrorState";
import { apiErrorMessage } from "@shared/utils/apiError";
import EmptyState from "@shared/components/EmptyState";
import { Button } from "@shared/components/Button";
import Card from "@shared/components/Card";
import DataTable, { type DataTableColumn } from "@shared/components/DataTable";
import TablePagination from "@shared/components/TablePagination";

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

  const columns: DataTableColumn<LoanApplication>[] = [
    {
      key: "applicant",
      header: "Applicant",
      render: (loan) =>
        loan.userId ? (
          <span className="font-mono text-xs text-[#0F172A]">{loan.userId.slice(0, 8)}...</span>
        ) : (
          "--"
        ),
    },
    {
      key: "amount",
      header: "Amount",
      className: "whitespace-nowrap font-medium tabular-nums text-[#0F172A]",
      render: (loan) => formatNPR(loan.amount),
    },
    {
      key: "tenure",
      header: "Tenure",
      className: "text-[#334155]",
      render: (loan) => `${loan.termMonths} mo`,
    },
    {
      key: "emi",
      header: "EMI",
      className: "tabular-nums text-[#334155]",
      render: (loan) => (loan.monthlyPayment ? formatNPR(loan.monthlyPayment) : "--"),
    },
    {
      key: "purpose",
      header: "Purpose",
      className: "text-[#334155]",
      render: (loan) => purposeLabel[loan.purpose] ?? loan.purpose,
    },
    {
      key: "risk",
      header: "Risk",
      render: (loan) => <RiskScoreBadge score={null} level={(loan.riskLevel as RiskLevel) ?? null} />,
    },
    {
      key: "status",
      header: "Status",
      render: (loan) => <StatusBadge status={loan.status} />,
    },
    {
      key: "appliedAt",
      header: "Applied",
      className: "whitespace-nowrap text-[#64748B]",
      render: (loan) => formatDate(loan.appliedAt),
    },
    {
      key: "actions",
      header: "Actions",
      align: "right",
      render: (loan) => (
        <Button
          variant="ghost"
          size="sm"
          aria-label="View loan details"
          onClick={() => setSelectedLoan(loan)}
          className="h-8 w-8 p-0"
        >
          <Eye className="h-4 w-4" />
        </Button>
      ),
    },
  ];

  if (loansQuery.isLoading) return <SkeletonLoader count={6} type="table" />;
  if (loansQuery.isError) return <ErrorState message={apiErrorMessage(loansQuery.error, "Failed to load loan applications")} onRetry={() => loansQuery.refetch()} />;
  if (!loans.length) return <EmptyState title="No applications found" description="Try a different filter or refresh later." />;

  return (
    <>
      <Card padding="none" className="overflow-hidden">
        <DataTable
          caption="Loan applications"
          columns={columns}
          rows={loans}
          rowKey={(loan) => loan.id}
        />
        <TablePagination page={page} totalPages={totalPages} onPageChange={setPage} />
      </Card>
      <LoanDetailsModal isOpen={Boolean(selectedLoan)} loan={selectedLoan} onClose={() => setSelectedLoan(null)} />
    </>
  );
};

export default memo(LoansList);
