import axios from 'axios';
import type { AxiosError, AxiosRequestConfig } from 'axios';
import { env } from '@/config/env';
import { logger } from '@/config/logger';
import { AppError } from '@/utils/AppError';

/** Hard timeout for every FastAPI (FinGuard) call made through this proxy. */
export const FINGUARD_TIMEOUT_MS = 8000;

/** Documented FinGuard decision threshold (mirrors the FastAPI SPEC_THRESHOLD). */
const SPEC_THRESHOLD = 0.23;

export interface FinguardInput {
  amt_income_total: number;
  amt_credit: number;
  amt_annuity?: number;
  amt_goods_price?: number;
  days_birth: number;
  days_employed: number;
  cnt_children?: number;
  cnt_fam_members?: number;
  occupation_type?: string;
  organization_type?: string;
}

export interface FinguardResult {
  model_version: string;
  default_probability: number;
  credit_score: number;
  risk_band: string;
  decision: string;
  threshold: number;
  shap_summary: Record<string, number>;
  features_used: string[];
  timestamp: string;
}

/** Loose feature bag as accepted from callers (UPPER_CASE or lower_case). */
export type FinguardPayload = Record<string, unknown>;

/**
 * Spec-aligned response envelope (mirrors the FastAPI adapter envelope).
 * `prediction` is the APPROVE/REJECT label, `probability` the 0..1 default
 * probability, `risk_score` the 300..850 credit-style score.
 * The untouched upstream payload is always available in `raw`.
 */
export interface FinguardEnvelope {
  status: string;
  /** "APPROVE" | "REJECT" */
  prediction: string;
  /** Numeric alias of `probability` for consumers that want the score. */
  prediction_score: number;
  probability: number;
  risk_score: number;
  decision: string;
  model_version?: string;
  credit_score?: number;
  risk_band?: string;
  threshold?: number;
  spec_threshold?: number;
  shap_summary?: Record<string, number>;
  features_used?: string[];
  timestamp?: string;
  source: string;
  raw: Record<string, unknown>;
}

export interface FinguardBatchItem {
  index: number;
  ok: boolean;
  prediction?: FinguardEnvelope;
  error?: string;
}

export interface FinguardBatchResult {
  status: 'ok' | 'degraded' | 'error';
  count: number;
  source: string;
  results: FinguardBatchItem[];
  errors: Array<{ index?: number; error?: string; status?: string }>;
}

export interface FinguardFactor {
  feature: string;
  contribution: number;
  direction: 'increase' | 'decrease';
}

export interface FinguardExplainResult {
  status: string;
  source: 'explain_endpoint' | 'derived_from_predict';
  prediction: string;
  probability: number;
  risk_score: number;
  threshold?: number;
  spec_threshold?: number;
  decision: string;
  base_value?: number;
  summary: string;
  factors: FinguardFactor[];
  raw: Record<string, unknown>;
}

export interface FinguardSchemaResult {
  status: string;
  source: string;
  model_version?: string;
  total_features?: number;
  order_length?: number;
  threshold?: number;
  spec_threshold?: number;
  categorical_mappings?: Record<string, unknown>;
  feature_schema?: Record<string, unknown>;
  required_features: string[];
  optional_features: string[];
  feature_aliases: Record<string, string>;
  raw: Record<string, unknown>;
}

export interface FinguardHealthResult {
  status: string;
  ok: boolean;
  ready: boolean;
  baseUrl: string;
  latencyMs: number;
  model?: string;
  raw?: Record<string, unknown>;
  error?: string;
}

export interface FinguardNluResult {
  status: string;
  source: string;
  intent: string;
  answer: string;
  confidence: number;
  extracted_entities: Record<string, unknown>;
  raw: Record<string, unknown>;
}

export interface DocumentAnalysisResult {
  status: string;
  source: string;
  intent: string;
  confidence: number;
  document_type: string;
  summary: string;
  answer: string;
  extracted_entities: Record<string, unknown>;
  chart_type?: string;
  data_keys: string[];
  visualization: Record<string, unknown>;
  char_count: number;
  finguard_features?: Record<string, number>;
  raw: Record<string, unknown>;
}

