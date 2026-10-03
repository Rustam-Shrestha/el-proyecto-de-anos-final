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
      render: (loan) => {
        const identifier = (loan as any).user?.email || loan.applicantEmail || loan.userId || "--";
        const short = identifier.length > 20 ? `${identifier.slice(0, 18)}...` : identifier;
        return (
          <span className="font-medium text-xs text-[#0F172A]" title={identifier}>
            {short}
          </span>
        );
      },
    },
    {
      key: "amount",
      header: "Amount",
      className: "whitespace-nowrap font-medium tabular-nums text-[#0F172A]",
      render: (loan) => formatNPR(loan.amount || (loan as any).requestedAmount),
    },
    {
      key: "tenure",
      header: "Tenure",
      className: "text-[#334155]",
      render: (loan) => `${loan.termMonths || (loan as any).tenureMonths || "--"} mo`,
    },
    {
      key: "emi",
      header: "EMI",
      className: "tabular-nums text-[#334155]",
      render: (loan) => formatNPR(loan.monthlyPayment || (loan as any).calculatedEmi),
    },
    {
      key: "purpose",
      header: "Purpose",
      className: "text-[#334155]",
      render: (loan) => purposeLabel[loan.purpose] ?? loan.purpose ?? "General",
    },
    {
      key: "risk",
      header: "Risk",
      render: (loan) => (
        <RiskScoreBadge
          score={(loan as any).creditScore || loan.riskScore || null}
          level={(loan.riskLevel as RiskLevel) ?? null}
        />
      ),
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
      render: (loan) => formatDate(loan.appliedAt || (loan as any).createdAt),
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

  const handleExportCsv = () => {
    if (!loans.length) return;
    const headers = ["Loan ID", "Applicant", "Amount (NPR)", "Term (Months)", "Monthly EMI (NPR)", "Purpose", "Risk Level", "Status", "Applied Date"];
    const csvRows = [
      headers.join(","),
      ...loans.map((l) =>
        [
          `"${l.id}"`,
          `"${l.userId || ""}"`,
          l.amount,
          l.termMonths,
          l.monthlyPayment || 0,
          `"${l.purpose || ""}"`,
          `"${l.riskLevel || "UNASSESSED"}"`,
          `"${l.status}"`,
          `"${l.appliedAt || ""}"`,
        ].join(",")
      ),
    ];
    const blob = new Blob([csvRows.join("\n")], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `loans-export-${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loansQuery.isLoading) return <SkeletonLoader count={6} type="table" />;
  if (loansQuery.isError) return <ErrorState message={apiErrorMessage(loansQuery.error, "Failed to load loan applications")} onRetry={() => loansQuery.refetch()} />;
  if (!loans.length) return <EmptyState title="No applications found" description="Try a different filter or refresh later." />;

  return (
    <>
      <div className="flex justify-end mb-2">
        <Button variant="secondary" size="sm" onClick={handleExportCsv} className="text-xs h-8">
          Export Table (CSV)
        </Button>
      </div>
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
