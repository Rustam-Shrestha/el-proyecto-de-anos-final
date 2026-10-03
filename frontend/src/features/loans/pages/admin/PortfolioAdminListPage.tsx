import { useState, memo } from "react";
import { Link } from "react-router-dom";
import { useGetPendingPortfolios } from "@features/loans/api/portfolioApi";
import { Button } from "@shared/components/Button";
import { SkeletonLoader } from "@shared/components/SkeletonLoader";
import PageHeader from "@shared/components/PageHeader";
import Breadcrumb from "@components/seo/Breadcrumb";

const PortfolioAdminListPage = () => {
  const [page, setPage] = useState(1);
  const { data, isLoading } = useGetPendingPortfolios(page);

  if (isLoading) {
    return <SkeletonLoader count={5} type="table" />;
  }

  const items = data?.data || [];
  const meta = data?.meta;

  return (
    <section className="space-y-4">
      <PageHeader
        breadcrumb={<Breadcrumb items={[{ label: "Dashboard", href: "/dashboard" }, { label: "Financial Review" }]} />}
        title="Financial Review Queue"
        description="Review and verify applicant financial and employment profiles."
      />

      <div className="rounded-3xl border border-gray-200 bg-white shadow-sm">
        {items.length === 0 ? (
          <div className="p-8 text-center text-sm text-gray-500">
            No pending portfolio verifications.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50">
                  <th className="px-6 py-4 font-semibold text-gray-600">User</th>
                  <th className="px-6 py-4 font-semibold text-gray-600">Status</th>
                  <th className="px-6 py-4 font-semibold text-gray-600">Income Type</th>
                  <th className="px-6 py-4 font-semibold text-gray-600">Annual Income</th>
                  <th className="px-6 py-4 font-semibold text-gray-600">Last Updated</th>
                  <th className="px-6 py-4 font-semibold text-gray-600">Action</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => (
                  <tr key={item.id} className="border-b border-gray-100 transition-colors hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div>
                        <p className="font-medium text-gray-900">
                          {item.user.profile?.fullName || "N/A"}
                        </p>
                        <p className="text-xs text-gray-500">{item.user.email}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-semibold ${
                          item.verificationStatus === "VERIFIED"
                            ? "bg-green-100 text-green-800"
                            : item.verificationStatus === "REJECTED"
                              ? "bg-red-100 text-red-800"
                              : item.verificationStatus === "PENDING_REVIEW"
                                ? "bg-yellow-100 text-yellow-800"
                                : "bg-blue-100 text-blue-800"
                        }`}
                      >
                        {item.verificationStatus.replace(/_/g, " ")}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-gray-700">
                      {item.user.employmentInfo?.employmentStatus?.replace(/_/g, " ") || "N/A"}
                    </td>
                    <td className="px-6 py-4 text-gray-700">
                      {item.user.employmentInfo?.annualIncome
                        ? `NPR ${item.user.employmentInfo.annualIncome.toLocaleString()}`
                        : "N/A"}
                    </td>
                    <td className="px-6 py-4 text-gray-500">
                      {new Date(item.lastUpdated).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4">
                      <Link
                        to={`/dashboard/portfolio/admin/${item.userId}`}
                        className="rounded-lg bg-[var(--green-icon)] px-4 py-2 text-xs font-medium text-white transition-colors hover:opacity-90"
                      >
                        Review
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {meta && meta.pages > 1 ? (
          <div className="flex items-center justify-between border-t border-gray-200 px-6 py-4">
            <p className="text-sm text-gray-500">
              Page {meta.page} of {meta.pages} ({meta.total} total)
            </p>
            <div className="flex gap-2">
              <Button
                variant="ghost"
                size="sm"
                disabled={meta.page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                Previous
              </Button>
              <Button
                variant="ghost"
                size="sm"
                disabled={meta.page >= meta.pages}
                onClick={() => setPage((p) => p + 1)}
              >
                Next
              </Button>
            </div>
          </div>
        ) : null}
      </div>
    </section>
  );
};

PortfolioAdminListPage.displayName = "PortfolioAdminListPage";
export default memo(PortfolioAdminListPage);
