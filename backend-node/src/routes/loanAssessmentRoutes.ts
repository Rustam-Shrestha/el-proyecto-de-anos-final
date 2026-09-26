import { Router } from 'express';
import { authenticate, optionalAuthenticate } from '@/middleware/auth';
import { validate } from '@/middleware/requestValidation';
import { z } from 'zod';
import {
  assessLoan,
  getLoanAssessmentHistory,
  assessWithFinguard,
  finguardBatch,
  finguardExplain,
  getFinguardSchema,
  finguardHealth,
  nluChat,
  documentAnalyze,
} from '@/controllers/loanAssessmentController';

const loanAssessmentRouter = Router();

export const assessLoanSchema = z.object({
  body: z.object({
    requestedAmount: z.number().positive().max(10000000),
    loanTenureMonths: z.number().int().min(6).max(84).optional(),
    interestRateAssumed: z.number().min(1).max(30).optional(),
  }),
});

const numberish = z.union([z.number(), z.string().regex(/^-?\d+(\.\d+)?$/)]);

/**
 * FinGuard features may arrive in UPPER_CASE (AMT_INCOME_TOTAL) or lower_case
 * (amt_income_total); the proxy service normalises both to lower_case.
 */
const finguardFeatureFields = {
  AMT_INCOME_TOTAL: numberish.optional(),
  amt_income_total: numberish.optional(),
  AMT_CREDIT: numberish.optional(),
  amt_credit: numberish.optional(),
  AMT_ANNUITY: numberish.optional(),
  amt_annuity: numberish.optional(),
  AMT_GOODS_PRICE: numberish.optional(),
  amt_goods_price: numberish.optional(),
  DAYS_BIRTH: numberish.optional(),
  days_birth: numberish.optional(),
  DAYS_EMPLOYED: numberish.optional(),
  days_employed: numberish.optional(),
  CNT_CHILDREN: numberish.optional(),
  cnt_children: numberish.optional(),
  CNT_FAM_MEMBERS: numberish.optional(),
  cnt_fam_members: numberish.optional(),
  OCCUPATION_TYPE: z.string().optional(),
  occupation_type: z.string().optional(),
  ORGANIZATION_TYPE: z.string().optional(),
  organization_type: z.string().optional(),
  requestedAmount: numberish.optional(),
  loanTenureMonths: z.coerce.number().int().min(1).max(120).optional(),
  interestRateAssumed: z.coerce.number().min(0).max(30).optional(),
};

export const finguardPredictSchema = z.looseObject({
  body: z.looseObject(finguardFeatureFields),
});

export const finguardBatchSchema = z.looseObject({
  body: z.looseObject({
    items: z.array(z.looseObject(finguardFeatureFields)).min(1).max(100),
  }),
});

export const finguardExplainSchema = finguardPredictSchema;

export const nluChatSchema = z.looseObject({
  body: z.looseObject({
    message: z.string().min(1).max(2000),
    user_id: z.string().max(128).optional(),
    userId: z.string().max(128).optional(),
    session_id: z.string().max(128).optional(),
    sessionId: z.string().max(128).optional(),
  }),
});

export const documentAnalyzeSchema = z.looseObject({
  body: z.looseObject({
    text: z.string().min(1).max(200000),
    content: z.string().min(1).max(200000).optional(),
    document_text: z.string().min(1).max(200000).optional(),
    document_type: z.string().max(64).optional(),
    documentType: z.string().max(64).optional(),
  }),
});

loanAssessmentRouter.post(
  '/assess',
  authenticate,
  validate(assessLoanSchema),
  assessLoan,
);

loanAssessmentRouter.get(
  '/history',
  authenticate,
  getLoanAssessmentHistory,
);

// ── FinGuard (FastAPI) proxy ──
loanAssessmentRouter.post(
  '/finguard/predict',
  authenticate,
  validate(finguardPredictSchema),
  assessWithFinguard,
);

loanAssessmentRouter.post(
  '/finguard/batch',
  authenticate,
  validate(finguardBatchSchema),
  finguardBatch,
);

loanAssessmentRouter.post(
  '/finguard/explain',
  authenticate,
  validate(finguardExplainSchema),
  finguardExplain,
);

loanAssessmentRouter.get(
  '/finguard/schema',
  authenticate,
  getFinguardSchema,
);

loanAssessmentRouter.get(
  '/finguard/health',
  optionalAuthenticate,
  finguardHealth,
);

// ── NLU + document analysis (public-friendly) ──
loanAssessmentRouter.post(
  '/nlu/chat',
  optionalAuthenticate,
  validate(nluChatSchema),
  nluChat,
);

loanAssessmentRouter.post(
  '/document/analyze',
  optionalAuthenticate,
  validate(documentAnalyzeSchema),
  documentAnalyze,
);

export default loanAssessmentRouter;
