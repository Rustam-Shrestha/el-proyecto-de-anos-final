import { z } from 'zod';

export const submitKycSchema = z.object({
  body: z.object({
    documents: z
      .array(
        z.object({
          type: z.enum(['CITIZENSHIP_FRONT', 'CITIZENSHIP_BACK', 'PASSPORT', 'SELFIE', 'OTHER']),
          filePath: z.string().min(1, 'File path is required'),
          mimeType: z.string(),
          sizeBytes: z.number().min(1),
        })
      )
      .min(1, 'At least one document is required'),
  }),
});

export const getKycStatusSchema = z.object({
  query: z.object({
    userId: z.string().uuid().optional(),
  }),
});

export const listKycApplicationsSchema = z.object({
  query: z.object({
    page: z.string().transform(Number).optional(),
    limit: z.string().transform(Number).optional(),
    status: z
      .enum(['PENDING', 'UNDER_REVIEW', 'APPROVED', 'REJECTED', 'RESUBMIT_REQUIRED'])
      .optional(),
    search: z.string().optional(),
  }),
});

export const getKycByIdSchema = z.object({
  params: z.object({
    id: z.string().uuid('Invalid KYC application ID'),
  }),
});

export const approveKycSchema = z.object({
  params: z.object({
    id: z.string().uuid('Invalid KYC application ID'),
  }),
});

export const rejectKycSchema = z.object({
  params: z.object({
    id: z.string().uuid('Invalid KYC application ID'),
  }),
  body: z.object({
    rejectionReason: z.string().min(10, 'Rejection reason must be at least 10 characters'),
  }),
});

export const requestResubmitSchema = z.object({
  params: z.object({
    id: z.string().uuid('Invalid KYC application ID'),
  }),
  body: z.object({
    note: z.string().min(10, 'Note must be at least 10 characters'),
  }),
});
