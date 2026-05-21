import { Router } from 'express';
import { authenticate } from '@/middleware/auth';
import { uploadMiddleware } from '@/middleware/upload';
import { validate } from '@/middleware/requestValidation';
import {
  uploadDocumentSchema,
  getDocumentSchema,
  getDocumentVersionsSchema,
  deleteDocumentSchema,
  replaceDocumentSchema,
} from '@/routes/documentSchemas';
import {
  uploadDocument,
  getDocument,
  getDocumentVersions,
  deleteDocument,
  replaceDocument,
} from '@/controllers/documentController';

const documentRouter = Router();

/**
 * @swagger
 * /api/v1/documents/upload:
 *   post:
 *     tags: [Documents]
 *     summary: Upload a new document for KYC application
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required: [file, kycId, type]
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *                 description: Document file (max 10 MB, JPEG/PNG/WebP/PDF)
 *               kycId:
 *                 type: string
 *                 format: uuid
 *                 description: KYC application ID
 *               type:
 *                 type: string
 *                 enum: [CITIZENSHIP_FRONT, CITIZENSHIP_BACK, PASSPORT, SELFIE, OTHER]
 *     responses:
 *       201:
 *         description: Document uploaded successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                     filePath:
 *                       type: string
 *                     type:
 *                       type: string
 *                     version:
 *                       type: integer
 *       400:
 *         description: File missing or validation error
 *       401:
 *         description: Unauthorized
 *       409:
 *         description: Document of this type already exists
 */
documentRouter.post(
  '/upload',
  authenticate,
  uploadMiddleware.single('document'),
  validate(uploadDocumentSchema),
  uploadDocument
);

/**
 * @swagger
 * /api/v1/documents/{id}:
 *   get:
 *     tags: [Documents]
 *     summary: Get document metadata
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Document metadata retrieved
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Document does not belong to you
 *       404:
 *         description: Document not found
 */
documentRouter.get(
  '/:id',
  authenticate,
  validate(getDocumentSchema),
  getDocument
);

/**
 * @swagger
 * /api/v1/documents/{id}/versions:
 *   get:
 *     tags: [Documents]
 *     summary: Get document version history
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Document versions retrieved
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                       version:
 *                         type: integer
 *                       filePath:
 *                         type: string
 *                       createdAt:
 *                         type: string
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Document not found
 */
documentRouter.get(
  '/:id/versions',
  authenticate,
  validate(getDocumentVersionsSchema),
  getDocumentVersions
);

/**
 * @swagger
 * /api/v1/documents/{id}:
 *   delete:
 *     tags: [Documents]
 *     summary: Soft-delete a document (moves to archive)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Document deleted successfully
 *       400:
 *         description: Document already deleted
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Document not found
 */
documentRouter.delete(
  '/:id',
  authenticate,
  validate(deleteDocumentSchema),
  deleteDocument
);

/**
 * @swagger
 * /api/v1/documents/{id}/replace:
 *   post:
 *     tags: [Documents]
 *     summary: Replace document with new version
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required: [file]
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *                 description: New document file
 *               type:
 *                 type: string
 *                 enum: [CITIZENSHIP_FRONT, CITIZENSHIP_BACK, PASSPORT, SELFIE, OTHER]
 *                 description: Optional - override document type
 *     responses:
 *       200:
 *         description: Document replaced with new version
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                     version:
 *                       type: integer
 *       400:
 *         description: File missing or document already deleted
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Document not found
 */
documentRouter.post(
  '/:id/replace',
  authenticate,
  uploadMiddleware.single('document'),
  validate(replaceDocumentSchema),
  replaceDocument
);

export default documentRouter;
