import { memo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { companyApi } from "@features/company/api/companyApi";
import { useGetMyKYCStatus } from "@features/kyc/api/kycApi";
import { SkeletonLoader } from "@shared/components/SkeletonLoader";
import ErrorState from "@shared/components/ErrorState";
import { apiErrorMessage } from "@shared/utils/apiError";
import EmptyState from "@shared/components/EmptyState";
import Card from "@shared/components/Card";
import PageHeader from "@shared/components/PageHeader";

type Lender = {
  id: number;
  name: string;
  slug: string;
  companyType?: string | null;
  domain?: string | null;
  logoUrl?: string | null;
  panNumber?: string | null;
};

/**
 * Two-stage KYC, stage 2 entry: approved customers see every active tenant
 * as a lender card. Clicking one opens the quick-apply form (`/:slug/apply`)
 * pre-filled from the verified profile — amount, tenure and purpose only,
 * no form re-entry. Document verification (stage 1) is already done once by
 * the platform team and reused for every lender.
 */
import Breadcrumb from "@components/seo/Breadcrumb";

const LendersPage = () => {
  const lendersQuery = useQuery({
    queryKey: ["lenders"],
    queryFn: () => companyApi.listPublic() as Promise<Lender[]>,
    staleTime: 60 * 1000,
  });
  const { data: kycStatus } = useGetMyKYCStatus();
  const kycApproved = kycStatus?.status === "APPROVED";
  const lenders = lendersQuery.data ?? [];

  if (lendersQuery.isLoading) return <SkeletonLoader count={6} type="table" />;
  if (lendersQuery.isError)
    return <ErrorState message={apiErrorMessage(lendersQuery.error, "Failed to load lenders")} onRetry={() => lendersQuery.refetch()} />;

  return (
    <section className="space-y-4">
      <PageHeader
        breadcrumb={<Breadcrumb items={[{ label: "Dashboard", href: "/dashboard" }, { label: "Browse Lenders" }]} />}
        title="Choose a Lender"
        description={
          kycApproved
            ? "Your identity is verified once and reused everywhere. Pick a company, then enter loan details."
            : "Verify your identity first — then you can apply to any lender below with ease."
        }
      />

      {!kycApproved ? (
        <Card>
          <p className="text-sm text-[#64748B]">
            Your KYC documents are {kycStatus?.status ? `currently ${String(kycStatus.status).toLowerCase()}` : "not submitted yet"}.{" "}
            <Link to="/dashboard/kyc-submit" className="font-semibold text-[#15803D] underline">
              {kycStatus?.status ? "Check KYC status" : "Submit KYC documents"}
            </Link>
          </p>
        </Card>
      ) : null}

      {!lenders.length ? (
        <EmptyState title="No lenders available" description="There are no active lending companies right now. Please check back later." />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {lenders.map((lender) => {
            const initials = lender.name.split(/\s+/).map(w => w[0]).join('').slice(0, 2).toUpperCase() || "CO";
            return (
              <Card key={lender.id} className="flex flex-col justify-between">
                <div>
                  <div className="flex items-start gap-3">
                    {lender.logoUrl ? (
                      <img
                        src={lender.logoUrl}
                        alt={`${lender.name} logo`}
                        className="h-10 w-10 rounded-xl object-contain border border-gray-100 shrink-0"
                        onError={(e) => {
                          const target = e.currentTarget;
                          target.style.display = "none";
                          if (target.nextElementSibling) {
                            (target.nextElementSibling as HTMLElement).style.display = "flex";
                          }
                        }}
                      />
                    ) : null}
                    <span
                      className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--primary-soft)] text-[var(--primary)] font-bold text-sm shrink-0"
                      style={{ display: lender.logoUrl ? "none" : "flex" }}
                    >
                      {initials}
                    </span>
                    <div className="min-w-0">
                      <h3 className="truncate text-sm font-semibold text-[#0F172A]">{lender.name}</h3>
                      <p className="text-xs text-[#64748B] truncate">
                        {lender.companyType ?? "Lending partner"}
                        {lender.domain ? ` • ${lender.domain}` : ""}
                      </p>
                    </div>
                  </div>
                  {lender.panNumber ? (
                    <div className="mt-2.5">
                      <span className="inline-flex items-center rounded-md bg-slate-100 px-2 py-0.5 text-[11px] font-mono text-slate-600">
                        PAN: {lender.panNumber}
                      </span>
                    </div>
                  ) : null}
                </div>
                {kycApproved ? (
                  <Link
                    to={`/${lender.slug}/apply`}
                    className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-[#15803D] px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-[#166534]"
                  >
                    Quick apply <ArrowRight className="h-4 w-4" />
                  </Link>
                ) : (
                  <button
                    type="button"
                    disabled
                    title="Complete KYC verification first"
                    className="mt-4 inline-flex w-full cursor-not-allowed items-center justify-center gap-2 rounded-lg bg-[#E2E8F0] px-4 py-2 text-sm font-semibold text-[#64748B]"
                  >
                    Quick apply <ArrowRight className="h-4 w-4" />
                  </button>
                )}
              </Card>
            );
          })}
        </div>
      )}
    </section>
  );
};

export default memo(LendersPage);
