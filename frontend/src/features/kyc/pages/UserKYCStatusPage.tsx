import { memo, useMemo } from "react";
import { Link } from "react-router-dom";
import { useGetMyKYCStatus } from "@features/kyc/api/kycApi";
import { SkeletonLoader } from "@shared/components/SkeletonLoader";
import { DocumentStatusBadge } from "@shared/components/DocumentStatusBadge";
import type { KYCDocument, DocumentVerificationStatus } from "@shared/types/common";
import { DocumentType } from "@shared/types/common";

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
    case "VERIFIED": return "VERIFIED";
    case "FAILED": return "REJECTED";
    case "MANUAL_REVIEW": return "MANUAL_REVIEW";
    case "PROCESSING": return "PROCESSING";
    default: return "PENDING";
  }
};

const statusClasses: Record<string, string> = {
  PENDING: "bg-yellow-100 text-yellow-800",
  APPROVED: "bg-green-100 text-green-800",
  REJECTED: "bg-danger-100 text-red-800",
  UNDER_REVIEW: "bg-blue-100 text-blue-800",
  RESUBMIT_REQUIRED: "bg-orange-100 text-orange-800",
};

const formatDate = (value?: string | null) => {
  if (!value) return "--";
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? "--"
    : new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric" }).format(date);
};

const UserKYCStatusPage = () => {
  const statusQuery = useGetMyKYCStatus();

  const application = statusQuery.data;
  const documents = useMemo<KYCDocument[]>(
    () => application?.documents ?? [],
    [application?.documents]
  );

  const faceVerification = useMemo(
    () => application?.faceVerification ?? null,
    [application?.faceVerification]
  );

  if (statusQuery.isLoading) {
    return (
      <section className="space-y-6">
        <HeaderShell />
        <SkeletonLoader count={3} type="list" />
      </section>
    );
  }

  if (statusQuery.isError) {
    return (
      <section className="space-y-6">
        <HeaderShell />
        <div className="rounded-3xl border border-red-200 bg-danger-50 p-6 text-red-800">
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

      <div className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-center gap-3">
          <span className={`rounded-full px-3 py-1 text-xs font-semibold ${statusClasses[application.status] ?? statusClasses.PENDING}`}>
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

        {/* Legacy OCR sections intentionally hidden; the live flow requires manual entry and face verification only. */}

        {/* Face Verification Results */}
        {faceVerification ? (
          <div className="mt-6">
            <h2 className="text-lg font-semibold text-gray-900">Face Verification</h2>
            <div className="mt-3 rounded-2xl border p-4" style={{
              borderColor: faceVerification.status === "MATCH" ? "#bbf7d0" : "#fde68a",
              backgroundColor: faceVerification.status === "MATCH" ? "#f0fdf4" : "#fffbeb",
            }}>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-900">Status</span>
                <span className={`text-sm font-semibold ${faceVerification.status === "MATCH" ? "text-green-700" : "text-amber-700"}`}>
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
                        href={doc.filePath}
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

        {application.rejectionReason ? (
          <div className="mt-4 rounded-2xl border border-red-200 bg-danger-50 p-4 text-red-800">
            <p className="text-sm font-semibold">Rejection Reason</p>
            <p className="mt-1 text-sm">{application.rejectionReason}</p>
            <Link
              to="/dashboard/kyc-submit"
              className="mt-3 inline-block text-sm font-semibold text-red-800 underline"
            >
              Submit New Application
            </Link>
          </div>
        ) : null}

        {application.status === "APPROVED" ? (
          <div className="mt-4 rounded-2xl border border-green-200 bg-green-50 p-4 text-green-800">
            <p className="text-sm font-semibold">Application Approved</p>
            <p className="mt-1 text-sm">
              {application.approvalMessage ?? "Your KYC application has been approved."}
            </p>
            <p className="mt-2 text-sm">
              Approved on {formatDate(application.approvedAt)}
            </p>
          </div>
        ) : null}

        {["PENDING", "UNDER_REVIEW", "RESUBMIT_REQUIRED"].includes(application.status) ? (
          <div className="mt-4 rounded-xl border border-blue-200 bg-blue-50 p-3">
            <p className="text-sm font-medium text-blue-800">
              Your application is being reviewed.
            </p>
            <p className="mt-1 text-sm text-blue-700">
              We will notify you when the review is complete.
            </p>
          </div>
        ) : null}
      </div>
    </section>
  );
};

const HeaderShell = () => (
  <div className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
    <p className="text-sm font-semibold uppercase tracking-[0.22em] text-[var(--green-icon)]">
      KYC Status
    </p>
    <h1 className="mt-2 text-3xl font-semibold text-gray-900">
      Your KYC application
    </h1>
  </div>
);

const NoApplicationCard = () => (
  <div className="rounded-3xl border border-dashed border-gray-300 bg-white p-8 text-gray-600 shadow-sm">
    <p className="text-base font-medium text-gray-900">
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

export default memo(UserKYCStatusPage);
