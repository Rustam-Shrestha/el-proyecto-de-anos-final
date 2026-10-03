import { z } from 'zod';

export const uploadFinancialDocumentSchema = z.object({
  body: z.object({
    documentType: z.enum([
      'SALARY_SLIP', 'BANK_STATEMENT', 'BUSINESS_REG', 'INCOME_CERT',
      'PAN', 'PENSION_LETTER', 'OTHER',
    ]),
  }),
});

export const deleteFinancialDocumentSchema = z.object({
  params: z.object({
    id: z.string(),
  }),
});

export const verifyFinancialDocumentSchema = z.object({
  params: z.object({
    id: z.string(),
  }),
  body: z.object({
    verificationStatus: z.enum(['VERIFIED', 'REJECTED', 'FLAGGED_REVIEW', 'REQUEST_RESUBMISSION']),
    adminNotes: z.string().optional(),
  }),
});

export const verifyPortfolioSchema = z.object({
  params: z.object({
    userId: z.string(),
  }),
  body: z.object({
    verificationStatus: z.enum(['VERIFIED', 'REJECTED', 'PENDING_REVIEW', 'NEEDS_RESUBMISSION']),
    adminNotes: z.string().optional(),
  }),
});

export const listPortfoliosSchema = z.object({
  query: z.object({
    page: z.string().transform(Number).optional(),
    limit: z.string().transform(Number).optional(),
  }),
});

export const userParamSchema = z.object({
  params: z.object({
    userId: z.string(),
  }),
});

export const documentIdParamSchema = z.object({
  params: z.object({
    id: z.string(),
  }),
});
