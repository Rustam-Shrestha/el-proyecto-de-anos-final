import fs from 'fs';
import multer from 'multer';
import path from 'path';
import { env } from '@/config/env';
import { logger } from '@/config/logger';

const uploadDir = path.join(process.cwd(), env.UPLOAD_DIR, 'statements');
fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    if (!req.user) return cb(new Error('User not authenticated'), '');
    const timestamp = Date.now();
    const ext = path.extname(file.originalname);
    cb(null, `${req.user.id}_statement_${timestamp}${ext}`);
  },
});

const fileFilter = (_req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const allowed = [
    'application/pdf',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'text/csv',
    'text/plain',
    'image/jpeg',
    'image/png',
    'image/webp',
  ];
  if (allowed.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error(`File type ${file.mimetype} is not supported for bank statements`));
  }
};

export const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 15 * 1024 * 1024 },
});

logger.info(`Statement upload middleware configured at: ${uploadDir}`);
