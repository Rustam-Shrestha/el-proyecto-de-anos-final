import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { AlertCircle, CheckCircle2, XCircle } from "lucide-react";
import { Modal } from "@shared/components/Modal";
import { Button } from "@components/Button";
import Input from "@components/Input";
import { useToast } from "@hooks/useToast";
import {
  type KYCApplication,
  useApproveKYCMutation,
  useRejectKYCMutation,
} from "@features/kyc/api/kycApi";

const rejectSchema = z.object({
  reason: z.string().min(3, "Reason is required"),
  notes: z.string().optional(),
});

type RejectFormValues = z.infer<typeof rejectSchema>;

type KYCDetailsModalProps = {
  isOpen: boolean;
  onClose: () => void;
  application: KYCApplication | null;
  onSuccess: () => void;
};

const statusBadgeClasses: Record<KYCApplication["status"], string> = {
  PENDING: "bg-yellow-100 text-yellow-800 dark:bg-yellow-500/15 dark:text-yellow-300",
  APPROVED: "bg-green-100 text-green-800 dark:bg-green-500/15 dark:text-green-300",
  REJECTED: "bg-red-100 text-red-800 dark:bg-red-500/15 dark:text-red-300",
};

export const KYCDetailsModal = ({ isOpen, onClose, application, onSuccess }: KYCDetailsModalProps) => {
  const toast = useToast();
  const approveMutation = useApproveKYCMutation();
  const rejectMutation = useRejectKYCMutation();
  const [showRejectForm, setShowRejectForm] = useState(false);

  const {
    register,
    handleSubmit,
    getValues,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<RejectFormValues>({
    resolver: zodResolver(rejectSchema),
    defaultValues: {
      reason: "",
      notes: "",
    },
  });

  useEffect(() => {
    if (!isOpen) {
      setShowRejectForm(false);
      reset({ reason: "", notes: "" });
    }
  }, [isOpen, reset]);

  const documents = useMemo(() => {
    return application?.documents ?? [];
  }, [application?.documents]);

  const handleApprove = async () => {
    if (!application?.id) {
      return;
    }

    try {
      await approveMutation.mutateAsync({ id: application.id, notes: getValues("notes") });
      toast.success("KYC application approved");
      onSuccess();
      onClose();
    } catch (error) {
      const apiError = error as { response?: { data?: { message?: string } } };
      toast.error(apiError.response?.data?.message || "Unable to approve application");
    }
  };

  const handleReject = handleSubmit(async (values) => {
    if (!application?.id) {
      return;
    }

    try {
      await rejectMutation.mutateAsync({ id: application.id, reason: values.reason });
      toast.success("KYC application rejected");
      onSuccess();
      onClose();
    } catch (error) {
      const apiError = error as { response?: { data?: { message?: string } } };
      toast.error(apiError.response?.data?.message || "Unable to reject application");
    }
  });

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={application?.applicantEmail || "KYC Details"}>
      {!application ? null : (
        <div className="space-y-5">
          <div className="flex flex-wrap items-center gap-3">
            <span className={`rounded-full px-3 py-1 text-xs font-semibold ${statusBadgeClasses[application.status]}`}>
              {application.status}
            </span>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Applied {new Date(application.appliedAt ?? application.applied_at ?? Date.now()).toLocaleDateString()}
            </p>
          </div>

          <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4 dark:border-gray-800 dark:bg-gray-950/40">
            <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">Uploaded Documents</p>
            {documents.length ? (
              <ul className="mt-3 space-y-2 text-sm text-gray-600 dark:text-gray-300">
                {documents.map((document, index) => (
                  <li key={document.id ?? `${document.name ?? document.filename ?? "document"}-${index}`}>
                    {document.name ?? document.filename ?? `Document ${index + 1}`}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">No documents available.</p>
            )}
          </div>

          {application.rejectionReason || application.rejection_reason ? (
            <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-red-800 dark:border-red-900/40 dark:bg-red-950/40 dark:text-red-200">
              <p className="flex items-center gap-2 text-sm font-semibold">
                <AlertCircle className="h-4 w-4" />
                Rejection Reason
              </p>
              <p className="mt-2 text-sm">{application.rejectionReason ?? application.rejection_reason}</p>
            </div>
          ) : null}

          {application.status === "PENDING" ? (
            <div className="space-y-4 border-t border-gray-200 pt-4 dark:border-gray-800">
              <Input label="Reviewer Notes" placeholder="Optional notes" {...register("notes")} />

              {showRejectForm ? (
                <form className="space-y-4" onSubmit={handleReject}>
                  <Input
                    label="Rejection Reason"
                    placeholder="Explain why this application is rejected"
                    error={errors.reason?.message}
                    {...register("reason")}
                  />
                  <div className="flex flex-wrap items-center justify-end gap-3">
                    <Button variant="ghost" type="button" onClick={() => setShowRejectForm(false)}>
                      Cancel
                    </Button>
                    <Button
                      variant="danger"
                      type="submit"
                      isLoading={isSubmitting || rejectMutation.isPending}
                      leftIcon={<XCircle className="h-4 w-4" />}
                    >
                      Reject
                    </Button>
                  </div>
                </form>
              ) : (
                <div className="flex flex-wrap items-center justify-end gap-3">
                  <Button variant="ghost" type="button" onClick={onClose}>
                    Close
                  </Button>
                  <Button
                    variant="danger"
                    type="button"
                    onClick={() => setShowRejectForm(true)}
                    leftIcon={<XCircle className="h-4 w-4" />}
                  >
                    Reject
                  </Button>
                  <Button
                    type="button"
                    onClick={handleApprove}
                    isLoading={approveMutation.isPending}
                    leftIcon={<CheckCircle2 className="h-4 w-4" />}
                  >
                    Approve
                  </Button>
                </div>
              )}
            </div>
          ) : (
            <div className="flex justify-end border-t border-gray-200 pt-4 dark:border-gray-800">
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

export default KYCDetailsModal;