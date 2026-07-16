import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { authenticate } from '@/middleware/auth';
import { authorize } from '@/middleware/rbac';
import { validate } from '@/middleware/requestValidation';
import {
  uploadDocumentSchema,
  getDocumentSchema,
  verifyDocumentSchema,
  replaceDocumentSchema,
  deleteDocumentSchema,
} from '@/routes/documentSchemas';
import {
  uploadDocument,
  getDocument,
  verifyDocument,
  replaceDocument,
  deleteDocument,
} from '@/controllers/documentController';
import { env } from '@/config/env';

const documentStorage = multer.diskStorage({
  destination: (req, _file, cb) => {
    const userId = req.user ? req.user.id : 'unknown';
    const documentType = req.body?.documentType ?? 'OTHER';
    const dir = path.join(process.cwd(), env.UPLOAD_DIR, `user-${userId}`, documentType);
    fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (_req, file, cb) => {
    const timestamp = Date.now();
    const ext = path.extname(file.originalname);
    cb(null, `${timestamp}${ext}`);
  },
});

const documentUpload = multer({
  storage: documentStorage,
  fileFilter: (_req, file, cb) => {
    const allowedMimes = ['image/jpeg', 'image/png', 'application/pdf'];
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('File type not allowed. Only JPEG, PNG, and PDF are accepted.'));
    }
  },
  limits: { fileSize: 10 * 1024 * 1024 },
});

const documentRouter = Router();

documentRouter.post(
  '/upload',
  authenticate,
  (req, res, next) => {
    documentUpload.single('document')(req, res, (err: unknown) => {
      if (err) return next(err);
      next();
    });
  },
  validate(uploadDocumentSchema),
  uploadDocument
);

documentRouter.get(
  '/:documentId',
  authenticate,
  validate(getDocumentSchema),
  getDocument
);

documentRouter.patch(
  '/:documentId/verify',
  authenticate,
  authorize('ADMIN', 'REVIEWER'),
  validate(verifyDocumentSchema),
  verifyDocument
);

documentRouter.post(
  '/:documentId/replace',
  authenticate,
  (req, res, next) => {
    documentUpload.single('document')(req, res, (err: unknown) => {
      if (err) return next(err);
      next();
    });
  },
  validate(replaceDocumentSchema),
  replaceDocument
);

documentRouter.delete(
  '/:documentId',
  authenticate,
  validate(deleteDocumentSchema),
  deleteDocument
);

export default documentRouter;
