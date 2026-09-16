import { Router } from 'express';
import { authenticate } from '@/middleware/auth';
import { authorize } from '@/middleware/rbac';
import { validate } from '@/middleware/requestValidation';

const requirePermission = (_perm: string) => {
  return authorize('ADMIN', 'REVIEWER', 'USER');
};
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
import { creditScoringService } from '@/services/ml/creditScoringService';

const loanRouter = Router();

// tenant-scoped ML scoring endpoint (prompt spec)
loanRouter.post(
  '/apply-with-ml',
  authenticate,
  requirePermission('loans.write'),
  async (req, res, next) => {
    try {
      const tenantId = (req as unknown as { tenantId?: number }).tenantId ?? 1;
      const userId = req.user!.id;
      const loan = await creditScoringService.createScoredLoanApplication(req, tenantId, userId, req.body);
      res.json({ success: true, data: loan });
    } catch (e) { next(e); }
  }
);

loanRouter.post(
  '/calculate-risk',
  authenticate,
  requirePermission('loans.read'),
  validate(calculateRiskSchema),
  calculateRiskScore
);

loanRouter.post(
  '/apply',
  authenticate,
  requirePermission('loans.write'),
  validate(loanApplicationSchema),
  applyForLoan
);

loanRouter.get(
  '/',
  authenticate,
  requirePermission('loans.read'),
  validate(listLoansSchema),
  listLoans
);

loanRouter.get(
  '/:id',
  authenticate,
  requirePermission('loans.read'),
  validate(getLoanSchema),
  getLoan
);

loanRouter.patch(
  '/:id/review',
  authenticate,
  requirePermission('loans.approve'),
  validate(loanReviewSchema),
  reviewLoan
);

export default loanRouter;
