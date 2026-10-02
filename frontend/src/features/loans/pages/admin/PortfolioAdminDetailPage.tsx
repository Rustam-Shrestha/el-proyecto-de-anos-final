import { useState, memo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  useGetAdminPortfolioDetail,
  useGetAdminUserDocuments,
  useVerifyPortfolioMutation,
  useVerifyFinancialDocumentMutation,
} from "@features/loans/api/portfolioApi";
import { Button } from "@shared/components/Button";
import { SkeletonLoader } from "@shared/components/SkeletonLoader";
import { useToast } from "@shared/hooks/useToast";

const PortfolioAdminDetailPage = () => {
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();
  const toast = useToast();
  const { data: detail, isLoading } = useGetAdminPortfolioDetail(userId || "");
  const { data: documents } = useGetAdminUserDocuments(userId || "");
  const verifyPortfolioMutation = useVerifyPortfolioMutation();
  const verifyDocumentMutation = useVerifyFinancialDocumentMutation();

  const [adminNotes, setAdminNotes] = useState("");
  const [docNotes, setDocNotes] = useState<Record<string, string>>({});

  const handleVerifyPortfolio = async (status: string) => {
    if (!userId) return;
    try {
      await verifyPortfolioMutation.mutateAsync({ userId, verificationStatus: status, adminNotes });
      toast.success(`Portfolio ${status.toLowerCase()}`);
    } catch {
      toast.error("Failed to update portfolio status");
    }
  };

  const handleVerifyDocument = async (documentId: string, status: string) => {
    try {
      await verifyDocumentMutation.mutateAsync({
        documentId,
        verificationStatus: status,
        adminNotes: docNotes[documentId],
      });
      toast.success(`Document ${status.toLowerCase()}`);
    } catch {
      toast.error("Failed to verify document");
    }
  };

  if (isLoading) {
    return <SkeletonLoader count={5} type="list" />;
  }

  if (!detail) {
    return (
      <div className="rounded-3xl border border-gray-200 bg-white p-8 text-center text-sm text-gray-500 shadow-sm">
        Portfolio not found.
      </div>
    );
  }

  const { summary } = detail;
  const emp = summary.employment;
  const ver = summary.verification;

  return (
    <section className="space-y-6">
      <div className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.22em] text-[var(--green-icon)]">
              Admin Review
            </p>
            <h1 className="mt-2 text-3xl font-semibold text-gray-900">
              Portfolio Detail
            </h1>
            <p className="mt-1 text-sm text-gray-500">User ID: {userId}</p>
          </div>
          <Button variant="ghost" type="button" onClick={() => navigate("/dashboard/portfolio/admin")}>
            Back to List
          </Button>
        </div>

        {ver ? (
          <div className="mt-4 flex items-center gap-3">
            <span
              className={`rounded-full px-3 py-1 text-xs font-semibold ${
                ver.verificationStatus === "VERIFIED"
                  ? "bg-green-100 text-green-800"
                  : ver.verificationStatus === "REJECTED"
                    ? "bg-red-100 text-red-800"
                    : ver.verificationStatus === "PENDING_REVIEW"
                      ? "bg-yellow-100 text-yellow-800"
                      : "bg-blue-100 text-blue-800"
              }`}
            >
              {ver.verificationStatus?.replace(/_/g, " ") || "PENDING"}
            </span>
            {ver.overallRiskScore != null ? (
              <span
                className={`rounded-full px-3 py-1 text-xs font-semibold ${
                  ver.riskLevel === "LOW"
                    ? "bg-green-100 text-green-800"
                    : ver.riskLevel === "HIGH"
                      ? "bg-red-100 text-red-800"
                      : "bg-yellow-100 text-yellow-800"
                }`}
              >
                Risk: {ver.riskLevel} ({ver.overallRiskScore})
              </span>
            ) : null}
          </div>
        ) : null}
      </div>

      {/* Employment Info */}
      <div className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-gray-900">Employment Information</h2>
        {emp ? (
          <div className="mt-4 grid gap-4 md:grid-cols-3">
            <AdminField label="Status" value={emp.employmentStatus?.replace(/_/g, " ")} />
            <AdminField label="Job Title" value={emp.occupationJobTitle} />
            <AdminField label="Employer" value={emp.employerName} />
            <AdminField label="Business Name" value={emp.businessName} />
            <AdminField label="Business Type" value={emp.businessType} />
            <AdminField label="Institution" value={emp.institutionName} />
            <AdminField label="Education Level" value={emp.educationLevel} />
            <AdminField label="Monthly Income" value={emp.monthlyGrossIncome ? `NPR ${emp.monthlyGrossIncome.toLocaleString()}` : "N/A"} />
            <AdminField label="Annual Income" value={emp.annualIncome ? `NPR ${emp.annualIncome.toLocaleString()}` : "N/A"} />
            <AdminField label="Dependents" value={emp.dependentsCount?.toString()} />
            <AdminField label="Income Stability" value={emp.incomeStabilityScore != null ? `${emp.incomeStabilityScore}/100` : "N/A"} />
            <AdminField label="Employment Tenure" value={emp.employmentTenureMonths ? `${emp.employmentTenureMonths} months` : "N/A"} />
          </div>
        ) : (
          <p className="mt-4 text-sm text-gray-500">No employment info on file.</p>
        )}
      </div>

      {/* Risk Metrics */}
      {ver ? (
        <div className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900">Calculated Metrics</h2>
          <div className="mt-4 grid gap-4 md:grid-cols-3">
            <AdminField label="Loan-to-Income Ratio" value={ver.loanToIncomeRatio != null ? `${ver.loanToIncomeRatio.toFixed(2)}%` : "N/A"} />
            <AdminField label="EMI-to-Income Ratio" value={ver.emiToIncomeRatio != null ? `${ver.emiToIncomeRatio.toFixed(2)}%` : "N/A"} />
            <AdminField label="Income per Dependent" value={ver.incomePerDependent != null ? `NPR ${ver.incomePerDependent.toFixed(2)}` : "N/A"} />
            <AdminField label="Employment Stability" value={ver.employmentStabilityScore != null ? `${ver.employmentStabilityScore}/100` : "N/A"} />
            <AdminField label="Flags" value={ver.flagsCount?.toString()} />
          </div>

          {ver.flagDetails && ver.flagDetails.length > 0 ? (
            <div className="mt-4">
              <p className="text-sm font-medium text-red-600">Anomaly Flags:</p>
              <ul className="mt-2 space-y-1">
                {ver.flagDetails.map((flag, i) => (
                  <li key={i} className="flex items-center gap-2 text-sm">
                    <span
                      className={`h-2 w-2 rounded-full ${
                        flag.severity === "HIGH" ? "bg-red-500" : flag.severity === "MEDIUM" ? "bg-yellow-500" : "bg-blue-500"
                      }`}
                    />
                    <span className="font-medium">{flag.field}:</span> {flag.issue}
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </div>
      ) : null}

      {/* Documents */}
      {documents && documents.length > 0 ? (
        <div className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900">Financial Documents ({documents.length})</h2>
          <div className="mt-4 space-y-4">
            {documents.map((doc) => (
              <div key={doc.id} className="rounded-xl border border-gray-200 p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {doc.documentType.replace(/_/g, " ")}
                    </p>
                    <p className="text-xs text-gray-500">
                      {doc.originalName || "No name"} &middot;{" "}
                      {doc.fileSize ? `${(doc.fileSize / 1024).toFixed(0)} KB` : "Unknown size"}
                    </p>
                    {doc.ocrConfidence != null ? (
                      <p className="text-xs text-gray-500">
                        OCR Confidence: {(doc.ocrConfidence * 100).toFixed(0)}%
                      </p>
                    ) : null}
                    {doc.ocrData ? (
                      <p className="mt-1 text-xs text-gray-400">
                        OCR: {JSON.stringify(doc.ocrData).substring(0, 100)}...
                      </p>
                    ) : null}
                  </div>
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-semibold ${
                      doc.verificationStatus === "VERIFIED"
                        ? "bg-green-100 text-green-800"
                        : doc.verificationStatus === "REJECTED"
                          ? "bg-red-100 text-red-800"
                          : doc.verificationStatus === "FLAGGED"
                            ? "bg-yellow-100 text-yellow-800"
                            : "bg-blue-100 text-blue-800"
                    }`}
                  >
                    {doc.verificationStatus}
                  </span>
                </div>

                {doc.verificationStatus !== "VERIFIED" ? (
                  <div className="mt-3 flex items-center gap-3 border-t border-gray-100 pt-3">
                    <input
                      type="text"
                      placeholder="Admin notes (optional)"
                      value={docNotes[doc.id] || ""}
                      onChange={(e) => setDocNotes((prev) => ({ ...prev, [doc.id]: e.target.value }))}
                      className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-xs outline-none focus:border-[var(--green-icon)]"
                    />
                    <button
                      type="button"
                      onClick={() => handleVerifyDocument(doc.id, "VERIFIED")}
                      disabled={verifyDocumentMutation.isPending}
                      className="rounded-lg bg-green-600 px-4 py-2 text-xs font-medium text-white transition-colors hover:bg-green-700 disabled:opacity-50"
                    >
                      Approve
                    </button>
                    <button
                      type="button"
                      onClick={() => handleVerifyDocument(doc.id, "REJECTED")}
                      disabled={verifyDocumentMutation.isPending}
                      className="rounded-lg bg-red-600 px-4 py-2 text-xs font-medium text-white transition-colors hover:bg-red-700 disabled:opacity-50"
                    >
                      Reject
                    </button>
                  </div>
                ) : null}
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="rounded-3xl border border-gray-200 bg-white p-6 text-center text-sm text-gray-500 shadow-sm">
          No documents uploaded.
        </div>
      )}

      {/* Verification Actions */}
      <div className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-gray-900">Verification Decision</h2>

        <div className="mt-4">
          <label className="block text-sm font-medium text-gray-700">Admin Notes</label>
          <textarea
            value={adminNotes}
            onChange={(e) => setAdminNotes(e.target.value)}
            rows={3}
            placeholder="Enter verification notes, flags, or comments..."
            className="mt-1 w-full rounded-xl border border-gray-300 px-4 py-3 text-sm outline-none transition-colors focus:border-[var(--green-icon)]"
          />
        </div>

        <div className="mt-4 flex items-center gap-3">
          <button
            type="button"
            onClick={() => handleVerifyPortfolio("VERIFIED")}
            disabled={verifyPortfolioMutation.isPending}
            className="rounded-xl bg-green-600 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-green-700 disabled:opacity-50"
          >
            {verifyPortfolioMutation.isPending ? "Processing..." : "Approve Portfolio"}
          </button>
          <button
            type="button"
            onClick={() => handleVerifyPortfolio("REJECTED")}
            disabled={verifyPortfolioMutation.isPending}
            className="rounded-xl bg-red-600 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-red-700 disabled:opacity-50"
          >
            Reject Portfolio
          </button>
          <button
            type="button"
            onClick={() => handleVerifyPortfolio("NEEDS_RESUBMISSION")}
            disabled={verifyPortfolioMutation.isPending}
            className="rounded-xl bg-yellow-600 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-yellow-700 disabled:opacity-50"
          >
            Request Resubmission
          </button>
        </div>
      </div>
    </section>
  );
};

const AdminField = ({ label, value }: { label: string; value?: string | null }) => (
  <div className="rounded-lg border border-gray-100 bg-gray-50 p-3">
    <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">{label}</p>
    <p className="mt-1 text-sm font-medium text-gray-900">{value || "N/A"}</p>
  </div>
);

PortfolioAdminDetailPage.displayName = "PortfolioAdminDetailPage";
export default memo(PortfolioAdminDetailPage);
