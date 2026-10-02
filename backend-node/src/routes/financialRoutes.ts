import { Router } from 'express';
import { authenticate } from '@/middleware/auth';
import {
  getProfile,
  recalculateProfile,
  getMonthlyTrends,
  getCategoryBreakdown,
} from '@/controllers/financialController';

const financialRouter = Router();

financialRouter.get(
  '/profile',
  authenticate,
  getProfile,
);

financialRouter.post(
  '/recalculate',
  authenticate,
  recalculateProfile,
);

financialRouter.get(
  '/trends',
  authenticate,
  getMonthlyTrends,
);

financialRouter.get(
  '/categories',
  authenticate,
  getCategoryBreakdown,
);

export default financialRouter;
