import { memo, useMemo } from "react";
import { Link } from "react-router-dom";
import { useGetMyKYCStatus } from "@features/kyc/api/kycApi";
import { SkeletonLoader } from "@shared/components/SkeletonLoader";
import { DocumentStatusBadge } from "@shared/components/DocumentStatusBadge";
import { env } from "@shared/lib/env";
import type { KYCDocument, DocumentVerificationStatus } from "@shared/types/common";
import { DocumentType } from "@shared/types/common";

const resolveDocumentUrl = (filePath: string): string => {
  if (!filePath) return "#";
  if (/^https?:\/\//i.test(filePath)) return filePath;
  const base = env.VITE_API_BASE_URL.replace(/\/api\/v1\/?$/, "");
  const normalized = filePath.startsWith("/") ? filePath : `/${filePath}`;
  return `${base}${normalized}`;
};

const documentTypeLabels: Record<string, string> = {
  [DocumentType.CITIZENSHIP_FRONT]: "Citizenship (Front)",
  [DocumentType.CITIZENSHIP_BACK]: "Citizenship (Back)",
  [DocumentType.PASSPORT]: "Passport",
  [DocumentType.SELFIE]: "Selfie",
  [DocumentType.INCOME_PROOF]: "Income Proof",
  [DocumentType.BANK_STATEMENT]: "Bank Statement",
  [DocumentType.EXISTING_LOAN]: "Existing Loan",
  [DocumentType.COLLATERAL]: "Collateral",
  [DocumentType.OTHER]: "Other",
};

const docStatusToBadgeStatus = (
  status?: DocumentVerificationStatus
): "PENDING" | "VERIFIED" | "REJECTED" | "MANUAL_REVIEW" | "PROCESSING" => {
  switch (status) {
    case "VERIFIED":
      return "VERIFIED";
    case "FAILED":
      return "REJECTED";
    case "MANUAL_REVIEW":
      return "MANUAL_REVIEW";
    case "PROCESSING":
      return "PROCESSING";
    default:
      return "PENDING";
  }
};

const statusCardClasses: Record<string, string> = {
  PENDING:
    "border-yellow-200 bg-yellow-50  ",
  APPROVED:
    "border-green-200 bg-green-50  ",
  REJECTED:
    "border-red-200 bg-red-50  ",
};

const statusLabelClasses: Record<string, string> = {
  PENDING:
    "bg-yellow-100 text-yellow-800  ",
  APPROVED:
    "bg-green-100 text-green-800  ",
  REJECTED:
    "bg-red-100 text-red-800  ",
  UNDER_REVIEW:
    "bg-blue-100 text-blue-800  ",
  RESUBMIT_REQUIRED:
    "bg-orange-100 text-orange-800  ",
};

const formatDate = (value?: string | null): string => {
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

const KYCStatusPage = () => {
  const { data: application, isLoading, isError } = useGetMyKYCStatus();

  const documents = useMemo<KYCDocument[]>(
    () => application?.documents ?? [],
    [application?.documents]
  );

  if (isLoading) {
    return (
      <section className="space-y-6">
        <HeaderShell />
        <SkeletonLoader count={3} type="list" />
      </section>
    );
  }

  if (isError) {
    return (
      <section className="space-y-6">
        <HeaderShell />
        <div className="rounded-3xl border border-red-200 bg-red-50 p-6 text-red-800   ">
          Unable to load your KYC status. Please try again later.
        </div>
      </section>
    );
  }

  if (!application) {
    return (
      <section className="space-y-6">
        <HeaderShell />
        <NoApplicationCard />
      </section>
    );
  }

  return (
    <section className="space-y-6">
      <HeaderShell />

      <div className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm  ">
        <div className="flex flex-wrap items-center gap-3">
          <span
            className={`rounded-full px-3 py-1 text-xs font-semibold ${
              statusLabelClasses[application.status] ?? statusLabelClasses.PENDING
            }`}
          >
            {application.status}
          </span>
          <p className="text-sm text-gray-500">
            Applied {formatDate(application.appliedAt ?? application.submittedAt)}
          </p>
        </div>

        <div className="mt-6 rounded-2xl border border-gray-200 bg-gray-50 p-4">
          <h3 className="text-sm font-semibold text-gray-900">Applicant Information</h3>
          <dl className="mt-3 space-y-2 text-sm">
            <div className="flex justify-between">
              <dt className="text-gray-500">Email</dt>
              <dd className="font-medium text-gray-900">
                {application.applicantEmail ?? application.userEmail ?? "N/A"}
              </dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-gray-500">Submitted</dt>
              <dd className="font-medium text-gray-900">
                {formatDate(application.submittedAt)}
              </dd>
            </div>
          </dl>
        </div>

        {application.status === "APPROVED" ? (
          <ApprovedSection
            approvedAt={application.approvedAt}
            approvalMessage={application.approvalMessage}
          />
        ) : null}

        {application.status === "REJECTED" ? (
          <RejectedSection
            rejectionReason={application.rejectionReason}
            kycId={application.id}
          />
        ) : null}

        <div className="mt-6">
          <h2 className="text-lg font-semibold text-gray-900">Submitted Documents</h2>
          {documents.length === 0 ? (
            <p className="mt-2 text-sm text-gray-500">No documents recorded yet.</p>
          ) : (
            <ul className="mt-3 divide-y divide-gray-100">
              {documents.map((doc) => (
                <li key={doc.id} className="flex items-center justify-between py-3">
                  <div className="flex flex-col">
                    <span className="text-sm font-medium text-gray-900">
                      {documentTypeLabels[doc.type] ?? doc.type}
                    </span>
                    <span className="text-xs text-gray-500">
                      Uploaded {formatDate(doc.createdAt)}
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <DocumentStatusBadge
                      status={docStatusToBadgeStatus(doc.verificationStatus)}
                    />
                    {doc.filePath ? (
                      <a
                        href={resolveDocumentUrl(doc.filePath)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs font-medium text-blue-600 underline"
                      >
                        View
                      </a>
                    ) : null}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </section>
  );
};

const HeaderShell = () => (
  <div className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm  ">
    <p className="text-sm font-semibold uppercase tracking-[0.22em] text-[var(--green-icon)]">
      KYC Status
    </p>
    <h1 className="mt-2 text-3xl font-semibold text-gray-900 ">
      Your KYC application
    </h1>
  </div>
);

const NoApplicationCard = () => (
  <div className="rounded-3xl border border-dashed border-gray-300 bg-white p-8 text-gray-600 shadow-sm   ">
    <p className="text-base font-medium text-gray-900 ">
      No KYC application found
    </p>
    <p className="mt-2 text-sm">
      You have not submitted a KYC application yet. Start one from the submission page.
    </p>
    <Link
      to="/dashboard/kyc-submit"
      className="mt-4 inline-block rounded-xl bg-[var(--green-icon)] px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:opacity-90"
    >
      Submit KYC Application
    </Link>
  </div>
);



const ApprovedSection = ({
  approvedAt,
  approvalMessage,
}: {
  approvedAt?: string | null;
  approvalMessage?: string | null;
}) => (
  <div
    className={`mt-4 rounded-2xl border p-4 ${statusCardClasses.APPROVED}`}
  >
    <p className="text-sm font-semibold text-green-800 ">
      Application Approved
    </p>
    <p className="mt-1 text-sm text-green-700 ">
      {approvalMessage ?? "Your KYC application has been approved."}
    </p>
    <p className="mt-2 text-sm text-green-700 ">
      Approved on {formatDate(approvedAt)}
    </p>
    <div className="mt-4 rounded-xl border border-green-200 bg-green-100/50 p-3  ">
      <p className="text-sm font-medium text-green-800 ">
        Next Steps
      </p>
      <p className="mt-1 text-sm text-green-700 ">
        Your identity has been verified. You can now apply for a loan.
      </p>
      <Link
        to="/dashboard"
        className="mt-2 inline-block text-sm font-semibold text-green-800 underline "
      >
        Go to Dashboard
      </Link>
    </div>
  </div>
);

const RejectedSection = ({
  rejectionReason,
  kycId: _kycId,
}: {
  rejectionReason?: string | null;
  kycId: string;
}) => (
  <div
    className={`mt-4 rounded-2xl border p-4 ${statusCardClasses.REJECTED}`}
  >
    <p className="text-sm font-semibold text-red-800 ">
      Application Rejected
    </p>
    {rejectionReason ? (
      <p className="mt-1 text-sm text-red-700 ">
        {rejectionReason}
      </p>
    ) : (
      <p className="mt-1 text-sm text-red-700 ">
        No specific reason provided.
      </p>
    )}
    <div className="mt-4 rounded-xl border border-red-200 bg-red-100/50 p-3  ">
      <p className="text-sm font-medium text-red-800 ">
        Need to resubmit?
      </p>
      <p className="mt-1 text-sm text-red-700 ">
        Please review the reason above, correct any issues, and submit a new
        application.
      </p>
      <Link
        to="/dashboard/kyc-submit"
        className="mt-2 inline-block text-sm font-semibold text-red-800 underline "
      >
        Submit New Application
      </Link>
    </div>
  </div>
);

KYCStatusPage.displayName = "KYCStatusPage";

export default memo(KYCStatusPage);
