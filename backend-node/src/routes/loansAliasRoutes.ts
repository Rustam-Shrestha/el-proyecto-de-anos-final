import { Router } from 'express';
import { authenticate } from '@/middleware/auth';
import { validate } from '@/middleware/requestValidation';
import {
  assessLoanSchema,
  finguardPredictSchema,
} from '@/routes/loanAssessmentRoutes';
import {
  assessLoan,
  getLoanAssessmentHistory,
  assessWithFinguard,
} from '@/controllers/loanAssessmentController';

/**
 * Spec alias router mounted at /api/v1/loans.
 * Reuses the exact same controllers and validation as /api/v1/loan-assessment.
 */
const loansAliasRouter = Router();

// POST /api/v1/loans/assess  -> heuristic loan assessment
loansAliasRouter.post(
  '/assess',
  authenticate,
  validate(assessLoanSchema),
  assessLoan,
);

// POST /api/v1/loans/predict -> FinGuard ML prediction
loansAliasRouter.post(
  '/predict',
  authenticate,
  validate(finguardPredictSchema),
  assessWithFinguard,
);

// GET /api/v1/loans/history  -> assessment history
loansAliasRouter.get(
  '/history',
  authenticate,
  getLoanAssessmentHistory,
);

export default loansAliasRouter;
