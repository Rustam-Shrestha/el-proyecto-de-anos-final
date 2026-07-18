import fs from 'fs';
import path from 'path';
import multer from 'multer';
import { logger } from '@/config/logger';

const avatarUploadDir = path.join(process.cwd(), 'uploads', 'avatars');

fs.mkdirSync(avatarUploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, avatarUploadDir);
  },
  filename: (req, file, cb) => {
    if (!req.user) {
      return cb(new Error('User not authenticated'), '');
    }

    const ext = path.extname(file.originalname).toLowerCase() || '.png';
    cb(null, `${req.user.id}_avatar_${Date.now()}${ext}`);
  },
});

const fileFilter = (_req: unknown, file: { mimetype: string }, cb: multer.FileFilterCallback) => {
  const allowedMimes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true);
    return;
  }

  cb(new Error(`File type ${file.mimetype} is not allowed for avatars`));
};

export const avatarUpload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024,
  },
});

logger.info(`📁 Avatar upload configured at: ${avatarUploadDir}`);