/* ─────────────────────────── helpers ─────────────────────────── */

const REQUIRED_FEATURES = ['amt_income_total', 'amt_credit', 'days_birth', 'days_employed'] as const;
const OPTIONAL_FEATURES = [
  'amt_annuity',
  'amt_goods_price',
  'cnt_children',
  'cnt_fam_members',
  'occupation_type',
  'organization_type',
  'name_contract_type',
  'code_gender',
  'name_income_type',
  'name_education_type',
  'name_family_status',
  'name_housing_type',
  'extra_features',
] as const;

const NUMERIC_KEYS = [
  'amt_income_total',
  'amt_credit',
  'amt_annuity',
  'amt_goods_price',
  'days_birth',
  'days_employed',
  'cnt_children',
  'cnt_fam_members',
  'ext_source_1',
  'ext_source_2',
  'ext_source_3',
] as const;

const CATEGORICAL_KEYS = [
  'occupation_type',
  'organization_type',
  'name_contract_type',
  'code_gender',
  'name_income_type',
  'name_education_type',
  'name_family_status',
  'name_housing_type',
] as const;

const NUMERIC_DEFAULTS: Record<string, number> = {
  amt_annuity: 0,
  amt_goods_price: 0,
  cnt_children: 0,
  cnt_fam_members: 1,
  // FastAPI/HomeCredit defaults: ~32 years old, unemployed sentinel.
  days_birth: -12000,
  days_employed: 365243,
};

/** Friendly aliases accepted from the Node layer, mapped to HomeCredit field names. */
const FEATURE_ALIASES: Record<string, string> = {
  requestedamount: 'amt_credit',
  requested_amount: 'amt_credit',
  loanamount: 'amt_credit',
  loan_amount: 'amt_credit',
  creditamount: 'amt_credit',
  credit_amount: 'amt_credit',
  amount: 'amt_credit',
  annualincome: 'amt_income_total',
  annual_income: 'amt_income_total',
  totalincome: 'amt_income_total',
  total_income: 'amt_income_total',
  income: 'amt_income_total',
  annuity: 'amt_annuity',
  monthlyemi: 'amt_annuity',
  monthly_emi: 'amt_annuity',
  emi: 'amt_annuity',
  goodsprice: 'amt_goods_price',
  goods_price: 'amt_goods_price',
  children: 'cnt_children',
  childcount: 'cnt_children',
  familymembers: 'cnt_fam_members',
  family_members: 'cnt_fam_members',
  employment: 'days_employed',
  dob: 'days_birth',
};

const DAYS_KEYS = new Set(['days_birth', 'days_employed']);

function baseUrl(): string {
  const raw = env.ML_SERVICE_URL || env.FASTAPI_URL || 'http://localhost:8000';
  return raw.replace(/\/+$/, '');
}

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

function toNumber(value: unknown): number | undefined {
  if (typeof value === 'number') return Number.isFinite(value) ? value : undefined;
  if (typeof value === 'string' && value.trim() !== '') {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : undefined;
  }
  return undefined;
}

function toStr(value: unknown): string | undefined {
  if (typeof value === 'string') return value;
  if (typeof value === 'number' || typeof value === 'boolean') return String(value);
  return undefined;
}

function round(value: number, decimals = 4): number {
  const factor = Math.pow(10, decimals);
  return Math.round(value * factor) / factor;
}

function flatKey(key: string): string {
  return key.toLowerCase().replace(/[^a-z0-9]/g, '');
}

function statusOf(error: unknown): number | undefined {
  if (axios.isAxiosError(error)) return (error as AxiosError).response?.status;
  return undefined;
}

function describeError(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const axiosError = error as AxiosError;
    const data = axiosError.response?.data as { detail?: unknown } | undefined;
    if (typeof data?.detail === 'string') return data.detail;
    if (data?.detail) return JSON.stringify(data.detail);
    if (axiosError.code === 'ECONNABORTED') return 'request timed out';
    return axiosError.message;
  }
  if (error instanceof Error) return error.message;
  return String(error);
}

