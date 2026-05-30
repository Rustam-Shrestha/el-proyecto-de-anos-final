import { z } from 'zod';

export const uploadDocumentSchema = z.object({
  body: z.object({
    kycId: z.string().uuid('Invalid KYC ID'),
    type: z.enum(['CITIZENSHIP_FRONT', 'CITIZENSHIP_BACK', 'PASSPORT', 'SELFIE', 'OTHER']),
  }),
});

export const getDocumentSchema = z.object({
  params: z.object({
    id: z.string().uuid('Invalid document ID'),
  }),
});

export const getDocumentVersionsSchema = z.object({
  params: z.object({
    id: z.string().uuid('Invalid document ID'),
  }),
});

export const deleteDocumentSchema = z.object({
  params: z.object({
    id: z.string().uuid('Invalid document ID'),
  }),
});

export const replaceDocumentSchema = z.object({
  params: z.object({
    id: z.string().uuid('Invalid document ID'),
  }),
  body: z.object({
    type: z.enum(['CITIZENSHIP_FRONT', 'CITIZENSHIP_BACK', 'PASSPORT', 'SELFIE', 'OTHER']).optional(),
  }),
});
