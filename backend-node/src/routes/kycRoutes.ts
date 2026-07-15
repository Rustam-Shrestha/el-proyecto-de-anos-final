import { Router, Request, Response, NextFunction } from 'express';
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
import { apiResponse } from '@/utils/apiResponse';
import { prisma } from '@/config/database';
import { ocrService } from '@/services/ocrService';
import { faceService } from '@/services/faceService';
import { kycVerificationService } from '@/services/kycVerificationService';
import { kycSubmissionFileService } from '@/services/kycSubmissionFileService';
import { kycService } from '@/services/kycService';
import { auditService } from '@/services/auditService';
import { resolveAbsolutePath } from '@/utils/pathUtils';

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
    const contentType = req.headers['content-type'] || '';
    if (!contentType.includes('multipart/form-data')) {
      return res.status(415).json(
        apiResponse.error('Content-Type must be multipart/form-data (send actual file uploads, not JSON)', 415)
      );
    }
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
 * GET /api/v1/kyc/status/:kycId
 * Poll detailed processing status with face/OCR progress, submission file, manual review info
 */
kycRouter.get('/status/:kycId', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { kycId } = req.params;
    const kyc = await prisma.kycApplication.findUnique({
      where: { id: kycId },
      include: {
        faceVerification: true,
        ocrResults: { orderBy: { createdAt: 'desc' }, take: 1 },
        submissionFile: true,
        manualReviewQueue: { where: { status: 'PENDING' }, orderBy: { createdAt: 'desc' } },
        documents: { select: { id: true, documentType: true, filePath: true, fileMimeType: true } },
      },
    });

    if (!kyc) return res.status(404).json(apiResponse.error('KYC not found', 404));

    res.json(apiResponse.success('KYC processing status', {
      id: kyc.id,
      status: kyc.status,
      workflowStage: kyc.workflowStage,
      processingStatus: kyc.processingStatus,
      faceVerification: kyc.faceVerification,
      faceVerificationStatus: kyc.faceVerificationStatus,
      ocrProcessingStatus: kyc.ocrProcessingStatus,
      ocrFrontStatus: kyc.ocrFrontStatus,
      ocrBackStatus: kyc.ocrBackStatus,
      latestOcrResult: kyc.ocrResults[0] || null,
      submissionFile: kyc.submissionFile,
      pendingReviewQueue: kyc.manualReviewQueue,
      queuedForManualReview: kyc.queuedForManualReview,
      processingError: kyc.ocrProcessingError,
      faceError: kyc.faceProcessingError,
    }));
  } catch (error) {
    next(error);
  }
});

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
  authorize('ADMIN', 'REVIEWER'),
  validate(getKycDocumentsSchema),
  getKycDocuments
);

kycRouter.use('/documents', documentRoutes);

/**
 * @swagger
 * /api/v1/kyc/extract-ocr:
 *   post:
 *     tags: [KYC]
 *     summary: Extract OCR data from a document
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [documentPath, documentType]
 *             properties:
 *               documentPath:
 *                 type: string
 *               documentType:
 *                 type: string
 *               kycApplicationId:
 *                 type: string
 *     responses:
 *       200:
 *         description: OCR extraction completed
 *       400:
 *         description: Missing required fields
 *       401:
 *         description: Unauthorized
 */
