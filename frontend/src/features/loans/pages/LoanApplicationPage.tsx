import { memo } from "react";
import { Link } from "react-router-dom";
import { useGetMyKYCStatus } from "@features/kyc/api/kycApi";
import { SkeletonLoader } from "@shared/components/SkeletonLoader";
import LoanApplicationForm from "@features/loans/components/LoanApplicationForm";

const LoanApplicationPage = () => {
  const { data: kyc, isLoading, isError } = useGetMyKYCStatus();

  const isKycApproved = kyc?.status === "APPROVED";

  return (
    <section className="space-y-6">
      <div className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm  ">
        <p className="text-sm font-semibold uppercase tracking-[0.22em] text-[var(--green-icon)]">
          Loan Application
        </p>
        <h1 className="mt-2 text-3xl font-semibold text-gray-900 ">
          Apply for Loan
        </h1>
        <p className="mt-2 text-sm text-gray-500 ">
          Submit a new loan application. Your KYC must be approved first.
        </p>
      </div>

      {isLoading ? (
        <SkeletonLoader count={2} type="list" />
      ) : isError ? (
        <div className="rounded-3xl border border-red-200 bg-red-50 p-6 text-red-800   ">
          Unable to load KYC status. Please try again later.
        </div>
      ) : !kyc ? (
        <div className="rounded-3xl border border-dashed border-gray-300 bg-white p-8 text-gray-600 shadow-sm   ">
          <p className="text-base font-medium text-gray-900 ">
            KYC verification required
          </p>
          <p className="mt-2 text-sm">
            You need to submit and get your KYC approved before applying for a loan.
          </p>
          <Link
            to="/dashboard/kyc-submit"
            className="mt-4 inline-block rounded-xl bg-[var(--green-icon)] px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:opacity-90"
          >
            Submit KYC Application
          </Link>
        </div>
      ) : !isKycApproved ? (
        <div className="rounded-3xl border border-dashed border-yellow-300 bg-yellow-50 p-8 text-yellow-800 shadow-sm   ">
          <p className="text-base font-medium">KYC not yet approved</p>
          <p className="mt-2 text-sm">
            Your KYC application status is{" "}
            <span className="font-semibold">{kyc.status}</span>. Please wait for
            approval before applying for a loan.
          </p>
          <Link
            to="/dashboard/kyc-status"
            className="mt-4 inline-block text-sm font-semibold underline"
          >
            Check KYC Status
          </Link>
        </div>
      ) : (
        <LoanApplicationForm />
      )}
    </section>
  );
};

LoanApplicationPage.displayName = "LoanApplicationPage";

export default memo(LoanApplicationPage);
