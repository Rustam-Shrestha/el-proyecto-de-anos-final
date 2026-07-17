import { memo, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { CheckCircle2, XCircle } from "lucide-react";
import { Modal } from "@shared/components/Modal";
import { Button } from "@shared/components/Button";
import RiskScoreBadge from "@features/loans/components/RiskScoreBadge";
import { useToast } from "@shared/hooks/useToast";
import { useReviewLoanMutation } from "@features/loans/api/loansApi";
import type { LoanApplication, LoanStatus, RiskLevel } from "@shared/types/common";

const statusBadgeClasses: Record<string, string> = {
  PENDING: "bg-yellow-100 text-yellow-800  ",
  UNDER_REVIEW: "bg-blue-100 text-blue-800  ",
  APPROVED: "bg-green-100 text-green-800  ",
  REJECTED: "bg-danger-100 text-red-800",
  DISBURSED: "bg-purple-100 text-purple-800  ",
  ACTIVE: "bg-indigo-100 text-indigo-800  ",
  CLOSED: "bg-gray-100 text-gray-800  ",
  DEFAULTED: "bg-orange-100 text-orange-800  ",
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

const formatNPR = (value?: number) => {
  if (value == null) return "--";
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "NPR",
    maximumFractionDigits: 0,
  }).format(value);
};

const purposeLabel: Record<string, string> = {
  HOME: "Home",
  EDUCATION: "Education",
  BUSINESS: "Business",
  PERSONAL: "Personal",
  VEHICLE: "Vehicle",
  AGRICULTURE: "Agriculture",
  OTHER: "Other",
};

type LoanDetailsModalProps = {
  isOpen: boolean;
  onClose: () => void;
  loan: LoanApplication | null;
  riskScore?: number | null;
};