function upstreamStatus(error: unknown): number | undefined {
  if (error instanceof AppError) {
    const details = error.details as { upstreamStatus?: number } | undefined;
    return details?.upstreamStatus;
  }
  return statusOf(error);
}

function isEndpointMissing(error: unknown): boolean {
  const code = upstreamStatus(error);
  return code === 404 || code === 405 || code === 501;
}

function toAppError(error: unknown, action: string): AppError {
  const code = statusOf(error);
  const detail = describeError(error);

  if (code === 404 || code === 405 || code === 501) {
    return new AppError(`FinGuard ${action} endpoint not found: ${detail}`, 502, { upstreamStatus: code });
  }
  if (code && code >= 400 && code < 500) {
    return new AppError(`FinGuard ${action} rejected the request: ${detail}`, 400, { upstreamStatus: code });
  }
  return new AppError(`FinGuard ${action} failed: ${detail}`, 502, { upstreamStatus: code });
}

type HttpMethod = 'get' | 'post';

/**
 * Try each candidate path in order. Legacy/duplicate FastAPI mount points are
 * tolerated (404/405/501) so the proxy keeps working on both
 * `/api/v1/finguard/*` and `/finguard/*` layouts.
 */
async function request<T>(
  method: HttpMethod,
  paths: string[],
  action: string,
  payload?: unknown,
  config: AxiosRequestConfig = {},
): Promise<{ data: T; path: string }> {
  let lastError: unknown;

  for (const path of paths) {
    const url = `${baseUrl()}${path}`;
    try {
      const response = await axios.request<T>({
        method,
        url,
        data: payload,
        timeout: FINGUARD_TIMEOUT_MS,
        ...config,
      });
      return { data: response.data, path };
    } catch (error) {
      lastError = error;
      const code = statusOf(error);
      logger.warn({ err: error, url, method, upstreamStatus: code }, 'FinGuard proxy request failed');
      // Only tolerate "route missing" style failures; real errors stop the chain.
      if (code !== undefined && !(code === 404 || code === 405 || code === 501)) break;
    }
  }

  throw toAppError(lastError, action);
}

/**
 * Accepts UPPER_CASE (`AMT_INCOME_TOTAL`) or lower_case (`amt_income_total`)
 * feature keys (plus common aliases) and always forwards lower_case HomeCredit
 * field names to FastAPI.
 */
export function normalizeFinguardInput(payload: FinguardPayload): Record<string, unknown> {
  const source: Record<string, unknown> = {};

  for (const [rawKey, rawValue] of Object.entries(payload ?? {})) {
    if (rawValue === undefined || rawValue === null || rawValue === '') continue;
    source[rawKey.trim().toLowerCase()] = rawValue;
  }

  // camelCase / spaced keys (e.g. `AMT_INCOME TOTAL`, `amtIncomeTotal`) -> flat match
  for (const [rawKey, rawValue] of Object.entries(source)) {
    const alias = FEATURE_ALIASES[rawKey] ?? FEATURE_ALIASES[flatKey(rawKey)];
    if (alias && source[alias] === undefined && rawValue !== undefined && rawValue !== null) {
      source[alias] = rawValue;
    }
  }

  const out: Record<string, unknown> = {};

  for (const key of NUMERIC_KEYS) {
    let value = toNumber(source[key]);

    if (value === undefined) {
      // Years-based inputs are converted to the negative-day convention FastAPI expects.
      if (key === 'days_birth') {
        const age = toNumber(source.age ?? source.age_years ?? source.ageyears);
        if (age !== undefined && age > 0) value = -Math.round(age * 365.25);
      }
      if (key === 'days_employed') {
        const years = toNumber(source.employment_years ?? source.experience_years ?? source.work_years);
        if (years !== undefined && years >= 0) value = -Math.round(years * 365.25);
      }
    }

    if (value === undefined) {
      // amt_income_total / amt_credit have no default and are validated at the end.
      value = NUMERIC_DEFAULTS[key];
    }

    if (value === undefined) continue;

    if (DAYS_KEYS.has(key)) {
      // Accept positive magnitudes and normalise to the negative-day convention.
      if (value > 0 && value < 20000) value = -value;
      value = Math.trunc(value);
    } else {
      value = round(value, 2);
    }

    out[key] = value;
  }

  for (const key of CATEGORICAL_KEYS) {
    const value = toStr(source[key]);
    if (value !== undefined) out[key] = value;
  }

  if (source.extra_features && typeof source.extra_features === 'object') {
    out.extra_features = source.extra_features;
  }

  const income = toNumber(out.amt_income_total);
  if (income === undefined || income <= 0) {
    throw new AppError('AMT_INCOME_TOTAL / amt_income_total is required and must be greater than 0', 400);
  }
  const credit = toNumber(out.amt_credit);
  if (credit === undefined || credit <= 0) {
    throw new AppError('AMT_CREDIT / amt_credit (or requestedAmount) is required and must be greater than 0', 400);
  }

  return out;
}

