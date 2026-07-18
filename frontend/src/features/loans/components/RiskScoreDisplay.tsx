import { memo } from "react";
import type { HomeCreditFeatures, DeriveFeatures } from "@features/loans/api/loansApi";

type RiskScoreDisplayProps = {
  riskScore: number;
  riskLevel: string;
  homeCredtFeatures: HomeCreditFeatures;
  derivedFeatures: DeriveFeatures;
};

const getRiskColor = (level: string) => {
  if (level === "LOW") return "#10b981";
  if (level === "MEDIUM") return "#f59e0b";
  return "#ef4444";
};

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "NPR",
    maximumFractionDigits: 0,
  }).format(value);

const RiskScoreDisplay = ({
  riskScore,
  riskLevel,
  homeCredtFeatures,
  derivedFeatures,
}: RiskScoreDisplayProps) => {
  const color = getRiskColor(riskLevel);

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
      <h3 className="text-sm font-semibold uppercase tracking-wider text-gray-500">
        Loan Eligibility Assessment
      </h3>

      <div className="my-6 text-center">
        <div
          style={{
            fontSize: "3rem",
            fontWeight: "bold",
            color,
            marginBottom: "0.5rem",
          }}
        >
          {riskScore}
        </div>
        <div
          style={{
            fontSize: "1.25rem",
            color,
            fontWeight: 600,
          }}
        >
          {riskLevel} RISK
        </div>
      </div>

      <h4 className="mb-3 text-sm font-semibold text-gray-900">
        Your Financial Profile
      </h4>
      <div className="space-y-2 text-sm">
        <div className="flex justify-between border-b border-gray-100 pb-2">
          <span className="text-gray-500">Annual Income</span>
          <span className="font-medium text-gray-900">
            {formatCurrency(homeCredtFeatures.AMT_INCOME_TOTAL)}
          </span>
        </div>
        <div className="flex justify-between border-b border-gray-100 pb-2">
          <span className="text-gray-500">Loan Requested</span>
          <span className="font-medium text-gray-900">
            {formatCurrency(homeCredtFeatures.AMT_CREDIT)}
          </span>
        </div>
        <div className="flex justify-between border-b border-gray-100 pb-2">
          <span className="text-gray-500">Monthly Payment (EMI)</span>
          <span className="font-medium text-gray-900">
            {formatCurrency(homeCredtFeatures.AMT_ANNUITY)}
          </span>
        </div>
        <div className="flex justify-between border-b border-gray-100 pb-2">
          <span className="text-gray-500">Employment Duration</span>
          <span className="font-medium text-gray-900">
            {Math.abs(homeCredtFeatures.DAYS_EMPLOYED / 365).toFixed(1)} years
          </span>
        </div>
        <div className="flex justify-between border-b border-gray-100 pb-2">
          <span className="text-gray-500">Dependents</span>
          <span className="font-medium text-gray-900">
            {homeCredtFeatures.CNT_CHILDREN}
          </span>
        </div>
      </div>

      <h4 className="mb-3 mt-6 text-sm font-semibold text-gray-900">
        Risk Factors
      </h4>
      <ul className="space-y-2 text-sm">
        <li className="flex items-start gap-2 text-gray-700">
          <span className="mt-0.5 h-1.5 w-1.5 shrink-0 rounded-full bg-gray-400" />
          <span>
            <strong>Loan-to-Income Ratio:</strong>{" "}
            {derivedFeatures.CREDIT_INCOME_PERCENT.toFixed(1)}%
            {derivedFeatures.CREDIT_INCOME_PERCENT > 300 && (
              <span className="ml-1 text-red-600">
                (Loan is &gt;3x annual income)
              </span>
            )}
          </span>
        </li>
        <li className="flex items-start gap-2 text-gray-700">
          <span className="mt-0.5 h-1.5 w-1.5 shrink-0 rounded-full bg-gray-400" />
          <span>
            <strong>Monthly Payment Burden:</strong>{" "}
            {derivedFeatures.ANNUITY_INCOME_PERCENT.toFixed(1)}% of income
            {derivedFeatures.ANNUITY_INCOME_PERCENT > 30 && (
              <span className="ml-1 text-red-600">
                (&gt;30% of income)
              </span>
            )}
          </span>
        </li>
        <li className="flex items-start gap-2 text-gray-700">
          <span className="mt-0.5 h-1.5 w-1.5 shrink-0 rounded-full bg-gray-400" />
          <span>
            <strong>Employment Stability:</strong>{" "}
            {derivedFeatures.EMPLOYMENT_STABILITY
              ? "Stable (5+ years)"
              : "Recent job"}
          </span>
        </li>
        <li className="flex items-start gap-2 text-gray-700">
          <span className="mt-0.5 h-1.5 w-1.5 shrink-0 rounded-full bg-gray-400" />
          <span>
            <strong>Age Category:</strong>{" "}
            {derivedFeatures.AGE_CATEGORY
              ? "Prime working age"
              : "Atypical age"}
          </span>
        </li>
      </ul>

      <div
        className="mt-6 rounded-xl p-4 text-sm"
        style={{
          background:
            riskLevel === "LOW"
              ? "#d1fae5"
              : riskLevel === "MEDIUM"
                ? "#fef3c7"
                : "#fee2e2",
        }}
      >
        {riskLevel === "LOW" && (
          <p className="text-green-800">
            You are eligible for this loan. You can proceed with application.
          </p>
        )}
        {riskLevel === "MEDIUM" && (
          <p className="text-yellow-800">
            Your application will be reviewed by a loan officer for final decision.
          </p>
        )}
        {riskLevel === "HIGH" && (
          <p className="text-red-800">
            Your loan request appears risky. Consider reducing the loan amount or
            increasing your income.
          </p>
        )}
      </div>
    </div>
  );
};

RiskScoreDisplay.displayName = "RiskScoreDisplay";

export default memo(RiskScoreDisplay);