kycRouter.post('/extract-ocr', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { kycApplicationId, documentType } = req.body;

    if (!kycApplicationId || !documentType) {
      return res.status(400).json(apiResponse.error('kycApplicationId and documentType required', 400));
    }

    const doc = await prisma.document.findFirst({
      where: { kycId: kycApplicationId, documentType: documentType as any },
    });
    if (!doc) {
      return res.status(404).json(apiResponse.error(`Document not found for type: ${documentType}`, 404));
    }

    const documentPath = resolveAbsolutePath(doc.filePath);
    const result = await ocrService.extractCitizenshipData(documentPath, documentType);

    await prisma.ocrResult.create({
      data: {
        kycApplicationId: req.body.kycApplicationId,
        documentType,
        rawOcrText: result.rawText,
        extractedData: result.extractedData,
        overallConfidence: result.overallConfidence
      }
    });

    const prefillData: any = {};
    if (result.extractedData.name) prefillData.ocrFullName = result.extractedData.name;
    if (result.extractedData.citizenship_number) prefillData.ocrCitizenshipNumber = result.extractedData.citizenship_number;
    if (result.extractedData.dob) prefillData.ocrDateOfBirth = result.extractedData.dob;
    if (result.extractedData.gender) prefillData.ocrGender = result.extractedData.gender;
    if (result.extractedData.address) prefillData.ocrAddress = result.extractedData.address;

    if (Object.keys(prefillData).length > 0) {
      await prisma.kycApplication.update({
        where: { id: req.body.kycApplicationId },
        data: prefillData
      });
    }

    res.json(apiResponse.success('OCR extraction completed', {
      extractedData: result.extractedData,
      overallConfidence: result.overallConfidence,
      rawText: result.rawText,
      ocrSkipped: !result.overallConfidence && !result.rawText,
    }));
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /api/v1/kyc/verify-face:
 *   post:
 *     tags: [KYC]
 *     summary: Verify face against citizenship photo
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [citizenshipPhotoPath, selfiePhotoPath]
 *             properties:
 *               citizenshipPhotoPath:
 *                 type: string
 *               selfiePhotoPath:
 *                 type: string
 *               kycApplicationId:
 *                 type: string
 *     responses:
 *       200:
 *         description: Face verification completed
 *       400:
 *         description: Missing required fields
 *       401:
 *         description: Unauthorized
 */
kycRouter.post('/verify-face', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { kycApplicationId } = req.body;

    if (!kycApplicationId) {
      return res.status(400).json(apiResponse.error('kycApplicationId required', 400));
    }

    const faceDisabled = process.env.FACE_MATCH_ENABLED === 'false';

    let faceResult = { similarityScore: 0, status: 'SKIPPED', recommendation: 'REVIEW' };

    if (!faceDisabled) {
      const frontDoc = await prisma.document.findFirst({
        where: { kycId: kycApplicationId, documentType: 'CITIZENSHIP_FRONT' as any },
      });
      const selfieDoc = await prisma.document.findFirst({
        where: { kycId: kycApplicationId, documentType: 'SELFIE' as any },
      });

      if (!frontDoc || !selfieDoc) {
        return res.status(404).json(apiResponse.error('Citizenship front or selfie document not found', 404));
      }

      const citizenshipPhotoPath = resolveAbsolutePath(frontDoc.filePath);
      const selfiePhotoPath = resolveAbsolutePath(selfieDoc.filePath);

      faceResult = await faceService.verifyFace(citizenshipPhotoPath, selfiePhotoPath);
    } else {
      logger.info('Face matching disabled via FACE_MATCH_ENABLED=false');
    }

    await prisma.faceVerification.upsert({
      where: { kycApplicationId },
      update: {
        similarityScore: faceResult.similarityScore,
        status: faceResult.status,
        recommendation: faceResult.recommendation
      },
      create: {
        kycApplicationId,
        citizenshipPhotoPath: '',
        selfiePhotoPath: '',
        similarityScore: faceResult.similarityScore,
        status: faceResult.status,
        recommendation: faceResult.recommendation
      }
    });

    res.json(apiResponse.success('Face verification completed', {
      similarityScore: (faceResult.similarityScore * 100).toFixed(2),
      status: faceResult.status,
      recommendation: faceResult.recommendation,
      faceSkipped: faceDisabled || faceResult.status === 'SKIPPED',
    }));
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /api/v1/kyc/submit-confirmed:
 *   post:
 *     tags: [KYC]
 *     summary: Submit KYC with user confirmed data
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [kycApplicationId, confirmedData]
 *             properties:
 *               kycApplicationId:
 *                 type: string
 *               confirmedData:
 *                 type: object
 *     responses:
 *       200:
 *         description: KYC submitted for review
 *       401:
 *         description: Unauthorized
 */
kycRouter.post('/submit-confirmed', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { kycApplicationId, confirmedData } = req.body;

    if (!kycApplicationId || !confirmedData) {
      return res.status(400).json(apiResponse.error('kycApplicationId and confirmedData are required', 400));
    }

    const kyc = await kycService.submitKycWithConfirmedData(kycApplicationId, confirmedData);

    await kycVerificationService.generateVerificationReport(kycApplicationId);

    await auditService.log({
      userId: req.user!.id,
      action: 'SUBMIT_KYC',
      metadata: { kycApplicationId },
      ip: req.ip,
      userAgent: req.get('user-agent')
    });

    res.json(apiResponse.success('KYC submitted for review', kyc));
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /api/v1/kyc/get-verification-report/{kycId}:
 *   get:
 *     tags: [KYC]
 *     summary: Get verification report for a KYC application
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: kycId
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Verification report retrieved
 *       404:
 *         description: Report not found
 *       401:
 *         description: Unauthorized
 */
kycRouter.get('/get-verification-report/:kycId', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const report = await prisma.verificationReport.findUnique({
      where: { kycApplicationId: req.params.kycId },
      include: {
        kycApplication: {
          include: { faceVerification: true, ocrResults: true }
        }
      }
    });

    if (!report) {
      return res.status(404).json(apiResponse.error('Report not found', 404));
    }

    res.json(apiResponse.success('Verification report retrieved', report));
  } catch (error) {
    next(error);
  }
});

export default kycRouter;