/** Normalise an upstream FinGuard payload into the spec envelope. */
export function toFinguardEnvelope(data: unknown, source: string): FinguardEnvelope {
  const raw = asRecord(data);
  const rawProbability = toNumber(raw.default_probability)
    ?? toNumber(raw.probability)
    ?? toNumber(raw.prediction)
    ?? 0;
  const probability = round(rawProbability, 6);
  const threshold = toNumber(raw.threshold) ?? SPEC_THRESHOLD;
  // Rule 6 mirror: 300 + 550 * (1 - probability), clamped to [300, 850].
  const riskScore = toNumber(raw.risk_score)
    ?? toNumber(raw.credit_score)
    ?? Math.max(300, Math.min(850, Math.round(300 + 550 * (1 - probability))));
  const predictionLabel = toStr(raw.prediction)
    ?? (rawProbability >= threshold ? 'REJECT' : 'APPROVE');
  const shap = asRecord(raw.shap_summary);
  const shapSummary: Record<string, number> = {};
  for (const [key, value] of Object.entries(shap)) {
    const num = toNumber(value);
    if (num !== undefined) shapSummary[key] = round(num, 6);
  }

  return {
    status: toStr(raw.status) ?? 'success',
    prediction: predictionLabel,
    prediction_score: probability,
    probability,
    risk_score: round(riskScore, 6),
    decision: toStr(raw.decision) ?? (predictionLabel === 'APPROVE' ? 'Approve' : 'Decline'),
    model_version: toStr(raw.model_version) ?? toStr(raw.modelVersion),
    credit_score: toNumber(raw.credit_score) ?? toNumber(raw.creditScore),
    risk_band: toStr(raw.risk_band) ?? toStr(raw.riskBand),
    threshold,
    spec_threshold: toNumber(raw.spec_threshold) ?? SPEC_THRESHOLD,
    shap_summary: Object.keys(shapSummary).length > 0 ? shapSummary : undefined,
    features_used: Array.isArray(raw.features_used) ? (raw.features_used as unknown[]).map((v) => String(v)) : undefined,
    timestamp: toStr(raw.timestamp),
    source,
    raw,
  };
}

function toFactors(shap: Record<string, number> | undefined, limit = 10): FinguardFactor[] {
  if (!shap) return [];
  return Object.entries(shap)
    .map(([feature, contribution]) => ({
      feature,
      contribution: round(contribution, 6),
      direction: (contribution >= 0 ? 'increase' : 'decrease') as 'increase' | 'decrease',
    }))
    .sort((a, b) => Math.abs(b.contribution) - Math.abs(a.contribution))
    .slice(0, limit);
}

