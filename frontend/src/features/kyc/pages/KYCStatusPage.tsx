import { memo, useMemo } from "react";
import { Link } from "react-router-dom";
import { useGetMyKYCStatus } from "@features/kyc/api/kycApi";
import { SkeletonLoader } from "@shared/components/SkeletonLoader";
import { DocumentStatusBadge } from "@shared/components/DocumentStatusBadge";
import PageHeader from "@shared/components/PageHeader";
import Breadcrumb from "@components/seo/Breadcrumb";
import Card from "@shared/components/Card";
import { env } from "@shared/lib/env";
import type { KYCApplication, KYCDocument, DocumentVerificationStatus } from "@shared/types/common";
import { DocumentType } from "@shared/types/common";
import { CheckCircle2, AlertCircle, FileCheck } from "lucide-react";

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
  [DocumentType.SELFIE]: "Selfie Verification Photo",
  [DocumentType.INCOME_PROOF]: "Income Proof",
  [DocumentType.BANK_STATEMENT]: "Bank Statement",
  [DocumentType.EXISTING_LOAN]: "Existing Loan Document",
  [DocumentType.COLLATERAL]: "Collateral Document",
  [DocumentType.OTHER]: "Other Document",
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
  PENDING: "border-amber-200 bg-amber-50/60",
  APPROVED: "border-green-200 bg-green-50/60",
  REJECTED: "border-red-200 bg-red-50/60",
  UNDER_REVIEW: "border-blue-200 bg-blue-50/60",
};

