import { z } from 'zod';

const uploadDocumentSchema = z.object({
  body: z.object({
    kycId: z.string(),
    documentType: z.string(),
  }),
});

const getKycDocumentsSchema = z.object({
  params: z.object({
    kycId: z.string(),
  }),
});

const getDocumentSchema = z.object({
  params: z.object({
    documentId: z.string(),
  }),
});

const verifyDocumentSchema = z.object({
  params: z.object({
    documentId: z.string(),
  }),
  body: z.object({
    verificationStatus: z.string(),
    verificationNotes: z.string().optional(),
  }),
});

const replaceDocumentSchema = z.object({
  params: z.object({
    documentId: z.string(),
  }),
  body: z.object({
    documentType: z.string().optional(),
  }),
});

const deleteDocumentSchema = z.object({
  params: z.object({
    documentId: z.string(),
  }),
});

export {
  uploadDocumentSchema,
  getKycDocumentsSchema,
  getDocumentSchema,
  verifyDocumentSchema,
  replaceDocumentSchema,
  deleteDocumentSchema,
};
