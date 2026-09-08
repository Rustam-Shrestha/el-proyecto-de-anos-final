import { useCallback, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useApplyLoanMutation, useCalculateRiskMutation } from "@features/loans/api/loansApi";
import type { HomeCreditFeatures, DeriveFeatures } from "@features/loans/api/loansApi";
import { Button } from "@shared/components/Button";
import { useToast } from "@shared/hooks/useToast";
import { z } from "zod";
import { loanApplicationSchema } from "@shared/utils/validators";
import type { LoanPurpose } from "@shared/types/common";
import RiskScoreDisplay from "@features/loans/components/RiskScoreDisplay";
import InputField from "@components/common/InputField";
import CustomSelectField from "@components/common/SelectField";
import Card from "@shared/components/Card";

const ANNUAL_INTEREST_RATE = 18;

const tenureOptions = [6, 12, 18, 24, 36, 48, 60] as const;

const purposeOptions: { value: LoanPurpose; label: string }[] = [
  { value: "HOME", label: "Home" },
  { value: "EDUCATION", label: "Education" },
  { value: "BUSINESS", label: "Business" },
  { value: "PERSONAL", label: "Personal" },
];

const formatNPR = (value: number) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "NPR",
    maximumFractionDigits: 0,
  }).format(value);

const calculateEMI = (principal: number, tenureMonths: number) => {
  if (principal <= 0 || tenureMonths <= 0) {
    return { emi: 0, totalRepayment: 0, totalInterest: 0 };
  }
  const monthlyRate = ANNUAL_INTEREST_RATE / 12 / 100;
  const factor = Math.pow(1 + monthlyRate, tenureMonths);
  const emi = (principal * monthlyRate * factor) / (factor - 1);
  const totalRepayment = emi * tenureMonths;
  return {
    emi: Math.round(emi),
    totalRepayment: Math.round(totalRepayment),
    totalInterest: Math.round(totalRepayment - principal),
  };
};

type FormErrors = Partial<Record<keyof z.infer<typeof loanApplicationSchema>, string>>;

