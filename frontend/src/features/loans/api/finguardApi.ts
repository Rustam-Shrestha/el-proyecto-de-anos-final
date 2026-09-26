import { useMutation, useQuery } from "@tanstack/react-query";
import { apiClient } from "@shared/lib/apiClient";
import type { ApiResponse } from "@shared/types/common";

/* ────────────────────────────────────────────────────────────────────
 * FinGuard ML risk-assessment API (Node proxy → FastAPI).
 * Endpoints live under `${VITE_API_BASE_URL}/loan-assessment/*`.
 * Every hook unwraps the `{ success, message, data }` ApiResponse envelope.
 * ──────────────────────────────────────────────────────────────────── */

export const finguardEndpoints = {
  predict: "/loan-assessment/finguard/predict",
  batch: "/loan-assessment/finguard/batch",
  explain: "/loan-assessment/finguard/explain",
  schema: "/loan-assessment/finguard/schema",
  health: "/loan-assessment/finguard/health",
  nluChat: "/loan-assessment/nlu/chat",
  documentAnalyze: "/loan-assessment/document/analyze",
} as const;

export const finguardLoanKeys = {
  all: ["loans", "finguard"] as const,
  health: ["loans", "finguard", "health"] as const,
  schema: ["loans", "finguard", "schema"] as const,
} as const;

/* ──────────────────────────── types ──────────────────────────────── */

/**
 * Home Credit style features. The Node proxy accepts UPPER_CASE or
 * lower_case keys, so both spellings are declared optional.
 */
export type FinguardPredictInput = {
  AMT_INCOME_TOTAL?: number;
  amt_income_total?: number;
  AMT_CREDIT?: number;
  amt_credit?: number;
  AMT_ANNUITY?: number;
  amt_annuity?: number;
  AMT_GOODS_PRICE?: number;
  amt_goods_price?: number;
  DAYS_BIRTH?: number;
  days_birth?: number;
  DAYS_EMPLOYED?: number;
  days_employed?: number;
  CNT_CHILDREN?: number;
  cnt_children?: number;
  CNT_FAM_MEMBERS?: number;
  cnt_fam_members?: number;
  OCCUPATION_TYPE?: string;
  occupation_type?: string;
  ORGANIZATION_TYPE?: string;
  organization_type?: string;
  NAME_CONTRACT_TYPE?: string;
  name_contract_type?: string;
  CODE_GENDER?: string;
  code_gender?: string;
  NAME_INCOME_TYPE?: string;
  name_income_type?: string;
  EXT_SOURCE_2?: number;
  ext_source_2?: number;
  /** Convenience alias mapped server-side to `amt_credit`. */
  requestedAmount?: number;
  [key: string]: unknown;
};

export type FinguardDecision = "APPROVE" | "REJECT" | string;

export type FinguardResult = {
  status: string;
  /** Alias of `probability` kept for the /predict spec contract. */
  prediction: number;
  /** Default probability as a 0..1 fraction. */
  probability: number;
  /** Credit score on the 300–850 scale. */
  risk_score: number;
  raw?: Record<string, unknown>;
  credit_score?: number;
  risk_band?: string;
  decision?: FinguardDecision;
  threshold?: number;
  shap_summary?: Record<string, number>;
  model_version?: string;
  /** Fields the Node proxy adds when mapping the envelope to a loan result. */
  riskLevel?: string;
  defaultProbability?: number;
  riskScore?: number;
  creditScore?: number | null;
  eligibleAmount?: number;
  eligibilityScore?: number;
  monthlyEmi?: number;
  maxMonthlyEmi?: number;
  recommendedTenure?: number;
  recommendation?: string;
  topFactors?: FinguardFactor[];
};

export type FinguardFactor = {
  feature: string;
  contribution: number;
  direction: "increase" | "decrease";
};

export type FinguardBatchItem = {
  index: number;
  ok: boolean;
  prediction?: FinguardResult;
  error?: string;
};

export type FinguardBatchResult = {
  status: "ok" | "degraded" | "error" | string;
  count: number;
  source?: string;
  results: FinguardBatchItem[];
};

export type FinguardExplainResult = {
  status: string;
  source: string;
  prediction: number;
  probability: number;
  risk_score: number;
  decision: FinguardDecision;
  summary: string;
  factors: FinguardFactor[];
  raw?: Record<string, unknown>;
};

export type FinguardSchemaResult = {
  status: string;
  source?: string;
  model_version?: string;
  required_features: string[];
  optional_features: string[];
  feature_aliases?: Record<string, string>;
  raw?: Record<string, unknown>;
};

