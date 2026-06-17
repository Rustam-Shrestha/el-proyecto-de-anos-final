import { Router } from 'express';
import { authenticate } from '@/middleware/auth';
import { authorize } from '@/middleware/rbac';
import { uploadMiddleware } from '@/middleware/upload';
import { validate } from '@/middleware/requestValidation';
import {
  getKycStatusSchema,
  listKycApplicationsSchema,
  getKycByIdSchema,
  approveKycSchema,
  rejectKycSchema,
  requestResubmitSchema,
} from '@/routes/kycSchemas';
import {
  submitKyc,
  getMyStatus,
  getKycStatus,
  listKycApplications,
  getKycById,
  approveKyc,
  rejectKyc,
  requestKycResubmit,
} from '@/controllers/kycController';
import { getKycDocuments } from '@/controllers/documentController';
import { getKycDocumentsSchema } from '@/routes/documentSchemas';
import documentRoutes from '@/routes/documentRoutes';

const kycRouter = Router();

/**
 * @swagger
 * /api/v1/kyc/submit:
 *   post:
 *     tags: [KYC]
 *     summary: Submit a new KYC application
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [documents]
 *             properties:
 *               documents:
 *                 type: array
 *                 minItems: 1
 *                 items:
 *                   type: object
 *                   required: [type, filePath, mimeType, sizeBytes]
 *                   properties:
 *                     type:
 *                       type: string
 *                       enum: [CITIZENSHIP_FRONT, CITIZENSHIP_BACK, PASSPORT, SELFIE, OTHER]
 *                     filePath:
 *                       type: string
 *                     mimeType:
 *                       type: string
 *                     sizeBytes:
 *                       type: number
 *     responses:
 *       201:
 *         description: KYC application submitted successfully
 *       409:
 *         description: Active KYC application already exists
 *       401:
 *         description: Unauthorized
 */
kycRouter.post(
  '/submit',
  authenticate,
  (req, res, next) => {
    uploadMiddleware.fields([
      { name: 'selfie', maxCount: 1 },
      { name: 'idProof', maxCount: 1 },
      { name: 'addressProof', maxCount: 1 },
    ])(req, res, (err: unknown) => {
      if (err) return next(err);
      next();
    });
  },
  submitKyc
);

/**
 * @swagger
 * /api/v1/kyc/status:
 *   get:
 *     tags: [KYC]
 *     summary: Get current user's KYC status
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: KYC status retrieved
 *       401:
 *         description: Unauthorized
 */
kycRouter.get('/my-status', authenticate, getMyStatus);

kycRouter.get('/status', authenticate, validate(getKycStatusSchema), getKycStatus);

/**
 * @swagger
 * /api/v1/kyc:
 *   get:
 *     tags: [KYC]
 *     summary: List all KYC applications
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: page
 *         in: query
 *         schema:
 *           type: integer
 *           default: 1
 *       - name: limit
 *         in: query
 *         schema:
 *           type: integer
 *           default: 10
 *       - name: status
 *         in: query
 *         schema:
 *           type: string
 *           enum: [PENDING, UNDER_REVIEW, APPROVED, REJECTED, RESUBMIT_REQUIRED]
 *       - name: search
 *         in: query
 *         schema:
 *           type: string
 *           description: Search by email or full name
 *     responses:
 *       200:
 *         description: KYC applications listed successfully
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
 *                   type: array
 *                 meta:
 *                   type: object
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin/Reviewer access required
 */
kycRouter.get(
  '/',
  authenticate,
  authorize('ADMIN', 'REVIEWER'),
  validate(listKycApplicationsSchema),
  listKycApplications
);

/**
 * @swagger
 * /api/v1/kyc/{id}:
 *   get:
 *     tags: [KYC]
 *     summary: Get a specific KYC application
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
 *         description: KYC application retrieved
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: KYC application not found
 */
kycRouter.get(
  '/:id',
  authenticate,
  authorize('ADMIN', 'REVIEWER'),
  validate(getKycByIdSchema),
  getKycById
);

/**
 * @swagger
 * /api/v1/kyc/{id}/approve:
 *   patch:
 *     tags: [KYC]
 *     summary: Approve a KYC application
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
 *         description: KYC application approved
 *       400:
 *         description: Application already approved
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: KYC application not found
 */
kycRouter.patch(
  '/:id/approve',
  authenticate,
  authorize('ADMIN', 'REVIEWER'),
  validate(approveKycSchema),
  approveKyc
);

/**
 * @swagger
 * /api/v1/kyc/{id}/reject:
 *   patch:
 *     tags: [KYC]
 *     summary: Reject a KYC application
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
 *         application/json:
 *           schema:
 *             type: object
 *             required: [rejectionReason]
 *             properties:
 *               rejectionReason:
 *                 type: string
 *                 minLength: 10
 *     responses:
 *       200:
 *         description: KYC application rejected
 *       400:
 *         description: Application already rejected
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: KYC application not found
 */
kycRouter.patch(
  '/:id/reject',
  authenticate,
  authorize('ADMIN', 'REVIEWER'),
  validate(rejectKycSchema),
  rejectKyc
);

/**
 * @swagger
 * /api/v1/kyc/{id}/request-resubmit:
 *   patch:
 *     tags: [KYC]
 *     summary: Request resubmission of KYC application
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
 *         application/json:
 *           schema:
 *             type: object
 *             required: [note]
 *             properties:
 *               note:
 *                 type: string
 *                 minLength: 10
 *     responses:
 *       200:
 *         description: Resubmission requested
 *       400:
 *         description: Resubmission already requested
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: KYC application not found
 */
kycRouter.patch(
  '/:id/request-resubmit',
  authenticate,
  authorize('ADMIN', 'REVIEWER'),
  validate(requestResubmitSchema),
  requestKycResubmit
);

// Document routes
kycRouter.get(
  '/:kycId/documents',
  authenticate,
  validate(getKycDocumentsSchema),
  getKycDocuments
);

kycRouter.use('/documents', documentRoutes);

export default kycRouter;
