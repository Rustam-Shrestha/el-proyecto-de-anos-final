import type { Request, Response, NextFunction } from 'express';
import { loanAssessmentService } from '@/services/loanAssessmentService';
import { finguardProxyService } from '@/services/finguardProxyService';
import type { FinguardEnvelope, FinguardPayload } from '@/services/finguardProxyService';
import { auditService } from '@/services/auditService';
import { apiResponse } from '@/utils/apiResponse';
import { AppError } from '@/utils/AppError';

export const assessLoan = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const user = req.user;
    if (!user) {
      res.status(401).json(apiResponse.error('Authentication required', 401));
      return;
    }

    const { requestedAmount, loanTenureMonths = 24, interestRateAssumed = 10.5 } = req.body;

    const result = await loanAssessmentService.assess(
      user.id,
      Number(requestedAmount),
      Number(loanTenureMonths),
      Number(interestRateAssumed),
    );

    await auditService.log({
      userId: user.id,
      action: 'LOAN_ASSESSMENT',
      metadata: {
        assessmentId: result.id,
        requestedAmount,
        riskLevel: result.riskLevel,
        eligibilityScore: result.eligibilityScore,
      },
      ip: req.ip || undefined,
      userAgent: req.headers['user-agent'],
    });

    res.status(201).json(apiResponse.success('Loan assessment completed', result));
  } catch (error) {
    next(error);
  }
};

export const getLoanAssessmentHistory = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const user = req.user;
    if (!user) {
      res.status(401).json(apiResponse.error('Authentication required', 401));
      return;
    }

    const history = await loanAssessmentService.getHistory(user.id);
    res.json(apiResponse.success('Loan assessment history retrieved', history));
  } catch (error) {
    next(error);
  }
};

/* ─────────────────── FinGuard (FastAPI) proxy endpoints ─────────────────── */

type LoanRiskLevel = 'LOW' | 'MEDIUM' | 'HIGH';

function requestBody(req: Request): FinguardPayload {
  const validated = req.validated as { body?: unknown } | undefined;
  const source = (validated?.body ?? req.body ?? {}) as FinguardPayload;
  return source && typeof source === 'object' ? source : {};
}

function numberFrom(source: FinguardPayload, keys: string[]): number | undefined {
  for (const key of keys) {
    const raw = source[key] ?? source[key.toLowerCase()];
    if (typeof raw === 'number' && Number.isFinite(raw)) return raw;
    if (typeof raw === 'string' && raw.trim() !== '') {
      const parsed = Number(raw);
      if (Number.isFinite(parsed)) return parsed;
    }
  }
  return undefined;
}

function round(value: number, decimals = 2): number {
  const factor = Math.pow(10, decimals);
  return Math.round(value * factor) / factor;
}

function riskLevelFrom(envelope: FinguardEnvelope): LoanRiskLevel {
  const band = (envelope.risk_band ?? '').toUpperCase();
  if (band === 'LOW') return 'LOW';
  if (band === 'HIGH') return 'HIGH';
  if (band === 'MEDIUM' || band === 'MODERATE') return 'MEDIUM';
  if (envelope.probability < 0.2) return 'LOW';
  if (envelope.probability <= 0.5) return 'MEDIUM';
  return 'HIGH';
}

function mapEnvelopeToLoan(
  envelope: FinguardEnvelope,
  requestedAmount: number,
  loanTenureMonths: number,
  interestRateAssumed: number,
) {
  const riskLevel = riskLevelFrom(envelope);
  const baseMultiplier = riskLevel === 'LOW' ? 1 : riskLevel === 'MEDIUM' ? 0.7 : 0.4;
  const probabilityFactor = 1 - Math.min(Math.max(envelope.probability, 0), 0.9);
  const eligibleAmount = round(requestedAmount * baseMultiplier * probabilityFactor);
  const eligibilityScore = round(Math.max(0, 100 - envelope.probability * 100) * (riskLevel === 'LOW' ? 1 : 0.8));

  const monthlyRate = (interestRateAssumed / 100) / 12;
  const growth = Math.pow(1 + monthlyRate, loanTenureMonths);
  const monthlyEmi = growth !== 1
    ? round((requestedAmount * monthlyRate * growth) / (growth - 1))
    : round(requestedAmount / loanTenureMonths);
  const maxMonthlyEmi = round(Math.max(0, eligibleAmount * monthlyRate));

  return {
    requestedAmount,
    eligibleAmount,
    riskLevel,
    eligibilityScore,
    defaultProbability: envelope.probability,
    riskScore: envelope.risk_score,
    creditScore: envelope.credit_score ?? envelope.risk_score,
    prediction: envelope.prediction,
    decision: envelope.decision,
    modelVersion: envelope.model_version ?? null,
    monthlyEmi,
    maxMonthlyEmi,
    recommendedTenure: riskLevel === 'HIGH' ? 60 : riskLevel === 'MEDIUM' ? 36 : 24,
    loanTenureMonths,
    interestRateAssumed,
    recommendation: loanAssessmentService.generateRecommendation({
      riskLevel, eligibleAmount, eligibilityScore, maxMonthlyEmi, monthlyEmi,
    }),
    topFactors: Object.entries(envelope.shap_summary ?? {})
      .map(([feature, contribution]) => ({ feature, contribution, direction: contribution >= 0 ? 'increase' : 'decrease' }))
      .sort((a, b) => Math.abs(b.contribution) - Math.abs(a.contribution))
      .slice(0, 10),
  };
}

