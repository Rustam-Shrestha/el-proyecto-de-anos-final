import { z } from 'zod';

const tenureValues = [6, 12, 18, 24, 36, 48, 60] as const;

export const loanApplicationSchema = z.object({
  body: z.object({
    requestedAmount: z.number().min(10000).max(2000000),
    tenureMonths: z.number().refine((v) => (tenureValues as readonly number[]).includes(v), {
      message: 'Tenure must be one of: 6, 12, 18, 24, 36, 48, 60',
    }),
    purpose: z.enum(['HOME', 'EDUCATION', 'BUSINESS', 'PERSONAL']),
  }),
});

export const listLoansSchema = z.object({
  query: z.object({
    page: z.string().transform(Number).optional(),
    limit: z.string().transform(Number).optional(),
    status: z.enum(['SUBMITTED', 'UNDER_REVIEW', 'APPROVED', 'REJECTED']).optional(),
    userId: z.string().optional(),
  }),
});

export const getLoanSchema = z.object({
  params: z.object({
    id: z.string(),
  }),
});

export const calculateRiskSchema = z.object({
  body: z.object({
    requestedLoanAmount: z.number().positive().max(10000000),
    loanTenureMonths: z.number().int().min(6).max(84)
  }),
});

export const loanReviewSchema = z.object({
  params: z.object({
    id: z.string(),
  }),
  body: z.object({
    action: z.enum(['APPROVED', 'REJECTED']),
    notes: z.string().optional(),
  }).refine(
    (data) => {
      if (data.action === 'REJECTED' && (!data.notes || data.notes.trim().length === 0)) {
        return false;
      }
      return true;
    },
    { message: 'Notes are required when rejecting a loan application' }
  ),
});