async function mapWithConcurrency<T, R>(
  items: T[],
  limit: number,
  worker: (item: T, index: number) => Promise<R>,
): Promise<R[]> {
  const results: R[] = new Array(items.length);
  let cursor = 0;

  const runners = Array.from({ length: Math.min(limit, items.length) }, async () => {
    for (;;) {
      const index = cursor;
      cursor += 1;
      if (index >= items.length) return;
      results[index] = await worker(items[index], index);
    }
  });

  await Promise.all(runners);
  return results;
}

const DOC_TYPE_HINTS: Array<{ type: string; patterns: RegExp[] }> = [
  { type: 'SALARY_SLIP', patterns: [/salary\s*slip/i, /pay\s*slip/i, /payslip/i, /earnings\s*statement/i, /net\s*pay/i] },
  { type: 'BANK_STATEMENT', patterns: [/bank\s*statement/i, /account\s*statement/i, /a\/c\s*statement/i, /opening\s*balance/i, /closing\s*balance/i] },
  { type: 'INCOME_CERTIFICATE', patterns: [/income\s*certificate/i, /to\s*whom(?:ever)?\s*it\s*may\s*concern/i] },
  { type: 'BUSINESS', patterns: [/turnover/i, /gst\s*in/i, /business\s*income/i, /proprietor/i, /partnership/i] },
];

function localDocumentAnalysis(text: string, documentType?: string): DocumentAnalysisResult {
  const detected =
    documentType && documentType !== 'AUTO'
      ? documentType
      : DOC_TYPE_HINTS.find((hint) => hint.patterns.some((p) => p.test(text)))?.type ?? 'UNKNOWN';

  const grab = (patterns: RegExp[]): number | undefined => {
    for (const pattern of patterns) {
      const match = text.match(pattern);
      const value = toNumber(match?.[1]);
      if (value !== undefined) return value;
    }
    return undefined;
  };

  const annualIncome = grab([
    /(?:gross|annual|total|net)\s*(?:annual\s*)?(?:income|salary|earnings)\s*[:=]?\s*(?:inr|rs\.?|₹)?\s*([\d,]+(?:\.\d+)?)/i,
    /annual\s*(?:income|salary)\s*[:=]?\s*(?:inr|rs\.?|₹)?\s*([\d,]+(?:\.\d+)?)/i,
  ]);
  const monthlyIncome = grab([
    /monthly\s*(?:income|salary|net\s*pay|net\s*salary|wage)\s*[:=]?\s*(?:inr|rs\.?|₹)?\s*([\d,]+(?:\.\d+)?)/i,
  ]);
  const loanAmount = grab([
    /(?:loan|credit)\s*(?:amount|sanctioned|requested)\s*[:=]?\s*(?:inr|rs\.?|₹)?\s*([\d,]+(?:\.\d+)?)/i,
  ]);

  const features: Record<string, number> = {};
  const annual = annualIncome ?? (monthlyIncome !== undefined ? monthlyIncome * 12 : undefined);
  if (annual !== undefined && annual > 0) features.amt_income_total = round(annual, 2);
  if (loanAmount !== undefined && loanAmount > 0) features.amt_credit = round(loanAmount, 2);

  const lineCount = text.split(/\r?\n/).filter((l) => l.trim().length > 0).length;
  const summary = `Detected ${detected} document with ${lineCount} non-empty lines`
    + (annual !== undefined ? ` and annual income around ${annual}` : '')
    + (loanAmount !== undefined ? `; referenced loan amount ${loanAmount}` : '')
    + '. FastAPI document analysis is unavailable, so only local extraction was applied.';

  return {
    status: 'degraded',
    source: 'local_fallback',
    intent: detected === 'UNKNOWN' ? 'UNRECOGNIZED' : 'INCOME_ANALYSIS',
    confidence: detected === 'UNKNOWN' ? 0.2 : 0.5,
    document_type: detected,
    summary,
    answer: summary,
    extracted_entities: {
      document_type: detected,
      annual_income: annualIncome ?? null,
      monthly_income: monthlyIncome ?? null,
      loan_amount: loanAmount ?? null,
      line_count: lineCount,
    },
    data_keys: ['document_type', 'annual_income', 'monthly_income', 'loan_amount', 'line_count'],
    visualization: {},
    char_count: text.length,
    finguard_features: Object.keys(features).length > 0 ? features : undefined,
    raw: { note: 'FastAPI document analysis unavailable; used local extraction' },
  };
}

