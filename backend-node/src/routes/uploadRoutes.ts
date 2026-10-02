import { Router } from 'express';
import { authenticate } from '@/middleware/auth';
import { upload } from '@/middleware/statementUpload';
import { validate } from '@/middleware/requestValidation';
import { z } from 'zod';
import type { Request, Response, NextFunction } from 'express';
import {
  uploadStatement,
  listUploads,
  getUpload,
} from '@/controllers/uploadController';

const uploadRouter = Router();

export const getUploadSchema = z.object({
  params: z.object({ id: z.string() }),
});

const uploadSingle = upload.single('file') as unknown as (req: Request, res: Response, next: NextFunction) => void;

uploadRouter.post(
  '/',
  authenticate,
  uploadSingle,
  uploadStatement,
);

uploadRouter.get(
  '/',
  authenticate,
  listUploads,
);

uploadRouter.get(
  '/:id',
  authenticate,
  validate(getUploadSchema),
  getUpload,
);

export default uploadRouter;
