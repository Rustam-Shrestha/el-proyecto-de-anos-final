import React, { useState } from "react";
import { useAssessLoan, useLoanAssessmentHistory } from "../api/finguardApi";

const LoanAssessor: React.FC = () => {
  const [amount, setAmount] = useState("");
  const [tenure, setTenure] = useState("24");
  const assessMutation = useAssessLoan();
  const { data: history } = useLoanAssessmentHistory();

  const handleAssess = () => {
    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) return;
    assessMutation.mutate({ requestedAmount: numAmount, loanTenureMonths: parseInt(tenure) });
  };

  const getRiskBadge = (level: string | null) => {
    const colors: Record<string, string> = {
      LOW: "bg-green-100 text-green-800",
      MEDIUM: "bg-yellow-100 text-yellow-800",
      HIGH: "bg-orange-100 text-orange-800",
      REJECTED: "bg-red-100 text-red-800",
    };
    return colors[level || ""] || "bg-gray-100 text-gray-800";
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="font-semibold text-gray-700 mb-4">Loan Eligibility Check</h3>

      <div className="flex gap-3 mb-4">
        <div className="flex-1">
          <label className="block text-xs text-gray-500 mb-1">Requested Amount (₹)</label>
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="e.g. 500000"
            className="w-full border rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div className="w-32">
          <label className="block text-xs text-gray-500 mb-1">Tenure (months)</label>
          <select
            value={tenure}
            onChange={(e) => setTenure(e.target.value)}
            className="w-full border rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {[6, 12, 18, 24, 36, 48, 60].map((t) => (
              <option key={t} value={t}>{t} months</option>
            ))}
          </select>
        </div>
        <div className="flex items-end">
          <button
            onClick={handleAssess}
            disabled={assessMutation.isPending || !amount}
            className="bg-blue-600 text-white px-4 py-2 rounded text-sm hover:bg-blue-700 disabled:opacity-50"
          >
            {assessMutation.isPending ? "Checking..." : "Check"}
          </button>
        </div>
      </div>

      {assessMutation.data && (
        <div className="bg-gray-50 rounded p-4 mb-4 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">Eligibility Score</span>
            <span className="text-lg font-bold">{assessMutation.data.eligibilityScore?.toFixed(0)}/100</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">Risk Level</span>
            <span className={`px-2 py-0.5 rounded text-xs font-semibold ${getRiskBadge(assessMutation.data.riskLevel)}`}>
              {assessMutation.data.riskLevel}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">Eligible Amount</span>
            <span className="font-semibold">₹{Number(assessMutation.data.eligibleAmount || 0).toLocaleString("en-IN")}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">Max Monthly EMI</span>
            <span className="font-semibold">₹{Number(assessMutation.data.maxMonthlyEmi || 0).toLocaleString("en-IN")}</span>
          </div>
          {assessMutation.data.recommendation && (
            <p className="text-xs text-gray-500 mt-2">{assessMutation.data.recommendation}</p>
          )}
        </div>
      )}

      {assessMutation.isError && (
        <p className="text-red-500 text-sm mb-4">
          {assessMutation.error instanceof Error ? assessMutation.error.message : "Assessment failed"}
        </p>
      )}

      {history && history.length > 0 && (
        <div>
          <h4 className="text-xs font-semibold text-gray-500 uppercase mb-2">Recent Assessments</h4>
          <div className="space-y-2 max-h-40 overflow-y-auto">
            {history.slice(0, 5).map((a) => (
              <div key={a.id} className="flex items-center justify-between text-xs bg-gray-50 rounded px-3 py-2">
                <span>₹{Number(a.requestedAmount || 0).toLocaleString("en-IN")}</span>
                <span className={`px-2 py-0.5 rounded font-medium ${getRiskBadge(a.riskLevel)}`}>
                  {a.riskLevel}
                </span>
                <span className="text-gray-400">{a.eligibilityScore?.toFixed(0)}%</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default LoanAssessor;