export const finguardProxyService = {
  /**
   * Backward-compatible best-effort call used by loanService.
   * Never throws: returns null so callers can fall back to heuristics.
   */
  async evaluate(input: FinguardInput): Promise<FinguardResult | null> {
    const url = `${baseUrl()}/api/v1/finguard/predict`;
    try {
      const { data } = await axios.post<FinguardResult>(url, {
        amt_income_total: input.amt_income_total,
        amt_credit: input.amt_credit,
        amt_annuity: input.amt_annuity ?? 0,
        amt_goods_price: input.amt_goods_price ?? 0,
        days_birth: input.days_birth,
        days_employed: input.days_employed,
        cnt_children: input.cnt_children ?? 0,
        cnt_fam_members: input.cnt_fam_members ?? 1,
        occupation_type: input.occupation_type,
        organization_type: input.organization_type,
      }, { timeout: FINGUARD_TIMEOUT_MS });
      return data;
    } catch (e) {
      logger.warn({ err: e, url }, 'FinGuard proxy failed, fallback to heuristic');
      return null;
    }
  },

  /** POST /api/v1/finguard/predict (falls back to /finguard/predict). */
  async predict(payload: FinguardPayload): Promise<FinguardEnvelope> {
    const features = normalizeFinguardInput(payload);
    const { data, path } = await request<unknown>(
      'post',
      ['/api/v1/finguard/predict', '/finguard/predict'],
      'prediction',
      features,
    );
    return toFinguardEnvelope(data, path);
  },

  /** POST /api/v1/finguard/batch, with a per-item predict fallback. */
  async batch(items: FinguardPayload[]): Promise<FinguardBatchResult> {
    if (!Array.isArray(items) || items.length === 0) {
      throw new AppError('items must be a non-empty array', 400);
    }
    if (items.length > 100) {
      throw new AppError('Batch size is limited to 100 items', 400);
    }

    const normalized = items.map((item) => normalizeFinguardInput(item));

    try {
      const { data, path } = await request<unknown>(
        'post',
        ['/api/v1/finguard/batch', '/finguard/batch'],
        'batch prediction',
        { items: normalized, stop_on_error: false },
      );
      const record = asRecord(data);
      const list = Array.isArray(data)
        ? data
        : Array.isArray(record.results)
          ? record.results
          : Array.isArray(record.predictions)
            ? record.predictions
            : undefined;

      if (list) {
        const errors = Array.isArray(record.errors) ? record.errors as FinguardBatchResult['errors'] : [];
        return {
          status: errors.length > 0 ? 'degraded' : 'ok',
          count: toNumber(record.count) ?? list.length,
          source: path,
          results: list.map((item, index) => ({
            index,
            ok: true,
            prediction: toFinguardEnvelope(item, path),
          })),
          errors,
        };
      }

      logger.warn({ path }, 'FinGuard batch response shape not recognised, falling back to per-item predict');
    } catch (error) {
      if (!isEndpointMissing(error)) throw error;
      logger.warn({ err: error }, 'FinGuard batch endpoint unavailable, falling back to per-item predict');
    }

    const results = await mapWithConcurrency(normalized, 5, async (item, index) => {
      try {
        return { index, ok: true, prediction: await this.predict(item) };
      } catch (error) {
        return { index, ok: false, error: describeError(error) };
      }
    });

    return {
      status: results.some((r) => r.ok) ? 'degraded' : 'error',
      count: items.length,
      source: 'per_item_predict',
      results,
      errors: results.filter((r) => !r.ok).map((r) => ({ index: r.index, error: r.error, status: 'error' })),
    };
  },

  /** POST /api/v1/finguard/explain; derives SHAP factors locally when unavailable. */
  async explain(payload: FinguardPayload): Promise<FinguardExplainResult> {
    const features = normalizeFinguardInput(payload);

    try {
      const { data, path } = await request<unknown>(
        'post',
        ['/api/v1/finguard/explain', '/finguard/explain'],
        'explain',
        features,
      );
      const envelope = toFinguardEnvelope(data, path);
      return {
        status: envelope.status,
        source: 'explain_endpoint',
        prediction: envelope.prediction,
        probability: envelope.probability,
        risk_score: envelope.risk_score,
        threshold: envelope.threshold,
        spec_threshold: envelope.spec_threshold,
        decision: envelope.decision,
        base_value: toNumber(asRecord(data).base_value),
        summary: buildSummary(envelope),
        factors: readFactors(data, envelope),
        raw: envelope.raw,
      };
    } catch (error) {
      if (!isEndpointMissing(error)) throw error;
      logger.warn({ err: error }, 'FinGuard explain endpoint unavailable, deriving from predict + SHAP');
    }

    const envelope = await this.predict(features);
    return {
      status: envelope.status,
      source: 'derived_from_predict',
      prediction: envelope.prediction,
      probability: envelope.probability,
      risk_score: envelope.risk_score,
      threshold: envelope.threshold,
      spec_threshold: envelope.spec_threshold,
      decision: envelope.decision,
      summary: buildSummary(envelope),
      factors: readFactors(envelope.raw, envelope),
      raw: envelope.raw,
    };
  },

  /** GET /api/v1/finguard/schema (falls back to /finguard/schema then /model-info). */
  async getSchema(): Promise<FinguardSchemaResult> {
    const { data, path } = await request<unknown>(
      'get',
      ['/api/v1/finguard/schema', '/finguard/schema', '/api/v1/finguard/model-info'],
      'schema',
    );
    const raw = asRecord(data);

    return {
      status: toStr(raw.status) ?? 'success',
      source: path,
      model_version: toStr(raw.model_version) ?? toStr(raw.modelVersion),
      total_features: toNumber(raw.total_features),
      order_length: toNumber(raw.order_length),
      threshold: toNumber(raw.threshold) ?? toNumber(raw.decision_threshold),
      spec_threshold: toNumber(raw.spec_threshold) ?? SPEC_THRESHOLD,
      categorical_mappings: asRecord(raw.categorical_mappings) as Record<string, unknown> | undefined,
      feature_schema: asRecord(raw.feature_schema) as Record<string, unknown> | undefined,
      required_features: [...REQUIRED_FEATURES],
      optional_features: [...OPTIONAL_FEATURES],
      feature_aliases: FEATURE_ALIASES,
      raw,
    };
  },

  /** Never throws: reports upstream availability as data. */
  async checkHealth(): Promise<FinguardHealthResult> {
    const started = Date.now();
    const base = baseUrl();
    try {
      const { data, path } = await request<unknown>(
        'get',
        ['/api/v1/finguard/health', '/finguard/health', '/health'],
        'health',
        undefined,
      );
      const raw = asRecord(data);
      const status = toStr(raw.status) ?? 'ok';
      return {
        status,
        ok: status === 'healthy' || status === 'ok' || raw.ready === true,
        ready: raw.ready === true || status === 'healthy' || status === 'ok',
        baseUrl: base,
        latencyMs: Date.now() - started,
        model: toStr(raw.model) ?? toStr(raw.model_version) ?? toStr(raw.modelVersion),
        raw: { ...raw, path },
      };
    } catch (error) {
      logger.warn({ err: error, baseUrl: base }, 'FinGuard health check failed');
      return {
        status: 'unavailable',
        ok: false,
        ready: false,
        baseUrl: base,
        latencyMs: Date.now() - started,
        error: describeError(error),
      };
    }
  },

  /** POST /api/v1/nlu/chat (natural-language financial query). */
  async chatNlu(message: string, userId?: string, sessionId = 'default'): Promise<FinguardNluResult> {
    if (!message || typeof message !== 'string' || message.trim().length === 0) {
      throw new AppError('message is required', 400);
    }

    const { data, path } = await request<unknown>(
      'post',
      ['/api/v1/nlu/chat', '/nlu/chat', '/api/v1/nlu/ask', '/nlu/ask'],
      'NLU chat',
      { user_id: userId || null, message, session_id: sessionId },
    );
    const raw = asRecord(data);

    return {
      status: 'success',
      source: path,
      intent: toStr(raw.intent) ?? 'UNRECOGNIZED',
      answer: toStr(raw.answer) ?? '',
      confidence: toNumber(raw.confidence) ?? 0,
      extracted_entities: asRecord(raw.extracted_entities),
      raw,
    };
  },

  /** POST /api/v1/nlu/document/analyze, with local extraction when upstream is absent. */
  async analyzeDocument(text: string, documentType?: string): Promise<DocumentAnalysisResult> {
    if (!text || typeof text !== 'string' || text.trim().length === 0) {
      throw new AppError('text is required', 400);
    }

    try {
      const { data, path } = await request<unknown>(
        'post',
        ['/api/v1/nlu/document/analyze', '/nlu/document/analyze', '/api/v1/document/analyze', '/document/analyze'],
        'document analysis',
        { text, document_type: documentType ?? null },
      );
      const raw = asRecord(data);
      return {
        status: toStr(raw.status) ?? 'success',
        source: path,
        intent: toStr(raw.intent) ?? 'UNRECOGNIZED',
        confidence: toNumber(raw.confidence) ?? 0,
        document_type: documentType ?? 'UNKNOWN',
        summary: toStr(raw.summary) ?? '',
        answer: toStr(raw.answer) ?? '',
        extracted_entities: asRecord(raw.extracted_entities),
        chart_type: toStr(raw.chart_type),
        data_keys: Array.isArray(raw.data_keys) ? (raw.data_keys as unknown[]).map((v) => String(v)) : [],
        visualization: asRecord(raw.visualization),
        char_count: toNumber(raw.char_count) ?? text.length,
        finguard_features: asRecord(raw.finguard_features ?? raw.features) as Record<string, number> | undefined,
        raw,
      };
    } catch (error) {
      if (!isEndpointMissing(error)) throw error;
      logger.warn({ err: error }, 'FinGuard document analysis unavailable, using local extraction');
      return localDocumentAnalysis(text, documentType);
    }
  },
};

