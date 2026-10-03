import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { apiClient } from "@shared/lib/apiClient";
import type { ApiResponse } from "@shared/types/common";
import { useAuth } from "@store/hooks";
import { BadgeCheck, Wallet, CreditCard, ArrowRight } from "lucide-react";

const statusTone: Record<string, string> = {
  APPROVED: "bg-green-50 text-green-700 border-green-200",
  VERIFIED: "bg-green-50 text-green-700 border-green-200",
  REJECTED: "bg-red-50 text-red-700 border-red-200",
  PENDING: "bg-amber-50 text-amber-700 border-amber-200",
  SUBMITTED: "bg-amber-50 text-amber-700 border-amber-200",
  UNDER_REVIEW: "bg-blue-50 text-blue-700 border-blue-200",
  PROCESSING: "bg-blue-50 text-blue-700 border-blue-200",
};

const tone = (status?: string) => statusTone[status ?? ""] ?? "bg-gray-50 text-gray-600 border-gray-200";

export const UserDashboard = () => {
  const { userData } = useAuth();
  const name = userData?.name || userData?.email?.split("@")[0] || "User";

  const kyc = useQuery({
    queryKey: ["dashboard", "kyc"],
    queryFn: async () => {
      const { data } = await apiClient.get<ApiResponse<{ status?: string }>>("/kyc/my-status");
      return data.data;
    },
  });

  const portfolio = useQuery({
    queryKey: ["dashboard", "portfolio"],
    queryFn: async () => {
      const { data } = await apiClient.get<ApiResponse<{ verificationStatus?: string }>>("/portfolio/verification-status");
      return data.data;
    },
  });

  const loans = useQuery({
    queryKey: ["dashboard", "loans"],
    queryFn: async () => {
      const { data } = await apiClient.get<ApiResponse<Array<{ id: string; status: string; requestedAmount?: string }>>>("/loan");
      return data.data;
    },
  });

  const kycStatus = kyc.data?.status;
  const portfolioStatus = portfolio.data?.verificationStatus;
  const loanApps = loans.data ?? [];
  const readyForLoan = kycStatus === "APPROVED" && portfolioStatus === "VERIFIED";

  const cards = [
    {
      label: "KYC Status",
      value: kycStatus ?? "—",
      icon: BadgeCheck,
      to: "/dashboard/kyc-status",
      href: readyForLoan ? undefined : "/dashboard/kyc-submit",
    },
    {
      label: "Portfolio Verification",
      value: portfolioStatus ?? "—",
      icon: Wallet,
      to: "/dashboard/portfolio",
    },
    {
      label: "Loan Applications",
      value: loanApps.length ? `${loanApps.length} active` : "None",
      icon: CreditCard,
      to: "/dashboard/loans/status",
    },
  ];

  return (
    <section className="space-y-6">
      <div className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
        <p className="text-sm font-medium uppercase tracking-[0.22em] text-[var(--green-icon)]">Overview</p>
        <h2 className="mt-2 text-3xl font-semibold text-gray-900">Welcome back, {name}</h2>
        <p className="mt-2 text-sm text-gray-500">Track your loan application journey.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {cards.map((card) => {
          const Icon = card.icon;
          return (
            <Link
              key={card.label}
              to={card.to}
              className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm transition-colors hover:border-[var(--green-icon)]"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm text-gray-500">{card.label}</p>
                  <span className={`mt-3 inline-block rounded-full border px-2.5 py-0.5 text-sm font-semibold ${tone(card.value === "None" ? undefined : card.value)}`}>
                    {card.value}
                  </span>
                </div>
                <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--green-footer)] text-[var(--green-background)]">
                  <Icon className="h-5 w-5" />
                </span>
              </div>
            </Link>
          );
        })}
      </div>

      <div className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
        <h3 className="text-lg font-semibold text-gray-900">Next Step</h3>
        <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-gray-600">
            {!kyc.data || !kycStatus
              ? "Complete your KYC verification to unlock the loan application process."
              : kycStatus === "APPROVED" && !portfolioStatus
                ? "Your KYC is approved. Submit your financial documents for portfolio verification."
                : kycStatus === "APPROVED" && portfolioStatus === "VERIFIED"
                  ? "You are fully verified and ready to apply for a loan."
                  : "Your application is being reviewed. Check back soon."}
          </p>
          {readyForLoan ? (
            <Link
              to="/dashboard/loans/apply"
              className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700"
            >
              Apply for Loan <ArrowRight className="h-4 w-4" />
            </Link>
          ) : (
            <Link
              to={!kycStatus ? "/dashboard/kyc-submit" : "/dashboard/portfolio"}
              className="inline-flex items-center gap-1.5 rounded-lg bg-[var(--green-icon)] px-4 py-2 text-sm font-medium text-white transition-opacity hover:opacity-90"
            >
              {!kycStatus ? "Start KYC" : "Complete Portfolio"} <ArrowRight className="h-4 w-4" />
            </Link>
          )}
        </div>
      </div>
    </section>
  );
};