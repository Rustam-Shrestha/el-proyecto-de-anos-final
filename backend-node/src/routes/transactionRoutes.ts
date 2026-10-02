import { Router } from 'express';
import { authenticate } from '@/middleware/auth';
import { validate } from '@/middleware/requestValidation';
import { z } from 'zod';
import {
  listTransactions,
  getTransaction,
  updateTransaction,
} from '@/controllers/transactionController';

const transactionRouter = Router();

export const transactionIdSchema = z.object({
  params: z.object({ id: z.string() }),
});

export const updateTransactionSchema = z.object({
  params: z.object({ id: z.string() }),
  body: z.object({
    category: z.enum(['INCOME', 'EXPENSE', 'SAVINGS', 'INVESTMENT', 'UNKNOWN']).optional(),
    transactionType: z.string().optional(),
    description: z.string().optional(),
  }),
});

transactionRouter.get(
  '/',
  authenticate,
  listTransactions,
);

transactionRouter.get(
  '/:id',
  authenticate,
  validate(transactionIdSchema),
  getTransaction,
);

transactionRouter.patch(
  '/:id',
  authenticate,
  validate(updateTransactionSchema),
  updateTransaction,
);

export default transactionRouter;