export type FinguardHealthResult = {
  status: string;
  ok: boolean;
  ready: boolean;
  baseUrl?: string;
  latencyMs?: number;
  model?: string;
  raw?: Record<string, unknown>;
  error?: string;
};

export type FinguardNluResult = {
  status: string;
  source?: string;
  intent: string;
  answer: string;
  confidence: number;
  extracted_entities: Record<string, unknown>;
  sessionId?: string;
  raw?: Record<string, unknown>;
};

export type FinguardDocumentResult = {
  status: string;
  source?: string;
  document_type: string;
  confidence: number;
  fields: Record<string, unknown>;
  finguard_features?: Record<string, number>;
  raw?: Record<string, unknown>;
};

/* ─────────────────────────── helpers ─────────────────────────────── */

const asRecord = (value: unknown): Record<string, unknown> =>
  value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};

const toNumber = (value: unknown): number | undefined => {
  if (typeof value === "number") return Number.isFinite(value) ? value : undefined;
  if (typeof value === "string" && value.trim() !== "") {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : undefined;
  }
  return undefined;
};

const toStr = (value: unknown): string | undefined => {
  if (typeof value === "string") return value;
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  return undefined;
};

/**
 * The Node proxy may answer with a bare payload or an `ApiResponse`
 * envelope. Unwrap both, mirroring the pattern in `loansApi.ts`.
 */
const unwrap = <T>(payload: unknown): T => {
  const record = asRecord(payload);
  if ("success" in record && "data" in record) {
    return record.data as T;
  }
  if ("data" in record && Object.keys(record).length <= 2) {
    return record.data as T;
  }
  return payload as T;
};

const toShapSummary = (value: unknown): Record<string, number> | undefined => {
  const record = asRecord(value);
  const entries = Object.entries(record);
  if (entries.length === 0) return undefined;
  const out: Record<string, number> = {};
  for (const [key, raw] of entries) {
    const num = toNumber(raw);
    if (num !== undefined) out[key] = num;
  }
  return Object.keys(out).length > 0 ? out : undefined;
};

const toFactors = (value: unknown): FinguardFactor[] => {
  if (Array.isArray(value)) {
    return value
      .map((item) => {
        const rec = asRecord(item);
        const feature = toStr(rec.feature);
        const contribution = toNumber(rec.contribution);
        if (!feature || contribution === undefined) return null;
        return {
          feature,
          contribution,
          direction: (toStr(rec.direction) ?? (contribution >= 0 ? "increase" : "decrease")) as FinguardFactor["direction"],
        };
      })
      .filter((item): item is FinguardFactor => item !== null)
      .sort((a, b) => Math.abs(b.contribution) - Math.abs(a.contribution));
  }

  const shap = toShapSummary(value);
  if (!shap) return [];
  return Object.entries(shap)
    .map(([feature, contribution]) => ({
      feature,
      contribution,
      direction: (contribution >= 0 ? "increase" : "decrease") as FinguardFactor["direction"],
    }))
    .sort((a, b) => Math.abs(b.contribution) - Math.abs(a.contribution));
};

const normalizeDecision = (value: unknown, probability: number, threshold?: number): FinguardDecision => {
  const raw = toStr(value);
  if (raw) {
    const upper = raw.toUpperCase();
    if (upper.includes("APPROVE")) return "APPROVE";
    if (upper.includes("DECLINE") || upper.includes("REJECT")) return "REJECT";
    return raw;
  }
  return probability >= (threshold ?? 0.5) ? "REJECT" : "APPROVE";
};

/**
 * Tolerates both the spec envelope (snake_case: `status` / `probability` /
 * `risk_score`) and the loan-mapped body the Node proxy returns
 * (`riskScore` / `defaultProbability` / `topFactors`), and merges the nested
 * `raw` upstream payload.
 */
