import { memo } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import KYCSubmissionForm from "@features/kyc/components/KYCSubmissionForm";
import { apiClient } from "@shared/lib/apiClient";
import useAuth from "@hooks/useAuth";

const UserKYCPage = () => {
  const navigate = useNavigate();
  const { userData } = useAuth();

  const meQuery = useQuery({
    queryKey: ["auth", "me", "kyc-page"],
    queryFn: async () => {
      const { data } = await apiClient.get<{ data?: Record<string, unknown> }>("/auth/me");
      return data.data ?? null;
    },
    staleTime: 5 * 60 * 1000,
  });

  const isAdmin = (userData?.role ?? "").toLowerCase() === "admin";

  return (
    <section className="space-y-6">
      <div className="flex flex-col gap-2 rounded-3xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900">
        <p className="text-sm font-semibold uppercase tracking-[0.22em] text-[var(--green-icon)]">KYC Submission</p>
        <h1 className="text-3xl font-semibold text-gray-900 dark:text-gray-100">Submit your application</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400">Complete the steps below to upload your documents.</p>
      </div>

      {isAdmin ? (
        <div className="rounded-3xl border border-yellow-200 bg-yellow-50 p-6 text-yellow-900 dark:border-yellow-900/40 dark:bg-yellow-950/30 dark:text-yellow-200">
          Admin users do not use the self-service submission flow.
        </div>
      ) : (
        <KYCSubmissionForm onSubmitted={() => navigate("/dashboard/kyc-status", { replace: true })} />
      )}

      {meQuery.isError ? <p className="text-sm text-red-500">Unable to load your profile details.</p> : null}
    </section>
  );
};

export default memo(UserKYCPage);