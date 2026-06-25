import { memo, useEffect, useMemo, useState } from "react";
import { AlertCircle, CheckCircle2, Download, XCircle } from "lucide-react";
import { Modal } from "@shared/components/Modal";
import { Button } from "@shared/components/Button";
import { DocumentStatusBadge } from "@shared/components/DocumentStatusBadge";
import { useToast } from "@shared/hooks/useToast";
import { env } from "@shared/lib/env";
import {
  useApproveKYCMutation,
  useRejectKYCMutation,
} from "@features/kyc/api/kycApi";
import type { KYCApplication, KYCDocument, DocumentVerificationStatus } from "@shared/types/common";
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
  PENDING: "bg-yellow-100 text-yellow-800  ",
  APPROVED: "bg-green-100 text-green-800  ",
  REJECTED: "bg-red-100 text-red-800  ",
  UNDER_REVIEW: "bg-blue-100 text-blue-800  ",
  RESUBMIT_REQUIRED: "bg-orange-100 text-orange-800  ",
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

  useEffect(() => {
    if (!isOpen) {
      setShowRejectForm(false);
      setRejectReason("");
      setApproveNotes("");
    }
  }, [isOpen]);

  const documents = useMemo<KYCDocument[]>(
    () => application?.documents ?? [],
    [application?.documents]
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

  const isPending = application?.status === "PENDING";
  const isRejecting = showRejectForm;
  const isMutating = approveMutation.isPending || rejectMutation.isPending;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="KYC Application Details">
      {!application ? null : (
        <div className="space-y-6">
          <div className="flex flex-wrap items-center gap-3">
            <span
              className={`rounded-full px-3 py-1 text-xs font-semibold ${
                statusBadgeClasses[application.status] ?? statusBadgeClasses.PENDING
              }`}
            >
              {application.status}
            </span>
            <p className="text-sm text-gray-500 ">
              Applied {formatDate(application.appliedAt ?? application.submittedAt)}
            </p>
          </div>

          <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4  ">
            <h3 className="text-sm font-semibold text-gray-900 ">
              Applicant Information
            </h3>
            <dl className="mt-3 space-y-2 text-sm">
              <div className="flex justify-between">
                <dt className="text-gray-500 ">Email</dt>
                <dd className="font-medium text-gray-900 ">
                  {application.applicantEmail ?? application.userEmail ?? "--"}
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-gray-500 ">Submitted</dt>
                <dd className="font-medium text-gray-900 ">
                  {formatDate(application.submittedAt)}
                </dd>
              </div>
              {application.reviewedAt ? (
                <div className="flex justify-between">
                  <dt className="text-gray-500 ">Reviewed</dt>
                  <dd className="font-medium text-gray-900 ">
                    {formatDate(application.reviewedAt)}
                  </dd>
                </div>
              ) : null}
            </dl>
          </div>

          <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4  ">
            <h3 className="text-sm font-semibold text-gray-900 ">
              Documents
            </h3>
            {documents.length === 0 ? (
              <p className="mt-3 text-sm text-gray-500 ">
                No documents available.
              </p>
            ) : (
              <ul className="mt-3 divide-y divide-gray-200 ">
                {documents.map((doc) => (
                  <li key={doc.id} className="py-3 first:pt-0 last:pb-0">
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-gray-900 ">
                          {documentTypeLabels[doc.type] ?? doc.type}
                        </p>
                        <p className="mt-0.5 text-xs text-gray-500 ">
                          Uploaded {formatDate(doc.createdAt)}
                        </p>
                      </div>
                      <div className="flex shrink-0 items-center gap-3">
                        <DocumentStatusBadge
                          status={docStatusToBadgeStatus(doc.verificationStatus)}
                        />
                        {isImage(doc.mimeType) ? (
                          <a
                            href={resolveDocumentUrl(doc.filePath)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-gray-200 text-gray-600 transition-colors hover:bg-gray-100   :bg-gray-800"
                            aria-label={`Preview ${documentTypeLabels[doc.type] ?? doc.type}`}
                          >
                            <Download className="h-4 w-4" />
                          </a>
                        ) : null}
                        {isPdf(doc.mimeType) ? (
                          <a
                            href={resolveDocumentUrl(doc.filePath)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 rounded-xl border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-600 transition-colors hover:bg-gray-100   :bg-gray-800"
                          >
                            <Download className="h-3.5 w-3.5" />
                            PDF
                          </a>
                        ) : null}
                      </div>
                    </div>
                    {isImage(doc.mimeType) ? (
                      <div className="mt-3 overflow-hidden rounded-xl border border-gray-200 ">
                        <img
                          src={resolveDocumentUrl(doc.filePath)}
                          alt={documentTypeLabels[doc.type] ?? doc.type}
                          className="max-h-48 w-full object-contain bg-gray-100 "
                        />
                      </div>
                    ) : null}
                  </li>
                ))}
              </ul>
            )}
          </div>

          {application.rejectionReason ? (
            <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-red-800   ">
              <p className="flex items-center gap-2 text-sm font-semibold">
                <AlertCircle className="h-4 w-4" />
                Rejection Reason
              </p>
              <p className="mt-2 text-sm">{application.rejectionReason}</p>
            </div>
          ) : null}

          {isPending ? (
            <div className="space-y-4 border-t border-gray-200 pt-4 ">
              <div>
                <label className="block text-sm font-medium text-gray-700 ">
                  Reviewer Notes
                </label>
                <textarea
                  value={approveNotes}
                  onChange={(e) => setApproveNotes(e.target.value)}
                  placeholder="Optional notes about this application"
                  rows={2}
                  className="mt-1 w-full rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-sm text-gray-900 outline-none transition-colors focus:border-[var(--green-icon)]   "
                />
              </div>

              {isRejecting ? (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-red-700 ">
                      Rejection Reason <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      value={rejectReason}
                      onChange={(e) => setRejectReason(e.target.value)}
                      placeholder="Explain why this application is rejected"
                      rows={3}
                      className="mt-1 w-full rounded-xl border border-red-300 bg-white px-4 py-2.5 text-sm text-gray-900 outline-none transition-colors focus:border-red-500   "
                    />
                    {rejectReason.trim().length > 0 ? null : (
                      <p className="mt-1 text-xs text-red-600 ">
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
            <div className="flex justify-end border-t border-gray-200 pt-4 ">
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