/**
 * POST /loan-assessment/finguard/predict and POST /loans/predict
 * Body accepts HomeCredit features in UPPER_CASE or lower_case.
 * `requestedAmount` is mapped to AMT_CREDIT when AMT_CREDIT is not supplied.
 */
export const assessWithFinguard = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const user = req.user;
    const body = requestBody(req);
    const requestedAmount = numberFrom(body, ['requestedAmount', 'AMT_CREDIT', 'amt_credit']) ?? 0;
    const loanTenureMonths = numberFrom(body, ['loanTenureMonths', 'tenureMonths', 'TENURE_MONTHS']) ?? 24;
    const interestRateAssumed = numberFrom(body, ['interestRateAssumed', 'interestRate', 'INTEREST_RATE']) ?? 10.5;

    let features: FinguardPayload = { ...body };
    // Best-effort enrichment from the stored financial profile when income is absent.
    if (numberFrom(features, ['amt_income_total', 'AMT_INCOME_TOTAL']) === undefined && user) {
      const derived = await loanAssessmentService.buildFinguardFeatures(user.id, requestedAmount);
      features = { ...derived, ...features };
    }

    const envelope = await finguardProxyService.predict(features);
    const result = mapEnvelopeToLoan(envelope, requestedAmount, loanTenureMonths, interestRateAssumed);

    if (user) {
      await auditService.log({
        userId: user.id,
        action: 'FINGUARD_PREDICTION',
        metadata: {
          requestedAmount,
          riskLevel: result.riskLevel,
          defaultProbability: result.defaultProbability,
          modelVersion: result.modelVersion,
        },
        ip: req.ip || undefined,
        userAgent: req.headers['user-agent'],
      }).catch(() => undefined);
    }

    res.json(apiResponse.success('FinGuard loan prediction completed', { ...result, raw: envelope.raw }));
  } catch (error) {
    next(error);
  }
};

/** POST /loan-assessment/finguard/batch */
export const finguardBatch = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const body = requestBody(req);
    const items = (body.items ?? body.predictions ?? body.data) as FinguardPayload[] | undefined;
    if (!Array.isArray(items)) {
      throw new AppError('items must be an array of FinGuard feature objects', 400);
    }

    const result = await finguardProxyService.batch(items);
    res.json(apiResponse.success('FinGuard batch prediction completed', result));
  } catch (error) {
    next(error);
  }
};

/** POST /loan-assessment/finguard/explain */
export const finguardExplain = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const result = await finguardProxyService.explain(requestBody(req));
    res.json(apiResponse.success('FinGuard explanation generated', result));
  } catch (error) {
    next(error);
  }
};

/** GET /loan-assessment/finguard/schema */
export const getFinguardSchema = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const result = await finguardProxyService.getSchema();
    res.json(apiResponse.success('FinGuard schema retrieved', result));
  } catch (error) {
    next(error);
  }
};

/** GET /loan-assessment/finguard/health */
export const finguardHealth = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const result = await finguardProxyService.checkHealth();
    res.json(apiResponse.success('FinGuard health retrieved', result));
  } catch (error) {
    next(error);
  }
};

/** POST /loan-assessment/nlu/chat */
export const nluChat = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const body = requestBody(req);
    const message = (body.message ?? body.query ?? body.text) as string | undefined;
    const userId = (body.user_id ?? body.userId ?? req.user?.id ?? 'anonymous') as string;
    const sessionId = (body.session_id ?? body.sessionId ?? `session_${userId}`) as string;

    const result = await finguardProxyService.chatNlu(String(message ?? ''), userId, sessionId);
    res.json(apiResponse.success('FinGuard NLU query processed', { ...result, sessionId }));
  } catch (error) {
    next(error);
  }
};

/** POST /loan-assessment/document/analyze */
export const documentAnalyze = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const body = requestBody(req);
    const text = (body.text ?? body.content ?? body.document_text ?? '') as string;
    const documentType = (body.document_type ?? body.documentType) as string | undefined;

    const result = await finguardProxyService.analyzeDocument(String(text ?? ''), documentType);
    res.json(apiResponse.success('Document analysis completed', result));
  } catch (error) {
    next(error);
  }
};