const LoanDetailsModal = ({ isOpen, onClose, loan }: LoanDetailsModalProps) => {
  const toast = useToast();
  const reviewMutation = useReviewLoanMutation();
  const [action, setAction] = useState<"approve" | "reject" | null>(null);
  const [notes, setNotes] = useState("");

  useEffect(() => {
    if (!isOpen) {
      setAction(null);
      setNotes("");
    }
  }, [isOpen]);

  if (!loan) return null;

  const isReviewable = loan.status === "PENDING" || loan.status === "UNDER_REVIEW";
  const isSubmitting = reviewMutation.isPending;

  const handleApprove = async () => {
    try {
      await reviewMutation.mutateAsync({
        id: loan.id,
        status: "APPROVED" as LoanStatus,
        notes: notes || undefined,
      });
      toast.success("Loan application approved");
      onClose();
    } catch (error) {
      const apiError = error as { response?: { data?: { message?: string } } };
      toast.error(apiError.response?.data?.message || "Unable to approve application");
    }
  };

  const handleReject = async () => {
    if (!notes.trim()) return;
    try {
      await reviewMutation.mutateAsync({
        id: loan.id,
        status: "REJECTED" as LoanStatus,
        notes,
        rejectionReason: notes,
      });
      toast.success("Loan application rejected");
      onClose();
    } catch (error) {
      const apiError = error as { response?: { data?: { message?: string } } };
      toast.error(apiError.response?.data?.message || "Unable to reject application");
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Loan Application Details">
      <div className="space-y-5">
        <div className="flex flex-wrap items-center gap-3">
          <span
            className={`rounded-full px-3 py-1 text-xs font-semibold ${
              statusBadgeClasses[loan.status] ?? statusBadgeClasses.PENDING
            }`}
          >
            {loan.status}
          </span>
          <p className="text-sm text-gray-500 ">
            Applied {formatDate(loan.appliedAt)}
          </p>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4  ">
          <h3 className="text-sm font-semibold text-gray-900 ">Loan Details</h3>
          <dl className="mt-3 space-y-2 text-sm">
            <Row label="Amount" value={formatNPR(loan.amount)} />
            <Row label="Tenure" value={`${loan.termMonths} months`} />
            <Row label="Purpose" value={purposeLabel[loan.purpose] ?? loan.purpose} />
            <Row label="Monthly EMI" value={formatNPR(loan.monthlyPayment)} />
            <Row label="Total Repayment" value={formatNPR(loan.totalRepayment)} />
            <Row label="Interest Rate" value={loan.interestRate ? `${loan.interestRate}%` : "18% (default)"} />
          </dl>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4  ">
          <h3 className="text-sm font-semibold text-gray-900 ">Applicant</h3>
          <dl className="mt-3 space-y-2 text-sm">
            <Row label="User ID" value={loan.userId} />
            {loan.userId ? (
              <div className="flex justify-between">
                <dt className="text-gray-500 ">KYC</dt>
                <dd>
                  <Link
                    to={`/dashboard/kyc`}
                    className="font-medium text-blue-600 underline "
                  >
                    View KYC
                  </Link>
                </dd>
              </div>
            ) : null}
          </dl>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4  ">
          <h3 className="text-sm font-semibold text-gray-900 ">Risk Assessment</h3>
          <div className="mt-3 flex items-center gap-3">
            <RiskScoreBadge
              score={null}
              level={(loan.riskLevel as RiskLevel) ?? null}
            />
          </div>
          <dl className="mt-3 space-y-2 text-sm">
            <Row label="Risk Level" value={loan.riskLevel ? formatRiskLevel(loan.riskLevel) : "Pending"} />
          </dl>
        </div>

        {loan.rejectionReason ? (
          <div className="rounded-2xl border border-red-200 bg-danger-50 p-4 text-red-800">
            <p className="text-sm font-semibold">Rejection Reason</p>
            <p className="mt-1 text-sm">{loan.rejectionReason}</p>
          </div>
        ) : null}

        {isReviewable ? (
          <div className="space-y-4 border-t border-gray-200 pt-4 ">
            {action === "reject" ? (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-red-700 ">
                    Rejection Notes <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Explain why this application is rejected"
                    rows={3}
                    className="mt-1 w-full rounded-xl border border-red-300 bg-white px-4 py-2.5 text-sm text-gray-900 outline-none transition-colors focus:border-red-500   "
                  />
                  {notes.trim().length > 0 ? null : (
                    <p className="mt-1 text-xs text-red-600 ">Notes are required</p>
                  )}
                </div>
                <div className="flex flex-wrap items-center justify-end gap-3">
                  <Button variant="ghost" type="button" onClick={() => { setAction(null); setNotes(""); }} disabled={isSubmitting}>
                    Cancel
                  </Button>
                  <Button variant="danger" type="button" onClick={handleReject} isLoading={isSubmitting} disabled={!notes.trim()}>
                    Confirm Reject
                  </Button>
                </div>
              </div>
            ) : action === "approve" ? (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 ">
                    Approval Notes
                  </label>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Optional notes"
                    rows={2}
                    className="mt-1 w-full rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-sm text-gray-900 outline-none transition-colors focus:border-[var(--green-icon)]   "
                  />
                </div>
                <div className="flex flex-wrap items-center justify-end gap-3">
                  <Button variant="ghost" type="button" onClick={() => { setAction(null); setNotes(""); }} disabled={isSubmitting}>
                    Cancel
                  </Button>
                  <Button type="button" onClick={handleApprove} isLoading={isSubmitting} leftIcon={<CheckCircle2 className="h-4 w-4" />}>
                    Confirm Approve
                  </Button>
                </div>
              </div>
            ) : (
              <div className="flex flex-wrap items-center justify-end gap-3">
                <Button variant="ghost" type="button" onClick={onClose}>Close</Button>
                <Button variant="danger" type="button" onClick={() => setAction("reject")} disabled={isSubmitting} leftIcon={<XCircle className="h-4 w-4" />}>
                  Reject
                </Button>
                <Button type="button" onClick={() => setAction("approve")} disabled={isSubmitting} leftIcon={<CheckCircle2 className="h-4 w-4" />}>
                  Approve
                </Button>
              </div>
            )}
          </div>
        ) : (
          <div className="flex justify-end border-t border-gray-200 pt-4 ">
            <Button variant="ghost" type="button" onClick={onClose}>Close</Button>
          </div>
        )}
      </div>
    </Modal>
  );
};

const Row = ({ label, value }: { label: string; value: string }) => (
  <div className="flex justify-between">
    <dt className="text-gray-500 ">{label}</dt>
    <dd className="font-medium text-gray-900 ">{value}</dd>
  </div>
);

const formatRiskLevel = (level: string) =>
  level.charAt(0) + level.slice(1).toLowerCase();

LoanDetailsModal.displayName = "LoanDetailsModal";

export { LoanDetailsModal };
export default memo(LoanDetailsModal);
