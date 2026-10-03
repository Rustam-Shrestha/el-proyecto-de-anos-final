import { Router } from 'express';
import { authenticate } from '@/middleware/auth';
import { validate } from '@/middleware/requestValidation';
import { z } from 'zod';
import {
  assessLoan,
  getLoanAssessmentHistory,
} from '@/controllers/loanAssessmentController';

const loanAssessmentRouter = Router();

export const assessLoanSchema = z.object({
  body: z.object({
    requestedAmount: z.number().positive().max(10000000),
    loanTenureMonths: z.number().int().min(6).max(84).optional(),
    interestRateAssumed: z.number().min(1).max(30).optional(),
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

export default loanAssessmentRouter;