const statusLabelClasses: Record<string, string> = {
  PENDING: "bg-amber-100 text-amber-800 border-amber-200",
  APPROVED: "bg-green-100 text-green-800 border-green-200",
  REJECTED: "bg-red-100 text-red-800 border-red-200",
  UNDER_REVIEW: "bg-blue-100 text-blue-800 border-blue-200",
  RESUBMIT_REQUIRED: "bg-orange-100 text-orange-800 border-orange-200",
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

  const faceVerification = useMemo(
    () => application?.faceVerification ?? null,
    [application?.faceVerification]
  );

  const extractionVerification = useMemo(
    () => (application as KYCApplication & { extractionVerification?: { autoVerified: boolean; ocrConfidence: number; matchScore?: number; locked: boolean } })?.extractionVerification ?? null,
    [application]
  );

  if (isLoading) {
    return (
      <section className="space-y-4">
        <PageHeader
          breadcrumb={<Breadcrumb items={[{ label: "Dashboard", href: "/dashboard" }, { label: "KYC Status" }]} />}
          title="KYC Application Status"
        />
        <SkeletonLoader count={3} type="list" />
      </section>
    );
  }

  if (isError) {
    return (
      <section className="space-y-4">
        <PageHeader
          breadcrumb={<Breadcrumb items={[{ label: "Dashboard", href: "/dashboard" }, { label: "KYC Status" }]} />}
          title="KYC Application Status"
        />
        <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-red-800">
          <div className="flex items-center gap-3">
            <AlertCircle className="h-5 w-5 text-red-600 shrink-0" />
            <div>
              <p className="text-base font-medium">Unable to load your KYC status.</p>
              <p className="mt-1 text-xs text-red-600">Please try again later or reach out to support.</p>
            </div>
          </div>
          <Link
            to="/dashboard/kyc-submit"
            className="mt-4 inline-flex items-center rounded-lg bg-[var(--primary)] px-4 py-2 text-xs font-semibold text-white transition-opacity hover:opacity-95"
          >
            Submit KYC Application
          </Link>
        </div>
      </section>
    );
  }

  if (!application) {
    return (
      <section className="space-y-4">
        <PageHeader
          breadcrumb={<Breadcrumb items={[{ label: "Dashboard", href: "/dashboard" }, { label: "KYC Status" }]} />}
          title="KYC Application Status"
        />
        <NoApplicationCard />
      </section>
    );
  }

  return (
    <section className="space-y-4">
      <PageHeader
        breadcrumb={<Breadcrumb items={[{ label: "Dashboard", href: "/dashboard" }, { label: "KYC Status" }]} />}
        title="KYC Application Status"
      />

      <Card className="p-6">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#E2E8F0] pb-4">
          <div className="flex items-center gap-2">
            <span
              className={`rounded-full border px-3 py-1 text-xs font-semibold ${
                statusLabelClasses[application.status] ?? statusLabelClasses.PENDING
              }`}
            >
              {application.status.replace(/_/g, " ")}
            </span>
            <span className="text-xs text-[#64748B]">
              Submitted on {formatDate(application.appliedAt ?? application.submittedAt)}
            </span>
          </div>
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

        {/* Legacy OCR sections intentionally hidden; the live flow requires manual entry and face verification only. */}

        {/* Extraction Verification (auto-verify or queue) */}
        {extractionVerification ? (
          <div className="mt-6">
            <h2 className="text-lg font-semibold text-gray-900">Data Verification</h2>
            <div className="mt-3 rounded-2xl border p-4" style={{
              borderColor: extractionVerification.autoVerified ? "var(--green-200, #bbf7d0)" : "var(--amber-200, #fde68a)",
              backgroundColor: extractionVerification.autoVerified ? "var(--green-50, #f0fdf4)" : "var(--amber-50, #fffbeb)",
            }}>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-900">Decision</span>
                <span className={`text-sm font-semibold ${
                  extractionVerification.autoVerified ? "text-green-700" : "text-amber-700"
                }`}>
                  {extractionVerification.autoVerified ? "Auto-Verified" : "Queued for Review"}
                </span>
              </div>
              <div className="mt-2 flex items-center justify-between">
                <span className="text-sm text-gray-500">OCR Confidence</span>
                <span className="text-sm font-medium text-gray-900">
                  {Math.round(extractionVerification.ocrConfidence * 100)}%
                </span>
              </div>
              {extractionVerification.matchScore != null ? (
                <div className="mt-2 flex items-center justify-between">
                  <span className="text-sm text-gray-500">Data Match Score</span>
                  <span className="text-sm font-medium text-gray-900">{extractionVerification.matchScore}%</span>
                </div>
              ) : null}
              <div className="mt-2 text-xs text-gray-500">
                Locked: {extractionVerification.locked ? "Yes (final)" : "No"}
              </div>
            </div>
          </div>
        ) : null}

        {/* Face Verification Results */}
        {faceVerification ? (
          <div className="mt-6">
            <h2 className="text-lg font-semibold text-gray-900">Face Verification</h2>
            <div className="mt-3 rounded-2xl border p-4" style={{
              borderColor: faceVerification.status === "MATCH" ? "var(--green-200, #bbf7d0)" : "var(--amber-200, #fde68a)",
              backgroundColor: faceVerification.status === "MATCH" ? "var(--green-50, #f0fdf4)" : "var(--amber-50, #fffbeb)",
            }}>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-900">Status</span>
                <span className={`text-sm font-semibold ${
                  faceVerification.status === "MATCH" ? "text-green-700" : "text-amber-700"
                }`}>
                  {faceVerification.status === "MATCH" ? "Face Matched" : faceVerification.status}
                </span>
              </div>
              <div className="mt-2 flex items-center justify-between">
                <span className="text-sm text-gray-500">Similarity Score</span>
                <span className="text-sm font-medium text-gray-900">
                  {(faceVerification.similarityScore * 100).toFixed(1)}%
                </span>
              </div>
              {faceVerification.recommendation ? (
                <div className="mt-2 flex items-center justify-between">
                  <span className="text-sm text-gray-500">Recommendation</span>
                  <span className="text-sm font-medium text-gray-900">{faceVerification.recommendation}</span>
                </div>
              ) : null}
            </div>
          </div>
        ) : null}

        {application.confirmedFullName || application.confirmedCitizenshipNumber ? (
          <div className="mt-6">
            <h2 className="text-lg font-semibold text-gray-900">Confirmed Information</h2>
            <div className="mt-3 rounded-2xl border border-green-200 bg-green-50 p-4">
              <dl className="space-y-2 text-sm">
                {application.confirmedFullName ? (
                  <div className="flex justify-between">
                    <dt className="text-gray-500">Full Name</dt>
                    <dd className="font-medium text-gray-900">{application.confirmedFullName}</dd>
                  </div>
                ) : null}
                {application.confirmedCitizenshipNumber ? (
                  <div className="flex justify-between">
                    <dt className="text-gray-500">Citizenship Number</dt>
                    <dd className="font-medium text-gray-900">{application.confirmedCitizenshipNumber}</dd>
                  </div>
                ) : null}
                {application.confirmedDateOfBirth ? (
                  <div className="flex justify-between">
                    <dt className="text-gray-500">Date of Birth</dt>
                    <dd className="font-medium text-gray-900">{application.confirmedDateOfBirth}</dd>
                  </div>
                ) : null}
                {application.confirmedPhoneNumber ? (
                  <div className="flex justify-between">
                    <dt className="text-gray-500">Phone</dt>
                    <dd className="font-medium text-gray-900">{application.confirmedPhoneNumber}</dd>
                  </div>
                ) : null}
                {application.confirmedEmail ? (
                  <div className="flex justify-between">
                    <dt className="text-gray-500">Email</dt>
                    <dd className="font-medium text-gray-900">{application.confirmedEmail}</dd>
                  </div>
                ) : null}
              </dl>
            </div>
          </div>
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
      </Card>
    </section>
  );
};

const NoApplicationCard = () => (
  <Card className="p-8 text-center">
    <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[var(--primary-soft)] text-[var(--primary)]">
      <FileCheck className="h-6 w-6" />
    </div>
    <h3 className="mt-3 text-base font-semibold text-[#0F172A]">
      No KYC application found
    </h3>
    <p className="mx-auto mt-1 max-w-md text-xs text-[#64748B]">
      You have not submitted a KYC application yet. Complete verification to unlock loan applications.
    </p>
    <Link
      to="/dashboard/kyc-submit"
      className="mt-4 inline-flex items-center rounded-lg bg-[var(--primary)] px-4 py-2 text-xs font-semibold text-white transition-opacity hover:opacity-95"
    >
      Submit KYC Application
    </Link>
  </Card>
);

const ApprovedSection = ({
  approvedAt,
  approvalMessage,
}: {
  approvedAt?: string | null;
  approvalMessage?: string | null;
}) => (
  <div
    className={`mt-4 rounded-xl border p-4 ${statusCardClasses.APPROVED}`}
  >
    <div className="flex items-center gap-2">
      <CheckCircle2 className="h-4 w-4 text-green-700" />
      <p className="text-sm font-semibold text-green-800">
        Application Approved
      </p>
    </div>
    <p className="mt-1 text-xs text-green-700">
      {approvalMessage ?? "Your identity has been verified. You can now explore lenders and apply for loans."}
    </p>
    <p className="mt-2 text-[11px] text-green-600">
      Approved on {formatDate(approvedAt)}
    </p>
    <div className="mt-3 rounded-lg border border-green-200 bg-white/80 p-3">
      <p className="text-xs font-medium text-green-900">
        Next Steps
      </p>
      <p className="mt-0.5 text-xs text-green-700">
        Browse eligible lenders to submit your first loan application.
      </p>
      <Link
        to="/dashboard/lenders"
        className="mt-2 inline-flex items-center text-xs font-semibold text-[var(--primary)] hover:underline"
      >
        Browse lenders &rarr;
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
    className={`mt-4 rounded-xl border p-4 ${statusCardClasses.REJECTED}`}
  >
    <div className="flex items-center gap-2">
      <AlertCircle className="h-4 w-4 text-red-700" />
      <p className="text-sm font-semibold text-red-800">
        Application Rejected
      </p>
    </div>
    {rejectionReason ? (
      <p className="mt-1 text-xs text-red-700">
        {rejectionReason}
      </p>
    ) : (
      <p className="mt-1 text-xs text-red-700">
        Please review your identity documents and try resubmitting.
      </p>
    )}
    <div className="mt-3 rounded-lg border border-red-200 bg-white/80 p-3">
      <p className="text-xs font-medium text-red-900">
        Need to resubmit?
      </p>
      <p className="mt-0.5 text-xs text-red-700">
        Please correct any issues and submit an updated application.
      </p>
      <Link
        to="/dashboard/kyc-submit"
        className="mt-2 inline-flex items-center text-xs font-semibold text-red-700 hover:underline"
      >
        Submit New Application &rarr;
      </Link>
    </div>
  </div>
);

KYCStatusPage.displayName = "KYCStatusPage";

export default memo(KYCStatusPage);
