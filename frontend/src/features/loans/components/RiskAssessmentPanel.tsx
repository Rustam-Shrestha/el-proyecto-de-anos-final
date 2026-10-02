import { memo, useCallback, useMemo, useState } from "react";
import type { ComponentType, FormEvent } from "react";
import { Button } from "@shared/components/Button";
import Card from "@shared/components/Card";
import InputField from "@components/common/InputField";
import CustomSelectField from "@components/common/SelectField";
import { useFinguardHealthQuery, useFinguardPredictMutation } from "@features/loans/api/finguardApi";
import type { FinguardPredictInput, FinguardResult } from "@features/loans/api/finguardApi";

/** `SelectField` ships with `@ts-nocheck`, so its props need a local type. */
type SelectFieldProps = {
  label?: string;
  value: string;
  onChange: (event: { target: { value: string } }) => void;
  options: { value: string; label: string }[];
  placeholder?: string;
  error?: string;
  disabled?: boolean;
  className?: string;
};

const Select = CustomSelectField as unknown as ComponentType<SelectFieldProps>;

const CREDIT_SCORE_MIN = 300;
const CREDIT_SCORE_MAX = 850;
const DAYS_PER_YEAR = 365.25;
const TOP_FACTOR_COUNT = 5;

const occupationOptions = [
  { value: "Laborer", label: "Laborer" },
  { value: "Sales staff", label: "Sales staff" },
  { value: "High skill tech staff", label: "High skill tech staff" },
  { value: "Medium skill tech staff", label: "Medium skill tech staff" },
  { value: "Low skill tech staff", label: "Low skill tech staff" },
  { value: "Working", label: "Working" },
  { value: "Pensioner", label: "Pensioner" },
  { value: "Unemployed", label: "Unemployed" },
];

const organizationOptions = [
  { value: "Business entity type 1", label: "Business entity type 1" },
  { value: "Business entity type 2", label: "Business entity type 2" },
  { value: "Business entity type 3", label: "Business entity type 3" },
  { value: "Government", label: "Government" },
  { value: "Other", label: "Other" },
  { value: "State", label: "State" },
  { value: "School", label: "School" },
  { value: "Transport", label: "Transport" },
  { value: "Trade", label: "Trade" },
  { value: "XNA", label: "XNA (Other)" },
];

/** Raw form shape. Day counts are captured as friendly year inputs. */
export type RiskAssessmentFormState = {
  AMT_INCOME_TOTAL: string;
  AMT_CREDIT: string;
  AMT_ANNUITY: string;
  AMT_GOODS_PRICE: string;
  AGE_YEARS: string;
  EMPLOYED_YEARS: string;
  CNT_CHILDREN: string;
  CNT_FAM_MEMBERS: string;
  EXT_SOURCE_2: string;
  OCCUPATION_TYPE: string;
  ORGANIZATION_TYPE: string;
};

const initialFormState: RiskAssessmentFormState = {
  AMT_INCOME_TOTAL: "",
  AMT_CREDIT: "",
  AMT_ANNUITY: "",
  AMT_GOODS_PRICE: "",
  AGE_YEARS: "32",
  EMPLOYED_YEARS: "5",
  CNT_CHILDREN: "0",
  CNT_FAM_MEMBERS: "2",
  EXT_SOURCE_2: "0",
  OCCUPATION_TYPE: "Laborer",
  ORGANIZATION_TYPE: "Other",
};

export type RiskAssessmentPanelProps = {
  defaultValues?: Partial<RiskAssessmentFormState> | Partial<FinguardPredictInput>;
};

const parseNumber = (raw: string): number => {
  const parsed = Number(raw.replace(/,/g, "").trim());
  return Number.isFinite(parsed) ? parsed : 0;
};

const toDays = (years: number): number => -Math.round(years * DAYS_PER_YEAR);

const formatNumber = (value: number, fractionDigits = 0) =>
  new Intl.NumberFormat("en-US", {
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits,
  }).format(value);

const formatPercent = (value: number) => `${formatNumber(value * 100, 2)}%`;