/**
 * Signed SHAP factors. Prefers the explain endpoint's `shap_values` list and
 * falls back to the absolute `shap_summary` map returned by /predict.
 */
function readFactors(data: unknown, envelope: FinguardEnvelope): FinguardFactor[] {
  const raw = asRecord(data);
  const list = raw.shap_values;
  if (Array.isArray(list) && list.length > 0) {
    const factors: FinguardFactor[] = [];
    for (const entry of list) {
      const item = asRecord(entry);
      const feature = toStr(item.feature) ?? toStr(item.name);
      const value = toNumber(item.shap_value) ?? toNumber(item.value) ?? toNumber(item.contribution);
      if (feature === undefined || value === undefined) continue;
      factors.push({
        feature,
        contribution: round(value, 6),
        direction: value >= 0 ? 'increase' : 'decrease',
      });
    }
    if (factors.length > 0) return factors;
  }
  return toFactors(envelope.shap_summary);
}

function buildSummary(envelope: FinguardEnvelope, factors: FinguardFactor[] = []): string {
  const band = envelope.risk_band ?? 'unknown';
  const head = `FinGuard predicts a default probability of ${(envelope.probability * 100).toFixed(2)}% `
    + `(${envelope.prediction}/${envelope.decision}, risk score ${envelope.risk_score}, risk band ${band}).`;
  if (factors.length === 0) return head;
  const top = factors.slice(0, 3).map((f) => `${f.feature} (${f.contribution > 0 ? '+' : ''}${f.contribution})`).join(', ');
  return `${head} Top drivers: ${top}.`;
}