export const normalizeFinguardResult = (input: unknown): FinguardResult => {
  const record = asRecord(input);
  const raw = asRecord(record.raw);

  const probability =
    toNumber(record.probability) ??
    toNumber(record.prediction) ??
    toNumber(record.defaultProbability) ??
    toNumber(raw.default_probability) ??
    0;

  const riskScore =
    toNumber(record.risk_score) ??
    toNumber(record.riskScore) ??
    toNumber(raw.risk_score) ??
    probability;

  const creditScore =
    toNumber(record.credit_score) ??
    toNumber(record.creditScore) ??
    toNumber(raw.credit_score) ??
    toNumber(raw.creditScore);

  const threshold = toNumber(record.threshold) ?? toNumber(raw.threshold);

  const shapSummary =
    toShapSummary(record.shap_summary) ??
    toShapSummary(raw.shap_summary) ??
    toShapSummary(raw.shap) ??
    (() => {
      const factors = toFactors(record.topFactors);
      return factors.length > 0
        ? Object.fromEntries(factors.map((f) => [f.feature, f.contribution]))
        : undefined;
    })();

  const topFactors = toFactors(record.topFactors ?? shapSummary).slice(0, 10);

  return {
    status: toStr(record.status) ?? (toStr(raw.status) ?? "ok"),
    prediction: probability,
    probability,
    risk_score: riskScore,
    raw: Object.keys(raw).length > 0 ? raw : undefined,
    credit_score: creditScore,
    risk_band: toStr(record.risk_band) ?? toStr(record.riskBand) ?? toStr(raw.risk_band) ?? toStr(raw.riskBand) ?? toStr(record.riskLevel),
    decision: normalizeDecision(record.decision ?? raw.decision, probability, threshold),
    threshold,
    shap_summary: shapSummary,
    model_version: toStr(record.model_version) ?? toStr(record.modelVersion) ?? toStr(raw.model_version),
    riskLevel: toStr(record.riskLevel),
    defaultProbability: toNumber(record.defaultProbability),
    riskScore: toNumber(record.riskScore),
    creditScore: creditScore ?? null,
    eligibleAmount: toNumber(record.eligibleAmount),
    eligibilityScore: toNumber(record.eligibilityScore),
    monthlyEmi: toNumber(record.monthlyEmi),
    maxMonthlyEmi: toNumber(record.maxMonthlyEmi),
    recommendedTenure: toNumber(record.recommendedTenure),
    recommendation: toStr(record.recommendation),
    topFactors: topFactors.length > 0 ? topFactors : undefined,
  };
};

const normalizeBatchResult = (input: unknown): FinguardBatchResult => {
  const record = asRecord(input);
  const list = Array.isArray(input) ? input : (Array.isArray(record.results) ? record.results : []);

  const results: FinguardBatchItem[] = list.map((item, index) => {
    const rec = asRecord(item);
    const error = toStr(rec.error);
    return {
      index: toNumber(rec.index) ?? index,
      ok: rec.ok !== false && error === undefined,
      prediction: error ? undefined : normalizeFinguardResult(rec.prediction ?? rec),
      error,
    };
  });

  return {
    status: toStr(record.status) ?? (results.length > 0 ? "ok" : "error"),
    count: toNumber(record.count) ?? results.length,
    source: toStr(record.source),
    results,
  };
};

const normalizeExplainResult = (input: unknown): FinguardExplainResult => {
  const record = asRecord(input);
  const base = normalizeFinguardResult(record);
  return {
    status: base.status,
    source: toStr(record.source) ?? "derived_from_predict",
    prediction: base.probability,
    probability: base.probability,
    risk_score: base.risk_score,
    decision: base.decision ?? "APPROVE",
    summary: toStr(record.summary) ?? "",
    factors: toFactors(record.factors ?? base.shap_summary).slice(0, 10),
    raw: base.raw,
  };
};

const normalizeSchemaResult = (input: unknown): FinguardSchemaResult => {
  const record = asRecord(input);
  const raw = asRecord(record.raw);
  const toList = (value: unknown): string[] =>
    Array.isArray(value) ? value.map((v) => String(v)) : [];

  return {
    status: toStr(record.status) ?? "ok",
    source: toStr(record.source),
    model_version: toStr(record.model_version) ?? toStr(record.modelVersion) ?? toStr(raw.modelVersion),
    required_features: toList(record.required_features ?? raw.required_features),
    optional_features: toList(record.optional_features ?? raw.optional_features),
    feature_aliases: asRecord(record.feature_aliases ?? raw.feature_aliases) as Record<string, string>,
    raw: Object.keys(raw).length > 0 ? raw : undefined,
  };
};

const normalizeHealthResult = (input: unknown): FinguardHealthResult => {
  const record = asRecord(input);
  const raw = asRecord(record.raw);
  const status = toStr(record.status) ?? toStr(raw.status) ?? "ok";
  const ready = record.ready === true || raw.ready === true || status === "healthy" || status === "ok";
  return {
    status,
    ok: record.ok === false ? false : ready,
    ready,
    baseUrl: toStr(record.baseUrl),
    latencyMs: toNumber(record.latencyMs),
    model: toStr(record.model) ?? toStr(raw.model) ?? toStr(raw.model_version),
    raw: Object.keys(raw).length > 0 ? raw : undefined,
    error: toStr(record.error),
  };
};

