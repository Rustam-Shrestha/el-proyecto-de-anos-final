import { Router } from 'express';
import { authenticate } from '@/middleware/auth';
import { authorize } from '@/middleware/rbac';
import { validate } from '@/middleware/requestValidation';
import {
  loanApplicationSchema,
  listLoansSchema,
  getLoanSchema,
  loanReviewSchema,
} from '@/routes/loanSchemas';
import {
  applyForLoan,
  getLoan,
  listLoans,
  reviewLoan,
} from '@/controllers/loanController';

const loanRouter = Router();

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
