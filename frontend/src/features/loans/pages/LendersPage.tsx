import { memo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { Landmark, ArrowRight } from "lucide-react";
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
  logoUrl?: string | null;
};

/**
 * Two-stage KYC, stage 2 entry: approved customers see every active tenant
 * as a lender card. Clicking one opens the quick-apply form (`/:slug/apply`)
 * pre-filled from the verified profile — amount, tenure and purpose only,
 * no form re-entry. Document verification (stage 1) is already done once by
 * the platform team and reused for every lender.
 */
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
    <section className="space-y-6">
      <Card>
        <PageHeader
          label="Lenders"
          title="Choose a lender"
          description={
            kycApproved
              ? "Your identity is verified once and reused everywhere. Pick a company, then enter amount, tenure and purpose only."
              : "Verify your identity first — then you can apply to any lender below with amount, tenure and purpose only."
          }
        />
      </Card>

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
          {lenders.map((lender) => (
            <Card key={lender.id}>
              <div className="flex items-start gap-3">
                {lender.logoUrl ? (
                  <img src={lender.logoUrl} alt={`${lender.name} logo`} className="h-10 w-10 rounded-lg object-contain" />
                ) : (
                  <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#DCFCE7] text-[#15803D]">
                    <Landmark className="h-5 w-5" />
                  </span>
                )}
                <div className="min-w-0">
                  <h3 className="truncate text-sm font-semibold text-[#0F172A]">{lender.name}</h3>
                  <p className="text-xs text-[#64748B]">{lender.companyType ?? "Lending partner"}</p>
                </div>
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
          ))}
        </div>
      )}
    </section>
  );
};

export default memo(LendersPage);
