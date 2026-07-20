import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { authenticate } from '@/middleware/auth';
import { authorize } from '@/middleware/rbac';
import { validate } from '@/middleware/requestValidation';
import { env } from '@/config/env';

import {
  saveEmployment,
  getEmployment,
  adminGetUserEmployment,
} from '@/controllers/employmentController';
import { employmentSchema } from '@/routes/employmentSchemas';

import {
  uploadFinancialDocument,
  listFinancialDocuments,
  getFinancialDocument,
  deleteFinancialDocument,
  getDocumentSummary,
  adminVerifyFinancialDocument,
} from '@/controllers/financialDocumentController';

import {
  getPortfolioSummary,
  getVerificationStatus,
  getPortfolioMetrics,
  getVerificationReport,
  getLoanHistory,
  submitPortfolio,
} from '@/controllers/portfolioController';

import {
  listPendingPortfolios,
  getPortfolioDetail,
  verifyPortfolio,
  getPortfolioReport,
  getUserDocuments,
} from '@/controllers/portfolioAdminController';

import {
  uploadFinancialDocumentSchema,
  deleteFinancialDocumentSchema,
  verifyFinancialDocumentSchema,
  verifyPortfolioSchema,
  listPortfoliosSchema,
  userParamSchema,
  documentIdParamSchema,
} from '@/routes/portfolioSchemas';

const financialDocStorage = multer.diskStorage({
  destination: (req, _file, cb) => {
    const userId = req.user ? req.user.id : 'unknown';
    const dir = path.join(process.cwd(), env.UPLOAD_DIR, 'financial', `user-${userId}`);
    fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (_req, file, cb) => {
    const timestamp = Date.now();
    const ext = path.extname(file.originalname);
    cb(null, `financial_${timestamp}${ext}`);
  },
});

const financialDocUpload = multer({
  storage: financialDocStorage,
  fileFilter: (_req, file, cb) => {
    const allowedMimes = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('File type not allowed. Only JPEG, PNG, WebP, and PDF are accepted.'));
    }
  },
  limits: { fileSize: 10 * 1024 * 1024 },
});

const portfolioRouter = Router();

// ─── Employment Routes ──────────────────────────────────────────
portfolioRouter.post(
  '/employment',
  authenticate,
  validate(employmentSchema),
  saveEmployment
);

portfolioRouter.get(
  '/employment',
  authenticate,
  getEmployment
);

// ─── Document Routes ────────────────────────────────────────────
portfolioRouter.post(
  '/documents/upload',
  authenticate,
  (req, res, next) => {
    financialDocUpload.single('document')(req, res, (err: unknown) => {
      if (err) return next(err);
      next();
    });
  },
  validate(uploadFinancialDocumentSchema),
  uploadFinancialDocument
);

portfolioRouter.get(
  '/documents',
  authenticate,
  listFinancialDocuments
);

portfolioRouter.get(
  '/documents/summary',
  authenticate,
  getDocumentSummary
);

portfolioRouter.get(
  '/documents/:id',
  authenticate,
  validate(documentIdParamSchema),
  getFinancialDocument
);

portfolioRouter.delete(
  '/documents/:id',
  authenticate,
  validate(deleteFinancialDocumentSchema),
  deleteFinancialDocument
);

// ─── Portfolio Routes ───────────────────────────────────────────
portfolioRouter.post(
  '/submit',
  authenticate,
  submitPortfolio
);

portfolioRouter.get(
  '/summary',
  authenticate,
  getPortfolioSummary
);

portfolioRouter.get(
  '/verification-status',
  authenticate,
  getVerificationStatus
);

portfolioRouter.get(
  '/metrics',
  authenticate,
  getPortfolioMetrics
);

portfolioRouter.get(
  '/report',
  authenticate,
  getVerificationReport
);

portfolioRouter.get(
  '/loans',
  authenticate,
  getLoanHistory
);

// ─── Admin Routes ───────────────────────────────────────────────
portfolioRouter.get(
  '/admin/pending',
  authenticate,
  authorize('ADMIN', 'REVIEWER'),
  validate(listPortfoliosSchema),
  listPendingPortfolios
);

portfolioRouter.get(
  '/admin/users/:userId',
  authenticate,
  authorize('ADMIN', 'REVIEWER'),
  validate(userParamSchema),
  getPortfolioDetail
);

portfolioRouter.get(
  '/admin/users/:userId/documents',
  authenticate,
  authorize('ADMIN', 'REVIEWER'),
  validate(userParamSchema),
  getUserDocuments
);

portfolioRouter.get(
  '/admin/users/:userId/report',
  authenticate,
  authorize('ADMIN', 'REVIEWER'),
  validate(userParamSchema),
  getPortfolioReport
);

portfolioRouter.patch(
  '/admin/users/:userId/verify',
  authenticate,
  authorize('ADMIN', 'REVIEWER'),
  validate(verifyPortfolioSchema),
  verifyPortfolio
);

portfolioRouter.get(
  '/admin/users/:userId/employment',
  authenticate,
  authorize('ADMIN', 'REVIEWER'),
  validate(userParamSchema),
  adminGetUserEmployment
);

// ─── Admin Document Verification ─────────────────────────────────
portfolioRouter.patch(
  '/admin/documents/:id/verify',
  authenticate,
  authorize('ADMIN', 'REVIEWER'),
  validate(verifyFinancialDocumentSchema),
  adminVerifyFinancialDocument
);

export default portfolioRouter;
