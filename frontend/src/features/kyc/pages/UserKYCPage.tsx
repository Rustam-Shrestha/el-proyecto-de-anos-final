import { memo } from "react";
import { useNavigate } from "react-router-dom";
import KYCSubmissionForm from "@features/kyc/components/KYCSubmissionForm";

const UserKYCPage = () => {
  const navigate = useNavigate();

  return (
    <section className="space-y-6">
      <div className="flex flex-col gap-2 rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
        <p className="text-sm font-semibold uppercase tracking-[0.22em] text-[var(--green-icon)]">KYC Submission</p>
        <h1 className="text-3xl font-semibold text-gray-900">Submit your application</h1>
        <p className="text-sm text-gray-500">Complete the steps below to upload your documents.</p>
      </div>

      <KYCSubmissionForm onSubmitted={() => navigate("/dashboard/kyc-status", { replace: true })} />
    </section>
  );
};

export default memo(UserKYCPage);
