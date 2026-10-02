import React from "react";
import { useFinancialProfile } from "../api/finguardApi";

const FinancialOverview: React.FC = () => {
  const { data: profile, isLoading, error } = useFinancialProfile();

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="animate-pulse space-y-3">
          <div className="h-4 bg-gray-200 rounded w-1/3" />
          <div className="h-8 bg-gray-200 rounded w-1/2" />
          <div className="h-4 bg-gray-200 rounded w-2/3" />
        </div>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="font-semibold text-gray-700 mb-2">Financial Overview</h3>
        <p className="text-sm text-gray-500">
          No financial data yet. Upload a bank statement to see your financial profile.
        </p>
      </div>
    );
  }

  const metrics = [
    { label: "Monthly Income", value: `₹${Number(profile.avgMonthlyIncome || 0).toLocaleString("en-IN")}`, color: "text-green-600" },
    { label: "Monthly Expenses", value: `₹${Number(profile.avgMonthlyExpense || 0).toLocaleString("en-IN")}`, color: "text-red-600" },
    { label: "Savings Rate", value: `${(Number(profile.savingsRate || 0) * 100).toFixed(1)}%`, color: "text-blue-600" },
    { label: "Credit Score", value: `${profile.creditScoreEstimate || "N/A"}`, color: "text-purple-600" },
    { label: "Income Stability", value: `${Number(profile.incomeStabilityScore || 0).toFixed(0)}/100`, color: "text-teal-600" },
    { label: "DTI Ratio", value: `${(Number(profile.debtToIncomeRatio || 0) * 100).toFixed(1)}%`, color: "text-orange-600" },
    { label: "Total Income", value: `₹${Number(profile.totalIncome || 0).toLocaleString("en-IN")}`, color: "text-green-700" },
    { label: "Total Expenses", value: `₹${Number(profile.totalExpense || 0).toLocaleString("en-IN")}`, color: "text-red-700" },
    { label: "Statements", value: `${profile.totalStatements}`, color: "text-gray-700" },
  ];

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="font-semibold text-gray-700 mb-4">Financial Overview</h3>
      <div className="grid grid-cols-3 gap-4">
        {metrics.map((m) => (
          <div key={m.label} className="text-center">
            <p className="text-xs text-gray-500">{m.label}</p>
            <p className={`text-lg font-bold ${m.color}`}>{m.value}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default FinancialOverview;
