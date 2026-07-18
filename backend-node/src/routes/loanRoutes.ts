import { Router } from 'express';
import { authenticate } from '@/middleware/auth';
import { authorize } from '@/middleware/rbac';
import { validate } from '@/middleware/requestValidation';
import {
  loanApplicationSchema,
  listLoansSchema,
  getLoanSchema,
  loanReviewSchema,
  calculateRiskSchema,
} from '@/routes/loanSchemas';
import {
  applyForLoan,
  getLoan,
  listLoans,
  reviewLoan,
} from '@/controllers/loanController';
import { calculateRiskScore } from '@/controllers/riskScoringController';

const loanRouter = Router();

loanRouter.post(
  '/calculate-risk',
  authenticate,
  validate(calculateRiskSchema),
  calculateRiskScore
);

loanRouter.post(
  '/apply',
  authenticate,
  validate(loanApplicationSchema),
  applyForLoan
);

loanRouter.get(
  '/',
  authenticate,
  validate(listLoansSchema),
  listLoans
);

loanRouter.get(
  '/:id',
  authenticate,
  validate(getLoanSchema),
  getLoan
);

loanRouter.patch(
  '/:id/review',
  authenticate,
  authorize('ADMIN', 'REVIEWER'),
  validate(loanReviewSchema),
  reviewLoan
);

export default loanRouter;
