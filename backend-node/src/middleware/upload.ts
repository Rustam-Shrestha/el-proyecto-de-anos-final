import fs from 'fs';
import multer from 'multer';
import path from 'path';
import { env } from '@/config/env';
import { logger } from '@/config/logger';

// Create upload directories if they don't exist
const uploadDir = path.join(process.cwd(), env.UPLOAD_DIR);
const selfiesDir = path.join(uploadDir, 'selfies');
const documentsDir = path.join(uploadDir, 'documents');
fs.mkdirSync(selfiesDir, { recursive: true });
fs.mkdirSync(documentsDir, { recursive: true });

/**
 * Multer storage configuration for KYC documents
 * - Files stored in: uploads/kyc/documents/ or uploads/kyc/selfies/
 * - Filename: {userId}_{documentType}_{timestamp}.{ext}
 * - Max size: 10 MB
 * - Allowed MIME types: JPEG, PNG, WebP, PDF
 */
const storage = multer.diskStorage({
  destination: (_req, file, cb) => {
    // Determine subdirectory based on field name
    const subfolder = file.fieldname === 'selfie' ? 'selfies' : 'documents';
    const fullPath = path.join(uploadDir, subfolder);
    cb(null, fullPath);
  },

  filename: (req, file, cb) => {
    if (!req.user) {
      return cb(new Error('User not authenticated'));
    }

    const documentType = req.body.type || 'OTHER';
    const timestamp = Date.now();
    const ext = path.extname(file.originalname);

    // Format: {userId}_{documentType}_{timestamp}{ext}
    const filename = `${req.user.id}_${documentType}_${timestamp}${ext}`;
    cb(null, filename);
  },
});

/**
 * File filter for Multer
 * Allowed MIME types: JPEG, PNG, WebP, PDF
 */
const fileFilter = (_req: any, file: any, cb: any) => {
  const allowedMimes = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];

  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error(`File type ${file.mimetype} is not allowed`));
  }
};

/**
 * Multer upload middleware
 * - Max file size: 10 MB
 * - Single file upload
 * - File validation
 */
export const uploadMiddleware = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10 MB in bytes
  },
});

logger.info(`📁 Multer configured for uploads at: ${uploadDir}`);
