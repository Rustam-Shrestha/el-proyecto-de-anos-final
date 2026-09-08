import { memo, useState } from "react";
import { ChevronLeft, ChevronRight, Eye } from "lucide-react";
import { SkeletonLoader } from "@shared/components/SkeletonLoader";
import { useKYCApplications } from "@features/kyc/api/kycApi";
import { KYCDetailsModal } from "@features/kyc/components/KYCDetailsModal";
import type { KYCApplication } from "@shared/types/common";
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

type KYCListProps = { status: string };

const KYCList = ({ status }: KYCListProps) => {
  const [page, setPage] = useState(1);
  const limit = 10;
  const [selectedApplication, setSelectedApplication] = useState<KYCApplication | null>(null);
  const applicationsQuery = useKYCApplications(page, limit, status);
  const applications = applicationsQuery.data?.applications ?? [];
  const totalPages = Math.max(1, Math.ceil((applicationsQuery.data?.total ?? 0) / limit));

  if (applicationsQuery.isLoading) return <SkeletonLoader count={6} type="table" />;
  if (applicationsQuery.isError) return <ErrorState message="Failed to load KYC applications" onRetry={() => applicationsQuery.refetch()} />;
  if (!applications.length) return <EmptyState title="No applications found" description="Try a different filter or refresh later." />;

  return (
    <>
      <Card padding="none" className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead className="bg-[#F8FAFC] border-b border-[#E2E8F0]">
              <tr>
                <th className="px-4 py-3 text-left text-[13px] font-semibold text-[#0F172A]">Applicant Email</th>
                <th className="px-4 py-3 text-left text-[13px] font-semibold text-[#0F172A]">Status</th>
                <th className="px-4 py-3 text-left text-[13px] font-semibold text-[#0F172A]">Applied Date</th>
                <th className="px-4 py-3 text-right text-[13px] font-semibold text-[#0F172A]">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E2E8F0]">
              {applications.map((application) => (
                <tr key={application.id} className="hover:bg-[#F8FAFC]">
                  <td className="px-4 py-3 text-sm text-[#0F172A]">{application.applicantEmail ?? application.userEmail ?? "--"}</td>
                  <td className="px-4 py-3 text-sm"><StatusBadge status={application.status} /></td>
                  <td className="px-4 py-3 text-sm text-[#64748B]">{formatDate(application.appliedAt ?? application.submittedAt)}</td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end">
                      <Button variant="ghost" size="sm" aria-label={`View ${application.applicantEmail ?? "application"}`} onClick={() => setSelectedApplication(application)} className="h-8 w-8 p-0">
                        <Eye className="h-4 w-4" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="flex flex-col gap-3 border-t border-[#E2E8F0] px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-[#64748B]">Page {page} of {totalPages}</p>
          <div className="flex items-center gap-2">
            <Button variant="secondary" size="sm" onClick={() => setPage((c) => Math.max(1, c - 1))} disabled={page <= 1}><ChevronLeft className="h-4 w-4" />Previous</Button>
            <Button variant="secondary" size="sm" onClick={() => setPage((c) => Math.min(totalPages, c + 1))} disabled={page >= totalPages}>Next<ChevronRight className="h-4 w-4" /></Button>
          </div>
        </div>
      </Card>
      <KYCDetailsModal isOpen={Boolean(selectedApplication)} application={selectedApplication} onClose={() => setSelectedApplication(null)} />
    </>
  );
};

export default memo(KYCList);
