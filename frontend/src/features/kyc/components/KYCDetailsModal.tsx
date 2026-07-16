import { memo, useEffect, useMemo, useState } from "react";
import {
  AlertCircle, CheckCircle2, Download, ExternalLink, XCircle,
  ArrowRight, ArrowDown, UserCheck, ShieldAlert, FileText
} from "lucide-react";
import { Modal } from "@shared/components/Modal";
import { Button } from "@shared/components/Button";
import { DocumentStatusBadge } from "@shared/components/DocumentStatusBadge";
import { useToast } from "@shared/hooks/useToast";
import { env } from "@shared/lib/env";
import {
  useGetKYCDetails,
  useApproveKYCMutation,
  useRejectKYCMutation,
} from "@features/kyc/api/kycApi";
import type { KYCApplication, KYCDocument, DocumentVerificationStatus } from "@shared/types/common";
import { DocumentType } from "@shared/types/common";

type OCRResult = {
  id: string;
  documentType: string;
  overallConfidence: number;
  extractedData: Record<string, unknown>;
};

type FaceVerification = {
  id: string;
  similarityScore: number;
  status: string;
  recommendation: string;
  citizenshipPhotoPath: string;
  selfiePhotoPath: string;
};

type VerificationReport = {
  id: string;
  faceSimilarity: number | null;
  ocrConfidence: number | null;
  fieldsCorrected: number;
  possibleMismatches: unknown;
  manualReviewSuggested: boolean;
  report: string;
};

