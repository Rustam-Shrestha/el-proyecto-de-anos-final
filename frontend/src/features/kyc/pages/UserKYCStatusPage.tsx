import { memo, useMemo } from "react";
import { Link } from "react-router-dom";
import { useGetMyKYCStatus } from "@features/kyc/api/kycApi";
import { SkeletonLoader } from "@shared/components/SkeletonLoader";

const statusClasses = {
  PENDING: "bg-yellow-100 text-yellow-800 dark:bg-yellow-500/15 dark:text-yellow-300",
  APPROVED: "bg-green-100 text-green-800 dark:bg-green-500/15 dark:text-green-300",
  REJECTED: "bg-red-100 text-red-800 dark:bg-red-500/15 dark:text-red-300",
} as const;

const formatDate = (value?: string | null) => {
  if (!value) return "--";
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? "--"
    : new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric" }).format(date);
};

const UserKYCStatusPage = () => {
  const statusQuery = useGetMyKYCStatus();

  const documents = useMemo(() => statusQuery.data?.documents ?? [], [statusQuery.data?.documents]);

  return (
    <section className="space-y-6">
      <div className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900">
        <p className="text-sm font-semibold uppercase tracking-[0.22em] text-[var(--green-icon)]">KYC Status</p>
        <h1 className="mt-2 text-3xl font-semibold text-gray-900 dark:text-gray-100">Your KYC application</h1>
      </div>

      {statusQuery.isLoading ? <SkeletonLoader count={3} type="list" /> : null}

      {statusQuery.isError ? (
        <div className="rounded-3xl border border-red-200 bg-red-50 p-6 text-red-800 dark:border-red-900/40 dark:bg-red-950/40 dark:text-red-200">
          Unable to load your status.
        </div>
      ) : null}

      {!statusQuery.isLoading && !statusQuery.isError && !statusQuery.data ? (
        <div className="rounded-3xl border border-dashed border-gray-300 bg-white p-8 text-gray-600 shadow-sm dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300">
          <p className="text-base font-medium text-gray-900 dark:text-gray-100">No KYC application found</p>
          <p className="mt-2 text-sm">Start your application from the submission page.</p>
          <Link className="mt-4 inline-block text-sm font-medium text-primary underline" to="/dashboard/kyc-submit">
            Go to KYC submission
          </Link>
        </div>
      ) : null}

      {!statusQuery.isLoading && statusQuery.data ? (
        <div className="space-y-4 rounded-3xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900">
          <div className="flex flex-wrap items-center gap-3">
            <span className={`rounded-full px-3 py-1 text-xs font-semibold ${statusClasses[statusQuery.data.status]}`}>
              {statusQuery.data.status}
            </span>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Applied {formatDate(statusQuery.data.appliedAt ?? statusQuery.data.applied_at)}
            </p>
          </div>

          <div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Submitted Documents</h2>
            {documents.length ? (
              <ul className="mt-3 space-y-2 text-sm text-gray-600 dark:text-gray-300">
                {documents.map((document, index) => (
                  <li key={document.id ?? `${document.name ?? document.filename ?? "document"}-${index}`}>{document.name ?? document.filename ?? `Document ${index + 1}`}</li>
                ))}
              </ul>
            ) : (
              <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">No documents recorded.</p>
            )}
          </div>

          {statusQuery.data.status === "REJECTED" && (statusQuery.data.rejectionReason || statusQuery.data.rejection_reason) ? (
            <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-red-800 dark:border-red-900/40 dark:bg-red-950/40 dark:text-red-200">
              <p className="text-sm font-semibold">Rejection reason</p>
              <p className="mt-1 text-sm">{statusQuery.data.rejectionReason ?? statusQuery.data.rejection_reason}</p>
            </div>
          ) : null}

          {statusQuery.data.status === "APPROVED" ? (
            <div className="rounded-2xl border border-green-200 bg-green-50 p-4 text-green-800 dark:border-green-900/40 dark:bg-green-950/40 dark:text-green-200">
              <p className="text-sm font-semibold">Approved</p>
              <p className="mt-1 text-sm">{statusQuery.data.approvalMessage ?? statusQuery.data.approval_message ?? "Your application has been approved."}</p>
              <p className="mt-2 text-sm">Approved on {formatDate(statusQuery.data.approvedAt ?? statusQuery.data.approved_at)}</p>
            </div>
          ) : null}
        </div>
      ) : null}
    </section>
  );
};

export default memo(UserKYCStatusPage);