const LoanApplicationForm = () => {
  const navigate = useNavigate();
  const toast = useToast();
  const applyMutation = useApplyLoanMutation();
  const riskMutation = useCalculateRiskMutation();

  const [amount, setAmount] = useState("");
  const [purpose, setPurpose] = useState<LoanPurpose>("PERSONAL");
  const [tenureMonths, setTenureMonths] = useState(12);
  const [errors, setErrors] = useState<FormErrors>({});
  const [riskResult, setRiskResult] = useState<{
    riskScore: number;
    riskLevel: string;
    homeCredtFeatures: HomeCreditFeatures;
    derivedFeatures: DeriveFeatures;
  } | null>(null);

  const numericAmount = useMemo(() => {
    const parsed = Number(amount.replace(/,/g, ""));
    return Number.isNaN(parsed) ? 0 : parsed;
  }, [amount]);

  const emiBreakdown = useMemo(
    () => calculateEMI(numericAmount, tenureMonths),
    [numericAmount, tenureMonths]
  );

  const validate = useCallback((): boolean => {
    const parsed = {
      amount: numericAmount,
      purpose,
      termMonths: tenureMonths,
    };
    const result = loanApplicationSchema.safeParse(parsed);
    if (!result.success) {
      const fieldErrors: FormErrors = {};
      for (const issue of result.error.issues) {
        const path = issue.path[0] as keyof FormErrors;
        if (!fieldErrors[path]) {
          fieldErrors[path] = issue.message;
        }
      }
      setErrors(fieldErrors);
      return false;
    }
    setErrors({});
    return true;
  }, [numericAmount, purpose, tenureMonths]);

  const handleCalculateRisk = async () => {
    if (!validate()) return;

    try {
      const result = await riskMutation.mutateAsync({
        requestedLoanAmount: numericAmount,
        loanTenureMonths: tenureMonths,
      });
      setRiskResult({
        riskScore: result.riskScore,
        riskLevel: result.riskLevel,
        homeCredtFeatures: result.homeCredtFeatures,
        derivedFeatures: result.derivedFeatures,
      });
    } catch (error) {
      const apiError = error as { response?: { data?: { message?: string } } };
      toast.error(apiError.response?.data?.message || "Failed to calculate risk");
    }
  };

  const handleSubmit = async () => {
    if (!validate()) return;

    try {
      await applyMutation.mutateAsync({
        amount: numericAmount,
        purpose,
        termMonths: tenureMonths,
      });
      toast.success("Loan application submitted successfully");
      navigate("/dashboard/loans/status");
    } catch (error) {
      const apiError = error as { response?: { data?: { message?: string } } };
      toast.error(apiError.response?.data?.message || "Failed to submit loan application");
    }
  };

  return (
    <Card>
      <div className="grid gap-6 md:grid-cols-2">
        <div className="space-y-4">
          <InputField label="Loan Amount (NPR)" type="text" inputMode="numeric" value={amount} onChange={(e) => setAmount(e.target.value.replace(/[^0-9,]/g, ""))} placeholder="e.g. 500,000" error={errors.amount} />
          <p className="text-xs text-[#64748B]">Min: NPR 10,000 · Max: NPR 2,000,000</p>
          <CustomSelectField label="Loan Purpose" value={purpose} onChange={(e) => setPurpose(e.target.value as LoanPurpose)} options={purposeOptions} />
          <CustomSelectField label="Repayment Tenure" value={String(tenureMonths)} onChange={(e) => setTenureMonths(Number(e.target.value))} options={tenureOptions.map((m) => ({ value: String(m), label: `${m} months ${m >= 12 ? `(${m / 12} yr)` : ""}` }))} />
        </div>

        <div className="rounded-[8px] border border-[#E2E8F0] bg-[#F8FAFC] p-5">
          <h3 className="text-xs font-semibold uppercase tracking-[0.08em] text-[#64748B]">
            Loan Summary
          </h3>

          <dl className="mt-4 space-y-4">
            <div className="flex items-center justify-between border-b border-gray-200 pb-2 ">
              <dt className="text-sm text-gray-600 ">Principal</dt>
              <dd className="text-sm font-semibold text-gray-900 ">
                {formatNPR(numericAmount)}
              </dd>
            </div>
            <div className="flex items-center justify-between border-b border-gray-200 pb-2 ">
              <dt className="text-sm text-gray-600 ">Interest Rate</dt>
              <dd className="text-sm font-semibold text-gray-900 ">
                {ANNUAL_INTEREST_RATE}% p.a.
              </dd>
            </div>
            <div className="flex items-center justify-between border-b border-gray-200 pb-2 ">
              <dt className="text-sm text-gray-600 ">Tenure</dt>
              <dd className="text-sm font-semibold text-gray-900 ">
                {tenureMonths} months
              </dd>
            </div>
            <div className="flex items-center justify-between border-b border-gray-200 pb-2 ">
              <dt className="text-sm text-gray-600 ">Monthly EMI</dt>
              <dd className="text-base font-bold text-[#15803D]">
                {formatNPR(emiBreakdown.emi)}
              </dd>
            </div>
            <div className="flex items-center justify-between border-b border-gray-200 pb-2 ">
              <dt className="text-sm text-gray-600 ">Total Interest</dt>
              <dd className="text-sm font-semibold text-gray-900 ">
                {formatNPR(emiBreakdown.totalInterest)}
              </dd>
            </div>
            <div className="flex items-center justify-between pt-1">
              <dt className="text-sm font-semibold text-gray-900 ">
                Total Repayment
              </dt>
              <dd className="text-base font-bold text-gray-900 ">
                {formatNPR(emiBreakdown.totalRepayment)}
              </dd>
            </div>
          </dl>
        </div>
      </div>

      {riskResult ? (
        <div className="mt-6">
          <RiskScoreDisplay
            riskScore={riskResult.riskScore}
            riskLevel={riskResult.riskLevel}
            homeCredtFeatures={riskResult.homeCredtFeatures}
            derivedFeatures={riskResult.derivedFeatures}
          />
        </div>
      ) : null}

      <div className="mt-6 flex flex-wrap items-center justify-end gap-3 border-t border-[#E2E8F0] pt-5">
        <Button variant="ghost" type="button" onClick={() => navigate("/dashboard")}>
          Cancel
        </Button>
        <Button
          type="button"
          variant="secondary"
          onClick={handleCalculateRisk}
          isLoading={riskMutation.isPending}
          disabled={!numericAmount || numericAmount < 10000}
        >
          {riskResult ? "Recalculate Risk" : "Calculate Risk"}
        </Button>
        {riskResult ? (
          <Button
            type="button"
            onClick={handleSubmit}
            isLoading={applyMutation.isPending}
            disabled={riskResult.riskLevel === "HIGH"}
          >
            Submit Application
          </Button>
        ) : null}
      </div>
    </Card>
  );
};

export default LoanApplicationForm;