type KYCApplicationExtended = KYCApplication & {
  ocrCitizenshipNumber?: string;
  ocrFullName?: string;
  ocrDateOfBirth?: string;
  ocrGender?: string;
  ocrAddress?: string;
  confirmedCitizenshipNumber?: string;
  confirmedFullName?: string;
  confirmedDateOfBirth?: string;
  confirmedGender?: string;
  confirmedAddress?: string;
  confirmedPhoneNumber?: string;
  confirmedEmail?: string;
  confirmedOccupation?: string;
  confirmedEmployer?: string;
  confirmedMonthlyIncome?: number;
  confirmedMaritalStatus?: string;
  confirmedEducationLevel?: string;
  ocrResults?: OCRResult[];
  faceVerification?: FaceVerification;
  verificationReport?: VerificationReport;
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

const statusBadgeClasses: Record<string, string> = {
  PENDING: "bg-yellow-100 text-yellow-800",
  APPROVED: "bg-green-100 text-green-800",
  REJECTED: "bg-red-100 text-red-800",
  UNDER_REVIEW: "bg-blue-100 text-blue-800",
  RESUBMIT_REQUIRED: "bg-orange-100 text-orange-800",
};

const formatDate = (value?: string | null) => {
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

const resolveDocumentUrl = (filePath: string): string => {
  if (!filePath) return "#";
  if (/^https?:\/\//i.test(filePath)) return filePath;
  const base = env.VITE_API_BASE_URL.replace(/\/api\/v1\/?$/, "");
  const normalized = filePath.startsWith("/") ? filePath : `/${filePath}`;
  return `${base}${normalized}`;
};

const isImage = (mimeType: string | undefined | null): boolean => {
  if (!mimeType) return false;
  return mimeType.startsWith("image/");
};

const isPdf = (mimeType: string | undefined | null): boolean => {
  if (!mimeType) return false;
  return mimeType === "application/pdf";
};

const getFileExtension = (filePath: string, mimeType?: string | null): string => {
  if (mimeType) {
    if (mimeType === "application/pdf") return "PDF";
    if (mimeType.startsWith("image/")) return mimeType.split("/")[1].toUpperCase();
  }
  const parts = filePath.split(".");
  return parts.length > 1 ? parts[parts.length - 1].toUpperCase() : "FILE";
};

const similarityColor = (score: number): string => {
  if (score >= 85) return "text-green-600";
  if (score >= 70) return "text-yellow-600";
  return "text-red-600";
};

const similarityBg = (score: number): string => {
  if (score >= 85) return "bg-green-50 border-green-200";
  if (score >= 70) return "bg-yellow-50 border-yellow-200";
  return "bg-red-50 border-red-200";
};

const recommendationIcon = (rec: string | null | undefined) => {
  switch (rec) {
    case "APPROVE": return <CheckCircle2 className="h-4 w-4 text-green-600" />;
    case "REVIEW": return <ShieldAlert className="h-4 w-4 text-yellow-600" />;
    case "REJECT": return <XCircle className="h-4 w-4 text-red-600" />;
    default: return <AlertCircle className="h-4 w-4 text-gray-400" />;
  }
};

const comparisonFields: Array<{ label: string; ocrKey: keyof KYCApplicationExtended; confirmedKey: keyof KYCApplicationExtended }> = [
  { label: "Citizenship Number", ocrKey: "ocrCitizenshipNumber", confirmedKey: "confirmedCitizenshipNumber" },
  { label: "Full Name", ocrKey: "ocrFullName", confirmedKey: "confirmedFullName" },
  { label: "Date of Birth", ocrKey: "ocrDateOfBirth", confirmedKey: "confirmedDateOfBirth" },
  { label: "Gender", ocrKey: "ocrGender", confirmedKey: "confirmedGender" },
  { label: "Address", ocrKey: "ocrAddress", confirmedKey: "confirmedAddress" },
];

type KYCDetailsModalProps = {
  isOpen: boolean;
  onClose: () => void;
  application: KYCApplication | null;
};

const KYCDetailsModal = ({ isOpen, onClose, application }: KYCDetailsModalProps) => {
  const toast = useToast();
  const approveMutation = useApproveKYCMutation();
  const rejectMutation = useRejectKYCMutation();
  const [showRejectForm, setShowRejectForm] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [approveNotes, setApproveNotes] = useState("");

  const { data: detailedApplication, isLoading: loadingDetails } = useGetKYCDetails(
    application?.id ?? ""
  );

  const resolvedApplication = (detailedApplication ?? application) as KYCApplicationExtended | null;

  useEffect(() => {
    if (!isOpen) {
      setShowRejectForm(false);
      setRejectReason("");
      setApproveNotes("");
    }
  }, [isOpen]);

  const documents = useMemo<KYCDocument[]>(
    () => resolvedApplication?.documents ?? [],
    [resolvedApplication?.documents]
  );

  const handleApprove = async () => {
    if (!application?.id) return;
    try {
      await approveMutation.mutateAsync({ id: application.id, notes: approveNotes || undefined });
      toast.success("KYC application approved");
      onClose();
    } catch (error) {
      const apiError = error as { response?: { data?: { message?: string } } };
      toast.error(apiError.response?.data?.message || "Unable to approve application");
    }
  };

  const handleReject = async () => {
    if (!application?.id || !rejectReason.trim()) return;
    try {
      await rejectMutation.mutateAsync({ id: application.id, reason: rejectReason.trim() });
      toast.success("KYC application rejected");
      onClose();
    } catch (error) {
      const apiError = error as { response?: { data?: { message?: string } } };
      toast.error(apiError.response?.data?.message || "Unable to reject application");
    }
  };

  const isPending = resolvedApplication?.status === "PENDING";
  const isRejecting = showRejectForm;
  const isMutating = approveMutation.isPending || rejectMutation.isPending;

  const docUrl = resolveDocumentUrl;
  const app = resolvedApplication;

  const faceVerification = app?.faceVerification;
  const faceScore = faceVerification ? Math.round(faceVerification.similarityScore * 100) : null;

  const report = app?.verificationReport;
  let parsedReport: Record<string, unknown> | null = null;
  if (report?.report) {
    try {
      parsedReport = JSON.parse(report.report);
    } catch {
      parsedReport = null;
    }
  }

  const mismatches: string[] = report?.possibleMismatches
    ? Array.isArray(report.possibleMismatches)
      ? report.possibleMismatches
      : typeof report.possibleMismatches === "string"
        ? JSON.parse(report.possibleMismatches)
        : []
    : [];

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="KYC Application Details">
      {!app ? null : (
        <div className="space-y-6">
          {/* Status header */}
          <div className="flex flex-wrap items-center gap-3">
            <span
              className={`rounded-full px-3 py-1 text-xs font-semibold ${
                statusBadgeClasses[app.status] ?? statusBadgeClasses.PENDING
              }`}
            >
              {app.status}
            </span>
            <p className="text-sm text-gray-500">
              Applied {formatDate(app.appliedAt ?? app.submittedAt)}
            </p>
          </div>

          {/* Applicant Information */}
          <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
            <h3 className="text-sm font-semibold text-gray-900">
              Applicant Information
            </h3>
            <dl className="mt-3 space-y-2 text-sm">
              <div className="flex justify-between">
                <dt className="text-gray-500">Email</dt>
                <dd className="font-medium text-gray-900">
                  {app.applicantEmail ?? app.userEmail ?? "--"}
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-gray-500">Submitted</dt>
                <dd className="font-medium text-gray-900">
                  {formatDate(app.submittedAt)}
                </dd>
              </div>
              {app.reviewedAt ? (
                <div className="flex justify-between">
                  <dt className="text-gray-500">Reviewed</dt>
                  <dd className="font-medium text-gray-900">
                    {formatDate(app.reviewedAt)}
                  </dd>
                </div>
              ) : null}
            </dl>
          </div>

          {/* OCR vs Confirmed Data */}
          {(app.ocrFullName || app.ocrCitizenshipNumber || app.confirmedFullName || app.confirmedCitizenshipNumber) ? (
            <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
              <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                <FileText className="h-4 w-4 text-[var(--green-icon)]" />
                OCR vs Confirmed Data
              </h3>

              {/* OCR Confidence */}
              {app.ocrResults && app.ocrResults.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-4 text-xs text-gray-500">
                  {app.ocrResults.map((ocr) => (
                    <span key={ocr.id}>
                      {ocr.documentType}: {(ocr.overallConfidence * 100).toFixed(0)}% confidence
                    </span>
                  ))}
                </div>
              )}

              <div className="mt-3 overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="py-2 pr-4 text-left font-medium text-gray-500">Field</th>
                      <th className="py-2 pr-4 text-left font-medium text-gray-500">OCR Extracted</th>
                      <th className="py-2 pl-4 text-left font-medium text-gray-500">User Confirmed</th>
                      <th className="py-2 pl-4 w-8" />
                    </tr>
                  </thead>
                  <tbody>
                    {comparisonFields.map((field) => {
                      const ocrVal = (app as KYCApplicationExtended)[field.ocrKey];
                      const confirmedVal = (app as KYCApplicationExtended)[field.confirmedKey];
                      const hasDiff = ocrVal && confirmedVal && ocrVal !== confirmedVal;
                      return (
                        <tr key={field.label} className={`border-b border-gray-100 ${hasDiff ? "bg-red-50/50" : ""}`}>
                          <td className="py-2 pr-4 text-gray-700 font-medium">{field.label}</td>
                          <td className={`py-2 pr-4 ${ocrVal ? "text-gray-900" : "text-gray-400 italic"}`}>
                            {ocrVal || "—"}
                          </td>
                          <td className={`py-2 pl-4 ${confirmedVal ? "text-gray-900" : "text-gray-400 italic"}`}>
                            {confirmedVal || "—"}
                          </td>
                          <td className="py-2 pl-4">
                            {hasDiff ? (
                              <ArrowRight className="h-4 w-4 text-red-500" />
                            ) : confirmedVal ? (
                              <CheckCircle2 className="h-4 w-4 text-green-500" />
                            ) : null}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Confirmed extra fields */}
              <div className="mt-3 grid grid-cols-2 gap-3 text-sm">
                {(app.confirmedPhoneNumber || app.confirmedEmail || app.confirmedOccupation || app.confirmedEmployer || app.confirmedMonthlyIncome || app.confirmedMaritalStatus || app.confirmedEducationLevel) && (
                  <>
                    <h4 className="col-span-2 text-xs font-semibold uppercase tracking-wider text-gray-500 mt-1">
                      Additional Confirmed Information
                    </h4>
                    {app.confirmedPhoneNumber && (
                      <div><span className="text-gray-500">Phone:</span> <span className="text-gray-900">{app.confirmedPhoneNumber}</span></div>
                    )}
                    {app.confirmedEmail && (
                      <div><span className="text-gray-500">Email:</span> <span className="text-gray-900">{app.confirmedEmail}</span></div>
                    )}
                    {app.confirmedOccupation && (
                      <div><span className="text-gray-500">Occupation:</span> <span className="text-gray-900">{app.confirmedOccupation}</span></div>
                    )}
                    {app.confirmedEmployer && (
                      <div><span className="text-gray-500">Employer:</span> <span className="text-gray-900">{app.confirmedEmployer}</span></div>
                    )}
                    {app.confirmedMonthlyIncome != null && (
                      <div><span className="text-gray-500">Monthly Income:</span> <span className="text-gray-900">${Number(app.confirmedMonthlyIncome).toLocaleString()}</span></div>
                    )}
                    {app.confirmedMaritalStatus && (
                      <div><span className="text-gray-500">Marital Status:</span> <span className="text-gray-900">{app.confirmedMaritalStatus}</span></div>
                    )}
                    {app.confirmedEducationLevel && (
                      <div><span className="text-gray-500">Education:</span> <span className="text-gray-900">{app.confirmedEducationLevel}</span></div>
                    )}
                  </>
                )}
              </div>
            </div>
          ) : null}

          {/* Face Verification */}
          {faceVerification && faceScore !== null ? (
            <div className={`rounded-2xl border p-4 ${similarityBg(faceScore)}`}>
              <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                <UserCheck className="h-4 w-4" />
                Face Verification
              </h3>
              <div className="mt-3 flex items-center gap-4">
                <div className={`text-3xl font-bold ${similarityColor(faceScore)}`}>
                  {faceScore}%
                </div>
                <div className="flex-1">
                  <div className="h-2 w-full rounded-full bg-gray-200">
                    <div
                      className={`h-2 rounded-full transition-all ${
                        faceScore >= 85 ? "bg-green-500" : faceScore >= 70 ? "bg-yellow-500" : "bg-red-500"
                      }`}
                      style={{ width: `${Math.min(faceScore, 100)}%` }}
                    />
                  </div>
                  <div className="mt-1 flex items-center gap-2">
                    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${
                      faceVerification.status === "MATCH" ? "bg-green-100 text-green-800" :
                      faceVerification.status === "POSSIBLE_MATCH" ? "bg-yellow-100 text-yellow-800" :
                      "bg-red-100 text-red-800"
                    }`}>
                      {faceVerification.status}
                    </span>
                    {faceVerification.recommendation && (
                      <span className="inline-flex items-center gap-1 text-xs font-medium text-gray-600">
                        {recommendationIcon(faceVerification.recommendation)}
                        {faceVerification.recommendation}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ) : null}

          {/* Verification Report */}
          {report ? (
            <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
              <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                <ShieldAlert className="h-4 w-4 text-[var(--green-icon)]" />
                Verification Report
              </h3>
              <div className="mt-3 grid grid-cols-2 gap-4 text-sm">
                {parsedReport?.ocrConfidence != null && (
                  <div>
                    <span className="text-gray-500">OCR Confidence:</span>
                    <span className={`ml-2 font-semibold ${Number(parsedReport.ocrConfidence) >= 80 ? "text-green-600" : "text-red-600"}`}>
                      {parsedReport.ocrConfidence}%
                    </span>
                  </div>
                )}
                {parsedReport?.faceSimilarity != null && (
                  <div>
                    <span className="text-gray-500">Face Match:</span>
                    <span className={`ml-2 font-semibold ${Number(parsedReport.faceSimilarity) >= 85 ? "text-green-600" : "text-red-600"}`}>
                      {parsedReport.faceSimilarity}%
                    </span>
                  </div>
                )}
                <div>
                  <span className="text-gray-500">Fields Corrected:</span>
                  <span className="ml-2 font-semibold text-gray-900">{report.fieldsCorrected}</span>
                </div>
                <div>
                  <span className="text-gray-500">Manual Review:</span>
                  <span className={`ml-2 font-semibold ${report.manualReviewSuggested ? "text-red-600" : "text-green-600"}`}>
                    {report.manualReviewSuggested ? "Required" : "Not Required"}
                  </span>
                </div>
              </div>
              {mismatches.length > 0 && (
                <div className="mt-3 rounded-xl border border-red-200 bg-red-50 p-3">
                  <p className="text-xs font-semibold text-red-800 flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    Possible Mismatches
                  </p>
                  <ul className="mt-1 list-inside list-disc text-xs text-red-700">
                    {mismatches.map((m: string) => (
                      <li key={m}>{m}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          ) : null}

          {/* Documents */}
          <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
            <h3 className="text-sm font-semibold text-gray-900">
              Documents
            </h3>
            {loadingDetails ? (
              <p className="mt-3 text-sm text-gray-500">Loading documents...</p>
            ) : documents.length === 0 ? (
              <p className="mt-3 text-sm text-gray-500">
                No documents available.
              </p>
            ) : (
              <ul className="mt-3 divide-y divide-gray-200">
                {documents.map((doc) => (
                  <li key={doc.id} className="py-3 first:pt-0 last:pb-0">
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-gray-900">
                          {documentTypeLabels[doc.type] ?? doc.type}
                        </p>
                        <p className="mt-0.5 text-xs text-gray-500">
                          Uploaded {formatDate(doc.createdAt)}
                        </p>
                      </div>
                      <div className="flex shrink-0 items-center gap-3">
                        <DocumentStatusBadge
                          status={docStatusToBadgeStatus(doc.verificationStatus)}
                        />
                        <a
                          href={docUrl(doc.filePath)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-gray-200 text-gray-600 transition-colors hover:bg-gray-100"
                          aria-label={`View ${documentTypeLabels[doc.type] ?? doc.type}`}
                          title={`Open ${getFileExtension(doc.filePath, doc.mimeType)}`}
                        >
                          <ExternalLink className="h-4 w-4" />
                        </a>
                      </div>
                    </div>
                    {isImage(doc.mimeType) ? (
                      <div className="mt-3 overflow-hidden rounded-xl border border-gray-200">
                        <img
                          src={docUrl(doc.filePath)}
                          alt={documentTypeLabels[doc.type] ?? doc.type}
                          className="max-h-48 w-full object-contain bg-gray-100"
                        />
                      </div>
                    ) : null}
                    {isPdf(doc.mimeType) && !isImage(doc.mimeType) ? (
                      <div className="mt-3">
                        <a
                          href={docUrl(doc.filePath)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-2 rounded-xl border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-100"
                        >
                          <Download className="h-4 w-4" />
                          Open PDF Document
                        </a>
                      </div>
                    ) : null}
                  </li>
                ))}
              </ul>
            )}
          </div>

          {app.rejectionReason ? (
            <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-red-800">
              <p className="flex items-center gap-2 text-sm font-semibold">
                <AlertCircle className="h-4 w-4" />
                Rejection Reason
              </p>
              <p className="mt-2 text-sm">{app.rejectionReason}</p>
            </div>
          ) : null}

          <ArrowDown className="mx-auto h-5 w-5 text-gray-300" />

          {isPending ? (
            <div className="space-y-4 border-t border-gray-200 pt-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Reviewer Notes
                </label>
                <textarea
                  value={approveNotes}
                  onChange={(e) => setApproveNotes(e.target.value)}
                  placeholder="Optional notes about this application"
                  rows={2}
                  className="mt-1 w-full rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-sm text-gray-900 outline-none transition-colors focus:border-[var(--green-icon)]"
                />
              </div>

              {isRejecting ? (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-red-700">
                      Rejection Reason <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      value={rejectReason}
                      onChange={(e) => setRejectReason(e.target.value)}
                      placeholder="Explain why this application is rejected"
                      rows={3}
                      className="mt-1 w-full rounded-xl border border-red-300 bg-white px-4 py-2.5 text-sm text-gray-900 outline-none transition-colors focus:border-red-500"
                    />
                    {rejectReason.trim().length > 0 ? null : (
                      <p className="mt-1 text-xs text-red-600">
                        Reason is required
                      </p>
                    )}
                  </div>
                  <div className="flex flex-wrap items-center justify-end gap-3">
                    <Button
                      variant="ghost"
                      type="button"
                      onClick={() => {
                        setShowRejectForm(false);
                        setRejectReason("");
                      }}
                      disabled={isMutating}
                    >
                      Cancel
                    </Button>
                    <Button
                      variant="danger"
                      type="button"
                      onClick={handleReject}
                      isLoading={rejectMutation.isPending}
                      disabled={!rejectReason.trim()}
                      leftIcon={<XCircle className="h-4 w-4" />}
                    >
                      Confirm Reject
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="flex flex-wrap items-center justify-end gap-3">
                  <Button variant="ghost" type="button" onClick={onClose}>
                    Close
                  </Button>
                  <Button
                    variant="danger"
                    type="button"
                    onClick={() => setShowRejectForm(true)}
                    disabled={isMutating}
                    leftIcon={<XCircle className="h-4 w-4" />}
                  >
                    Reject
                  </Button>
                  <Button
                    type="button"
                    onClick={handleApprove}
                    isLoading={approveMutation.isPending}
                    disabled={isMutating}
                    leftIcon={<CheckCircle2 className="h-4 w-4" />}
                  >
                    Approve
                  </Button>
                </div>
              )}
            </div>
          ) : (
            <div className="flex justify-end border-t border-gray-200 pt-4">
              <Button variant="ghost" type="button" onClick={onClose}>
                Close
              </Button>
            </div>
          )}
        </div>
      )}
    </Modal>
  );
};

KYCDetailsModal.displayName = "KYCDetailsModal";

export { KYCDetailsModal };
export default memo(KYCDetailsModal);