const normalizeNluResult = (input: unknown): FinguardNluResult => {
  const record = asRecord(input);
  const raw = asRecord(record.raw);
  return {
    status: toStr(record.status) ?? "ok",
    source: toStr(record.source),
    intent: toStr(record.intent) ?? toStr(raw.intent) ?? "UNRECOGNIZED",
    answer: toStr(record.answer) ?? toStr(raw.answer) ?? "",
    confidence: toNumber(record.confidence) ?? toNumber(raw.confidence) ?? 0,
    extracted_entities: asRecord(record.extracted_entities ?? raw.extracted_entities),
    sessionId: toStr(record.sessionId),
    raw: Object.keys(raw).length > 0 ? raw : undefined,
  };
};

const normalizeDocumentResult = (input: unknown): FinguardDocumentResult => {
  const record = asRecord(input);
  const raw = asRecord(record.raw);
  return {
    status: toStr(record.status) ?? "ok",
    source: toStr(record.source),
    document_type: toStr(record.document_type) ?? toStr(raw.document_type) ?? "UNKNOWN",
    confidence: toNumber(record.confidence) ?? toNumber(raw.confidence) ?? 0,
    fields: Object.keys(record).length > 0 ? asRecord(record.fields ?? record) : {},
    finguard_features: toShapSummary(record.finguard_features ?? raw.finguard_features),
    raw: Object.keys(raw).length > 0 ? raw : undefined,
  };
};

/* ────────────────────────── api functions ────────────────────────── */

export const predictFinguard = async (
  payload: FinguardPredictInput
): Promise<FinguardResult> => {
  const { data } = await apiClient.post<ApiResponse<unknown>>(
    finguardEndpoints.predict,
    payload
  );
  return normalizeFinguardResult(unwrap(data));
};

export const batchFinguard = async (
  items: FinguardPredictInput[]
): Promise<FinguardBatchResult> => {
  const { data } = await apiClient.post<ApiResponse<unknown>>(
    finguardEndpoints.batch,
    { items }
  );
  return normalizeBatchResult(unwrap(data));
};

export const explainFinguard = async (
  payload: FinguardPredictInput
): Promise<FinguardExplainResult> => {
  const { data } = await apiClient.post<ApiResponse<unknown>>(
    finguardEndpoints.explain,
    payload
  );
  return normalizeExplainResult(unwrap(data));
};

export const getFinguardSchema = async (): Promise<FinguardSchemaResult> => {
  const { data } = await apiClient.get<ApiResponse<unknown>>(finguardEndpoints.schema);
  return normalizeSchemaResult(unwrap(data));
};

export const getFinguardHealth = async (): Promise<FinguardHealthResult> => {
  const { data } = await apiClient.get<ApiResponse<unknown>>(finguardEndpoints.health);
  return normalizeHealthResult(unwrap(data));
};

export const chatNlu = async (
  message: string,
  options?: { userId?: string; sessionId?: string }
): Promise<FinguardNluResult> => {
  const { data } = await apiClient.post<ApiResponse<unknown>>(finguardEndpoints.nluChat, {
    message,
    ...(options?.userId ? { user_id: options.userId } : {}),
    ...(options?.sessionId ? { session_id: options.sessionId } : {}),
  });
  return normalizeNluResult(unwrap(data));
};

export const analyzeDocument = async (
  text: string,
  documentType?: string
): Promise<FinguardDocumentResult> => {
  const { data } = await apiClient.post<ApiResponse<unknown>>(
    finguardEndpoints.documentAnalyze,
    { text, document_type: documentType ?? "AUTO" }
  );
  return normalizeDocumentResult(unwrap(data));
};

/* ─────────────────────────── query hooks ─────────────────────────── */

export const useFinguardPredictMutation = () =>
  useMutation({
    mutationFn: predictFinguard,
  });

export const useFinguardBatchMutation = () =>
  useMutation({
    mutationFn: batchFinguard,
  });

export const useFinguardExplainMutation = () =>
  useMutation({
    mutationFn: explainFinguard,
  });

export const useFinguardNluMutation = () =>
  useMutation({
    mutationFn: (variables: { message: string; userId?: string; sessionId?: string }) =>
      chatNlu(variables.message, { userId: variables.userId, sessionId: variables.sessionId }),
  });

export const useFinguardDocumentAnalyzeMutation = () =>
  useMutation({
    mutationFn: (variables: { text: string; documentType?: string }) =>
      analyzeDocument(variables.text, variables.documentType),
  });

export const useFinguardHealthQuery = (enabled = true) =>
  useQuery({
    queryKey: finguardLoanKeys.health,
    queryFn: getFinguardHealth,
    enabled,
    staleTime: 60 * 1000,
    retry: 1,
  });

export const useFinguardSchemaQuery = (enabled = true) =>
  useQuery({
    queryKey: finguardLoanKeys.schema,
    queryFn: getFinguardSchema,
    enabled,
    staleTime: 10 * 60 * 1000,
    retry: 1,
  });
