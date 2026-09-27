import { memo, useState } from "react";
import { Eye } from "lucide-react";
import { SkeletonLoader } from "@shared/components/SkeletonLoader";
import { useKYCApplications } from "@features/kyc/api/kycApi";
import { KYCDetailsModal } from "@features/kyc/components/KYCDetailsModal";
import type { KYCApplication } from "@shared/types/common";
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

type KYCListProps = { status: string };

const KYCList = ({ status }: KYCListProps) => {
  const [page, setPage] = useState(1);
  const limit = 10;
  const [selectedApplication, setSelectedApplication] = useState<KYCApplication | null>(null);
  const applicationsQuery = useKYCApplications(page, limit, status);
  const applications = applicationsQuery.data?.applications ?? [];
  const totalPages = Math.max(1, Math.ceil((applicationsQuery.data?.total ?? 0) / limit));

  const columns: DataTableColumn<KYCApplication>[] = [
    {
      key: "email",
      header: "Applicant Email",
      className: "text-[#0F172A]",
      render: (application) => application.applicantEmail ?? application.userEmail ?? "--",
    },
    {
      key: "status",
      header: "Status",
      render: (application) => <StatusBadge status={application.status} />,
    },
    {
      key: "appliedAt",
      header: "Applied Date",
      className: "text-[#64748B]",
      render: (application) => formatDate(application.appliedAt ?? application.submittedAt),
    },
    {
      key: "actions",
      header: "Actions",
      align: "right",
      render: (application) => (
        <Button
          variant="ghost"
          size="sm"
          aria-label={`View ${application.applicantEmail ?? "application"}`}
          onClick={() => setSelectedApplication(application)}
          className="h-8 w-8 p-0"
        >
          <Eye className="h-4 w-4" />
        </Button>
      ),
    },
  ];

  if (applicationsQuery.isLoading) return <SkeletonLoader count={6} type="table" />;
  if (applicationsQuery.isError) return <ErrorState message={apiErrorMessage(applicationsQuery.error, "Failed to load KYC applications")} onRetry={() => applicationsQuery.refetch()} />;
  if (!applications.length) return <EmptyState title="No applications found" description="Try a different filter or refresh later." />;

  return (
    <>
      <Card padding="none" className="overflow-hidden">
        <DataTable
          caption="KYC verification queue"
          columns={columns}
          rows={applications}
          rowKey={(application) => application.id}
        />
        <TablePagination page={page} totalPages={totalPages} onPageChange={setPage} />
      </Card>
      <KYCDetailsModal isOpen={Boolean(selectedApplication)} application={selectedApplication} onClose={() => setSelectedApplication(null)} />
    </>
  );
};

export default memo(KYCList);