const formatFeatureName = (raw: string) =>
  raw
    .replace(/_/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase()
    .replace(/^\w/, (char) => char.toUpperCase());

const clamp01 = (value: number) => Math.min(Math.max(value, 0), 1);

const scorePosition = (score: number) =>
  clamp01((score - CREDIT_SCORE_MIN) / (CREDIT_SCORE_MAX - CREDIT_SCORE_MIN));

/** Accepts either the form state or raw FinGuard feature keys as defaults. */
const resolveInitialState = (
  defaults?: RiskAssessmentPanelProps["defaultValues"]
): RiskAssessmentFormState => {
  if (!defaults) return initialFormState;

  const readNumber = (...keys: string[]): string | undefined => {
    for (const key of keys) {
      const value = (defaults as Record<string, unknown>)[key];
      if (typeof value === "number" && Number.isFinite(value)) return String(value);
      if (typeof value === "string" && value.trim() !== "") return value;
    }
    return undefined;
  };

  const readString = (...keys: string[]): string | undefined => {
    for (const key of keys) {
      const value = (defaults as Record<string, unknown>)[key];
      if (typeof value === "string" && value.trim() !== "") return value;
    }
    return undefined;
  };

  const ageYears = readNumber("AGE_YEARS", "age");
  const daysBirth = readNumber("DAYS_BIRTH", "days_birth");
  const employedYears = readNumber("EMPLOYED_YEARS");
  const daysEmployed = readNumber("DAYS_EMPLOYED", "days_employed");

  return {
    ...initialFormState,
    AMT_INCOME_TOTAL:
      readNumber("AMT_INCOME_TOTAL", "amt_income_total") ?? initialFormState.AMT_INCOME_TOTAL,
    AMT_CREDIT:
      readNumber("AMT_CREDIT", "amt_credit", "requestedAmount") ?? initialFormState.AMT_CREDIT,
    AMT_ANNUITY: readNumber("AMT_ANNUITY", "amt_annuity") ?? initialFormState.AMT_ANNUITY,
    AMT_GOODS_PRICE:
      readNumber("AMT_GOODS_PRICE", "amt_goods_price") ?? initialFormState.AMT_GOODS_PRICE,
    AGE_YEARS:
      ageYears ??
      (daysBirth ? formatNumber(Math.abs(parseNumber(daysBirth)) / DAYS_PER_YEAR, 1) : initialFormState.AGE_YEARS),
    EMPLOYED_YEARS:
      employedYears ??
      (daysEmployed && parseNumber(daysEmployed) !== 0
        ? formatNumber(Math.abs(parseNumber(daysEmployed)) / DAYS_PER_YEAR, 1)
        : initialFormState.EMPLOYED_YEARS),
    CNT_CHILDREN: readNumber("CNT_CHILDREN", "cnt_children") ?? initialFormState.CNT_CHILDREN,
    CNT_FAM_MEMBERS:
      readNumber("CNT_FAM_MEMBERS", "cnt_fam_members") ?? initialFormState.CNT_FAM_MEMBERS,
    EXT_SOURCE_2: readNumber("EXT_SOURCE_2", "ext_source_2") ?? initialFormState.EXT_SOURCE_2,
    OCCUPATION_TYPE:
      readString("OCCUPATION_TYPE", "occupation_type") ?? initialFormState.OCCUPATION_TYPE,
    ORGANIZATION_TYPE:
      readString("ORGANIZATION_TYPE", "organization_type") ?? initialFormState.ORGANIZATION_TYPE,
  };
};

const buildPayload = (form: RiskAssessmentFormState): FinguardPredictInput => ({
  AMT_INCOME_TOTAL: parseNumber(form.AMT_INCOME_TOTAL),
  AMT_CREDIT: parseNumber(form.AMT_CREDIT),
  AMT_ANNUITY: parseNumber(form.AMT_ANNUITY),
  AMT_GOODS_PRICE: parseNumber(form.AMT_GOODS_PRICE),
  DAYS_BIRTH: toDays(parseNumber(form.AGE_YEARS)),
  DAYS_EMPLOYED: toDays(parseNumber(form.EMPLOYED_YEARS)),
  CNT_CHILDREN: parseNumber(form.CNT_CHILDREN),
  CNT_FAM_MEMBERS: parseNumber(form.CNT_FAM_MEMBERS),
  EXT_SOURCE_2: parseNumber(form.EXT_SOURCE_2),
  OCCUPATION_TYPE: form.OCCUPATION_TYPE,
  ORGANIZATION_TYPE: form.ORGANIZATION_TYPE,
});

const isApproved = (result: FinguardResult | null) =>
  (result?.decision ?? "").toUpperCase().includes("APPROVE");

const RiskAssessmentPanel = ({ defaultValues }: RiskAssessmentPanelProps) => {
  const [form, setForm] = useState<RiskAssessmentFormState>(() => resolveInitialState(defaultValues));
  const [result, setResult] = useState<FinguardResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showRaw, setShowRaw] = useState(false);

  const predictMutation = useFinguardPredictMutation();
  const { data: health } = useFinguardHealthQuery();

  const updateField = useCallback(
    <K extends keyof RiskAssessmentFormState>(field: K, value: string) => {
      setForm((prev) => ({ ...prev, [field]: value }));
    },
    []
  );

  const resetForm = useCallback(() => {
    setForm(resolveInitialState(defaultValues));
    setResult(null);
    setError(null);
    setShowRaw(false);
  }, [defaultValues]);

  const isLoading = predictMutation.isPending;

  const canSubmit = useMemo(
    () => parseNumber(form.AMT_INCOME_TOTAL) > 0 && parseNumber(form.AMT_CREDIT) > 0,
    [form.AMT_INCOME_TOTAL, form.AMT_CREDIT]
  );

  const handleSubmit = useCallback(
    async (event?: FormEvent<HTMLFormElement>) => {
      event?.preventDefault();
      setError(null);

      try {
        const response = await predictMutation.mutateAsync(buildPayload(form));
        setResult(response);
      } catch (caught) {
        const apiError = caught as { response?: { data?: { message?: string; detail?: unknown } } };
        const message =
          apiError?.response?.data?.message ??
          (typeof apiError?.response?.data?.detail === "string"
            ? apiError.response.data.detail
            : undefined);
        setError(message || "Unable to run the FinGuard risk assessment. Please try again.");
      }
    },
    [form, predictMutation]
  );

  const topFactors = useMemo<{ feature: string; contribution: number }[]>(() => {
    if (!result) return [];

    const fromFactors: { feature: string; contribution: number }[] = (result.topFactors ?? []).map(
      (factor) => ({ feature: factor.feature, contribution: factor.contribution })
    );
    const fromShap: { feature: string; contribution: number }[] = Object.entries(
      result.shap_summary ?? {}
    ).map(([feature, contribution]) => ({ feature, contribution: Number(contribution) || 0 }));

    const entries = fromFactors.length > 0 ? fromFactors : fromShap;

    return entries
      .sort((a, b) => Math.abs(b.contribution) - Math.abs(a.contribution))
      .slice(0, TOP_FACTOR_COUNT);
  }, [result]);

  const maxFactorMagnitude = useMemo(
    () => topFactors.reduce((max, factor) => Math.max(max, Math.abs(factor.contribution)), 0) || 1,
    [topFactors]
  );

  const creditScore = result?.credit_score ?? result?.creditScore ?? null;
  const approved = isApproved(result);

  return (
    <Card className="flex h-full flex-col">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.08em] text-[#64748B]">
            FinGuard ML Engine
          </p>
          <h2 className="mt-1 text-lg font-semibold text-[#0F172A]">AI Risk Assessment</h2>
          <p className="mt-1 text-sm text-[#64748B]">
            Run an instant model check on your profile before submitting the application.
          </p>
        </div>
        {health ? (
          <span
            className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${
              health.ok ? "bg-[#DCFCE7] text-[#15803D]" : "bg-[#FEF3C7] text-[#92400E]"
            }`}
          >
            <span
              className={`h-1.5 w-1.5 rounded-full ${health.ok ? "bg-[#15803D]" : "bg-[#D97706]"}`}
              aria-hidden="true"
            />
            Model {health.ok ? "ready" : "degraded"}
          </span>
        ) : null}
      </div>

      <form onSubmit={handleSubmit} className="mt-5 flex flex-1 flex-col">
        <div className="grid gap-4 sm:grid-cols-2">
          <InputField
            label="Annual Income"
            inputMode="numeric"
            value={form.AMT_INCOME_TOTAL}
            onChange={(event) => updateField("AMT_INCOME_TOTAL", event.target.value.replace(/[^0-9.]/g, ""))}
            placeholder="e.g. 450000"
            disabled={isLoading}
          />
          <InputField
            label="Loan Amount Requested"
            inputMode="numeric"
            value={form.AMT_CREDIT}
            onChange={(event) => updateField("AMT_CREDIT", event.target.value.replace(/[^0-9.]/g, ""))}
            placeholder="e.g. 200000"
            disabled={isLoading}
          />
          <InputField
            label="Monthly Annuity / EMI"
            inputMode="numeric"
            value={form.AMT_ANNUITY}
            onChange={(event) => updateField("AMT_ANNUITY", event.target.value.replace(/[^0-9.]/g, ""))}
            placeholder="e.g. 18000"
            disabled={isLoading}
          />
          <InputField
            label="Goods Price"
            inputMode="numeric"
            value={form.AMT_GOODS_PRICE}
            onChange={(event) => updateField("AMT_GOODS_PRICE", event.target.value.replace(/[^0-9.]/g, ""))}
            placeholder="e.g. 250000"
            disabled={isLoading}
          />
          <InputField
            label="Age (years)"
            inputMode="numeric"
            value={form.AGE_YEARS}
            onChange={(event) => updateField("AGE_YEARS", event.target.value.replace(/[^0-9.]/g, ""))}
            placeholder="e.g. 32"
            disabled={isLoading}
          />
          <InputField
            label="Employment (years)"
            inputMode="numeric"
            value={form.EMPLOYED_YEARS}
            onChange={(event) => updateField("EMPLOYED_YEARS", event.target.value.replace(/[^0-9.]/g, ""))}
            placeholder="e.g. 5"
            disabled={isLoading}
          />
          <InputField
            label="Number of Children"
            inputMode="numeric"
            value={form.CNT_CHILDREN}
            onChange={(event) => updateField("CNT_CHILDREN", event.target.value.replace(/[^0-9.]/g, ""))}
            placeholder="e.g. 1"
            disabled={isLoading}
          />
          <InputField
            label="Family Members"
            inputMode="numeric"
            value={form.CNT_FAM_MEMBERS}
            onChange={(event) => updateField("CNT_FAM_MEMBERS", event.target.value.replace(/[^0-9.]/g, ""))}
            placeholder="e.g. 3"
            disabled={isLoading}
          />
          <InputField
            label="External Source 2 Score"
            inputMode="numeric"
            value={form.EXT_SOURCE_2}
            onChange={(event) => updateField("EXT_SOURCE_2", event.target.value.replace(/[^0-9.-]/g, ""))}
            placeholder="e.g. 0"
            disabled={isLoading}
          />
          <Select
            label="Occupation"
            value={form.OCCUPATION_TYPE}
            onChange={(event) => updateField("OCCUPATION_TYPE", event.target.value)}
            options={occupationOptions}
            disabled={isLoading}
          />
          <div className="sm:col-span-2">
            <Select
              label="Organization Type"
              value={form.ORGANIZATION_TYPE}
              onChange={(event) => updateField("ORGANIZATION_TYPE", event.target.value)}
              options={organizationOptions}
              disabled={isLoading}
            />
          </div>
        </div>

        <div className="mt-5 flex flex-wrap items-center gap-3 border-t border-[#E2E8F0] pt-5">
          <Button type="submit" isLoading={isLoading} disabled={!canSubmit}>
            {result ? "Re-run Assessment" : "Run Risk Assessment"}
          </Button>
          <Button type="button" variant="secondary" onClick={resetForm} disabled={isLoading}>
            Reset
          </Button>
          {!canSubmit ? (
            <span className="text-xs text-[#64748B]">Annual income and loan amount are required.</span>
          ) : null}
        </div>

        {error ? (
          <div
            role="alert"
            className="mt-4 rounded-[8px] border border-red-200 bg-[#FEF2F2] p-4 text-sm text-[#B91C1C]"
          >
            {error}
          </div>
        ) : null}

        {isLoading ? (
          <div
            aria-live="polite"
            className="mt-4 rounded-[8px] border border-[#E2E8F0] bg-[#F8FAFC] p-6 text-center text-sm text-[#64748B]"
          >
            <span className="inline-flex items-center gap-2">
              <span
                className="h-3 w-3 animate-spin rounded-full border-2 border-[#CBD5E1] border-t-[#15803D]"
                aria-hidden="true"
              />
              Scoring your profile with FinGuard…
            </span>
          </div>
        ) : null}

        {result && !isLoading ? (
          <div className="mt-5 space-y-5 border-t border-[#E2E8F0] pt-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.08em] text-[#64748B]">
                  Model Decision
                </p>
                <p
                  className={`mt-1 text-xs ${
                    approved ? "text-[#15803D]" : "text-[#B91C1C]"
                  }`}
                >
                  {result.risk_band ? `Risk band: ${result.risk_band}` : "Risk band: n/a"}
                </p>
              </div>
              <span
                className={`inline-flex items-center rounded-full px-3 py-1.5 text-sm font-semibold ${
                  approved ? "bg-[#DCFCE7] text-[#15803D]" : "bg-[#FEE2E2] text-[#B91C1C]"
                }`}
              >
                {approved ? "APPROVE" : "REJECT"}
              </span>
            </div>

            <div>
              <div className="flex items-baseline justify-between">
                <span className="text-sm font-medium text-[#0F172A]">Default probability</span>
                <span className="text-lg font-semibold tabular-nums text-[#0F172A]">
                  {formatPercent(result.probability)}
                </span>
              </div>
              <div
                className="mt-2 h-2 w-full overflow-hidden rounded-full bg-[#E2E8F0]"
                role="progressbar"
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={Math.round(clamp01(result.probability) * 100)}
                aria-label="Default probability"
              >
                <div
                  className={`h-full rounded-full ${
                    approved ? "bg-[#15803D]" : "bg-[#DC2626]"
                  }`}
                  style={{ width: `${clamp01(result.probability) * 100}%` }}
                />
              </div>
              <p className="mt-1 text-xs text-[#64748B]">
                Decision threshold:{" "}
                <span className="tabular-nums">
                  {typeof result.threshold === "number" ? formatPercent(result.threshold) : "n/a"}
                </span>
              </p>
            </div>

            <div>
              <div className="flex items-baseline justify-between">
                <span className="text-sm font-medium text-[#0F172A]">Risk score</span>
                <span className="text-lg font-semibold tabular-nums text-[#0F172A]">
                  {formatNumber(result.risk_score, 4)}
                </span>
              </div>
              <div
                className="relative mt-2 h-2 w-full overflow-hidden rounded-full bg-[#E2E8F0]"
                role="progressbar"
                aria-valuemin={CREDIT_SCORE_MIN}
                aria-valuemax={CREDIT_SCORE_MAX}
                aria-valuenow={Math.round(clamp01(scorePosition(result.risk_score)) * (CREDIT_SCORE_MAX - CREDIT_SCORE_MIN) + CREDIT_SCORE_MIN)}
                aria-label="Risk score between 300 and 850"
              >
                <div
                  className={`h-full rounded-full ${
                    approved ? "bg-[#15803D]" : "bg-[#D97706]"
                  }`}
                  style={{ width: `${scorePosition(result.risk_score) * 100}%` }}
                />
              </div>
              <div className="mt-1 flex justify-between text-[11px] tabular-nums text-[#94A3B8]">
                <span>{CREDIT_SCORE_MIN}</span>
                <span>{CREDIT_SCORE_MAX}</span>
              </div>
            </div>

            <dl className="grid grid-cols-2 gap-3 rounded-[8px] border border-[#E2E8F0] bg-[#F8FAFC] p-4 text-sm">
              <div>
                <dt className="text-xs uppercase tracking-wide text-[#64748B]">Credit score</dt>
                <dd className="mt-0.5 font-semibold tabular-nums text-[#0F172A]">
                  {typeof creditScore === "number" ? formatNumber(creditScore) : "n/a"}
                </dd>
              </div>
              <div>
                <dt className="text-xs uppercase tracking-wide text-[#64748B]">Threshold</dt>
                <dd className="mt-0.5 font-semibold tabular-nums text-[#0F172A]">
                  {typeof result.threshold === "number" ? formatNumber(result.threshold, 4) : "n/a"}
                </dd>
              </div>
              {result.recommendation ? (
                <div className="col-span-2">
                  <dt className="text-xs uppercase tracking-wide text-[#64748B]">Recommendation</dt>
                  <dd className="mt-0.5 text-[#0F172A]">{result.recommendation}</dd>
                </div>
              ) : null}
              {result.model_version ? (
                <div className="col-span-2">
                  <dt className="text-xs uppercase tracking-wide text-[#64748B]">Model version</dt>
                  <dd className="mt-0.5 text-[#0F172A]">{result.model_version}</dd>
                </div>
              ) : null}
            </dl>

            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.08em] text-[#64748B]">
                Top {TOP_FACTOR_COUNT} risk factors
              </p>
              {topFactors.length > 0 ? (
                <ul className="mt-3 space-y-2.5">
                  {topFactors.map((factor) => {
                    const width = (Math.abs(factor.contribution) / maxFactorMagnitude) * 100;
                    const increasesRisk = factor.contribution >= 0;
                    return (
                      <li key={factor.feature}>
                        <div className="flex items-baseline justify-between gap-3 text-xs">
                          <span className="truncate font-medium text-[#0F172A]">
                            {formatFeatureName(factor.feature)}
                          </span>
                          <span
                            className={`shrink-0 tabular-nums ${
                              increasesRisk ? "text-[#B91C1C]" : "text-[#15803D]"
                            }`}
                          >
                            {increasesRisk ? "+" : ""}
                            {formatNumber(factor.contribution, 4)}
                          </span>
                        </div>
                        <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-[#E2E8F0]">
                          <div
                            className={`h-full rounded-full ${
                              increasesRisk ? "bg-[#DC2626]" : "bg-[#15803D]"
                            }`}
                            style={{ width: `${Math.max(width, 2)}%` }}
                          />
                        </div>
                      </li>
                    );
                  })}
                </ul>
              ) : (
                <p className="mt-2 text-sm text-[#64748B]">
                  No feature attribution was returned for this assessment.
                </p>
              )}
              <p className="mt-2 text-[11px] text-[#94A3B8]">
                Positive values raise default risk; negative values lower it.
              </p>
            </div>

            <div className="rounded-[8px] border border-[#E2E8F0] bg-[#F8FAFC]">
              <button
                type="button"
                onClick={() => setShowRaw((prev) => !prev)}
                aria-expanded={showRaw}
                className="flex w-full items-center justify-between px-4 py-3 text-left text-sm font-medium text-[#0F172A]"
              >
                <span>Raw model response</span>
                <span aria-hidden="true" className="text-[#64748B]">
                  {showRaw ? "Hide" : "Show"}
                </span>
              </button>
              {showRaw ? (
                <pre className="max-h-72 overflow-auto border-t border-[#E2E8F0] px-4 py-3 text-[11px] leading-relaxed text-[#334155]">
                  {JSON.stringify(result, null, 2)}
                </pre>
              ) : null}
            </div>
          </div>
        ) : null}
      </form>
    </Card>
  );
};

RiskAssessmentPanel.displayName = "RiskAssessmentPanel";

export default memo(RiskAssessmentPanel);
