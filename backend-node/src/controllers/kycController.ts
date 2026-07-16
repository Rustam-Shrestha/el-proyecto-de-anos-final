import type { Request, Response, NextFunction } from 'express';
import { kycService } from '@/services/kycService';
import { userService } from '@/services/userService';
import { auditService } from '@/services/auditService';
import { ocrService } from '@/services/ocrService';
import { faceService } from '@/services/faceService';
import { kycSubmissionFileService } from '@/services/kycSubmissionFileService';
import { extractionVerificationService } from '@/services/extractionVerificationService';
import { apiResponse } from '@/utils/apiResponse';
import { paginate } from '@/utils/pagination';
import { getRelativePath, resolveAbsolutePath } from '@/utils/pathUtils';
import { prisma } from '@/config/database';
import { logger } from '@/config/logger';

const documentTypeMap: Record<string, string> = {
  selfie: 'SELFIE',
  idProof: 'CITIZENSHIP_FRONT',
  addressProof: 'CITIZENSHIP_BACK',
};

/**
 * GET /api/v1/kyc/my-status
 * Get current user's KYC status with document summary
 */
export const getMyStatus = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json(apiResponse.error('Authentication required', 401));
      return;
    }

    const application = await kycService.getKycStatus(req.user.id);

    if (!application) {
      res.json(apiResponse.success('No KYC application found', null));
      return;
    }

    res.json(apiResponse.success('KYC status retrieved', application));
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/v1/kyc/submit
 * Submit a new KYC application with file uploads
 */
export const submitKyc = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json(apiResponse.error('Authentication required', 401));
      return;
    }

    const files = req.files as { [fieldname: string]: Express.Multer.File[] } | undefined;

    if (!files || Object.keys(files).length === 0) {
      res.status(400).json(apiResponse.error('At least one document file is required', 400));
      return;
    }

    // Validate that ALL required file fields were actually uploaded as files
    const requiredFields = ['selfie', 'idProof', 'addressProof'];
    for (const field of requiredFields) {
      const fieldFiles = files[field];
      if (!fieldFiles || fieldFiles.length === 0 || fieldFiles[0].size === 0) {
        res.status(400).json(apiResponse.error(`Missing or empty file for '${field}'`, 400));
        return;
      }
    }

    // Validate required text fields before creating KYC
    const { fullName, phone, address } = req.body;
    if (!fullName || !phone) {
      res.status(400).json(apiResponse.error('fullName and phone are required', 400));
      return;
    }

    const documents = Object.entries(files).flatMap(([fieldname, fileArray]) =>
      fileArray.map((file) => ({
        type: documentTypeMap[fieldname] || 'OTHER',
        filePath: getRelativePath(file.path),
        mimeType: file.mimetype,
        sizeBytes: file.size,
      }))
    );

    const result = await kycService.submitKyc({
      userId: req.user.id,
      documents,
    });

    // Update user profile with submitted info
    await userService.updateUser(req.user.id, {
      ...(fullName && { fullName }),
      ...(phone && { phone }),
      ...(address && { address }),
    });

    // Log KYC submission
    await auditService.log({
      userId: req.user.id,
      action: 'SUBMIT_KYC',
      metadata: {
        kycId: result.id,
        documentCount: documents.length,
      },
      ip: req.ip || undefined,
      userAgent: req.headers['user-agent'],
    });

    res.status(201).json(
      apiResponse.success('KYC application submitted successfully', result)
    );

    // Background processing: FACE FIRST, OCR in background (non-blocking, after response sent)
    setImmediate(async () => {
      try {
        const frontDoc = result.documents.find((d) => d.type === 'CITIZENSHIP_FRONT');
        const backDoc = result.documents.find((d) => d.type === 'CITIZENSHIP_BACK');
        const selfieDoc = result.documents.find((d) => d.type === 'SELFIE');

        await prisma.kycApplication.update({
          where: { id: result.id },
          data: { processingStatus: 'PROCESSING', workflowStage: 'VALIDATING_FACE' },
        });

        // STEP 1: Face Verification (REQUIRED - blocks progress)
        let faceSucceeded = false;
        if (frontDoc && selfieDoc && process.env.FACE_MATCH_ENABLED !== 'false') {
          await prisma.kycApplication.update({
            where: { id: result.id },
            data: { faceStatus: 'PROCESSING', processingStatus: 'PROCESSING', workflowStage: 'VALIDATING_FACE' },
          });
          const frontPath = resolveAbsolutePath(frontDoc.filePath);
          const selfiePath = resolveAbsolutePath(selfieDoc.filePath);
          const faceResult = await faceService.verifyFace(frontPath, selfiePath);

          if (faceResult.error) {
            await prisma.kycApplication.update({
              where: { id: result.id },
              data: {
                faceStatus: 'FAILED',
                faceVerificationStatus: 'FAILED',
                faceProcessingError: faceResult.error,
                processingStatus: 'FAILED',
                workflowStage: 'VALIDATING_FACE',
                queuedForManualReview: true,
              },
            });
            await prisma.manualReviewQueue.create({
              data: {
                kycApplicationId: result.id,
                reason: 'FACE_VERIFICATION_ERROR',
                details: faceResult.error,
                priority: 'HIGH',
              },
            });
            logger.info({ kycId: result.id, error: faceResult.error }, 'Face failed — queued for review');
            return;
          }

          await prisma.faceVerification.upsert({
            where: { kycApplicationId: result.id },
            update: { similarityScore: faceResult.similarityScore, status: faceResult.status, recommendation: faceResult.recommendation },
            create: { kycApplicationId: result.id, citizenshipPhotoPath: frontDoc.filePath, selfiePhotoPath: selfieDoc.filePath, similarityScore: faceResult.similarityScore, status: faceResult.status, recommendation: faceResult.recommendation },
          });

          faceSucceeded = faceResult.status === 'MATCH' || faceResult.status === 'POSSIBLE_MATCH';

          await prisma.kycApplication.update({
            where: { id: result.id },
            data: {
              faceStatus: 'DONE',
              faceVerificationStatus: faceSucceeded ? 'VERIFIED' : 'FAILED',
              workflowStage: 'AWAITING_OCR',
            },
          });

          if (!faceSucceeded) {
            await prisma.kycApplication.update({
              where: { id: result.id },
              data: { queuedForManualReview: true },
            });
            await prisma.manualReviewQueue.create({
              data: {
                kycApplicationId: result.id,
                reason: 'LOW_OCR_CONFIDENCE',
                details: `Face match result: ${faceResult.status} (score: ${faceResult.similarityScore})`,
                priority: 'NORMAL',
              },
            });
          }
        } else if (!selfieDoc) {
          await prisma.kycApplication.update({
            where: { id: result.id },
            data: { faceStatus: 'SKIPPED', faceVerificationStatus: 'SKIPPED', workflowStage: 'AWAITING_OCR' },
          });
          faceSucceeded = true;
        }

        // STEP 2: Create submission file snapshot after face success
        if (faceSucceeded) {
          try {
            await kycSubmissionFileService.createSubmissionFile(result.id);
            logger.info({ kycId: result.id }, 'Submission file created after face verification');
          } catch (sfErr: unknown) {
            logger.error({ err: sfErr, kycId: result.id }, 'Submission file creation failed (non-blocking)');
          }
        }

        // STEP 3: OCR in background (only if face succeeded)
        if (faceSucceeded) {
          await prisma.kycApplication.update({
            where: { id: result.id },
            data: { ocrProcessingStatus: 'EXTRACTING' },
          });

          // OCR Front
          if (frontDoc && process.env.OCR_ENABLED !== 'false') {
            await prisma.kycApplication.update({
              where: { id: result.id },
              data: { ocrFrontStatus: 'PROCESSING' },
            });
            const frontPath = resolveAbsolutePath(frontDoc.filePath);
            const ocrFront = await ocrService.extractCitizenshipData(frontPath, 'CITIZENSHIP_FRONT');

            if (ocrFront.error) {
              await prisma.kycApplication.update({
                where: { id: result.id },
                data: { ocrFrontStatus: 'FAILED', ocrProcessingError: ocrFront.error, ocrProcessingStatus: 'FAILED' },
              });
            } else {
              await prisma.ocrResult.create({
                data: {
                  kycApplicationId: result.id,
                  documentType: 'CITIZENSHIP_FRONT',
                  rawOcrText: ocrFront.rawText,
                  extractedData: ocrFront.extractedData,
                  overallConfidence: ocrFront.overallConfidence,
                },
              });
              await extractionVerificationService.storeExtraction(result.id, 'CITIZENSHIP_FRONT', ocrFront);
              const prefill: Record<string, string | undefined> = {};
              if (ocrFront.extractedData.name) prefill.ocrFullName = ocrFront.extractedData.name;
              if (ocrFront.extractedData.citizenship_number) prefill.ocrCitizenshipNumber = ocrFront.extractedData.citizenship_number;
              if (ocrFront.extractedData.dob) prefill.ocrDateOfBirth = ocrFront.extractedData.dob;
              if (ocrFront.extractedData.gender) prefill.ocrGender = ocrFront.extractedData.gender;
              if (ocrFront.extractedData.address) prefill.ocrAddress = ocrFront.extractedData.address;
              if (Object.keys(prefill).length > 0) {
                await prisma.kycApplication.update({ where: { id: result.id }, data: { ...prefill, ocrFrontStatus: 'DONE' } });
              } else {
                await prisma.kycApplication.update({ where: { id: result.id }, data: { ocrFrontStatus: 'DONE' } });
              }
            }
          }

          // OCR Back
          if (backDoc && process.env.OCR_ENABLED !== 'false') {
            await prisma.kycApplication.update({
              where: { id: result.id },
              data: { ocrBackStatus: 'PROCESSING' },
            });
            const backPath = resolveAbsolutePath(backDoc.filePath);
            const ocrBack = await ocrService.extractCitizenshipData(backPath, 'CITIZENSHIP_BACK');

            if (ocrBack.error) {
              await prisma.kycApplication.update({
                where: { id: result.id },
                data: { ocrBackStatus: 'FAILED', ocrProcessingError: ocrBack.error },
              });
            } else {
              await prisma.ocrResult.create({
                data: {
                  kycApplicationId: result.id,
                  documentType: 'CITIZENSHIP_BACK',
                  rawOcrText: ocrBack.rawText,
                  extractedData: ocrBack.extractedData,
                  overallConfidence: ocrBack.overallConfidence,
                },
              });
              await extractionVerificationService.storeExtraction(result.id, 'CITIZENSHIP_BACK', ocrBack);
              await prisma.kycApplication.update({
                where: { id: result.id },
                data: { ocrBackStatus: 'DONE' },
              });
            }
          }

          // Determine OCR final status
          const appAfterOcr = await prisma.kycApplication.findUnique({ where: { id: result.id } });
          if (appAfterOcr) {
            const ocrFrontDone = appAfterOcr.ocrFrontStatus === 'DONE' || appAfterOcr.ocrFrontStatus === 'FAILED' || !frontDoc;
            const ocrBackDone = appAfterOcr.ocrBackStatus === 'DONE' || appAfterOcr.ocrBackStatus === 'FAILED' || !backDoc;
            const ocrAnyFailed = appAfterOcr.ocrFrontStatus === 'FAILED' || appAfterOcr.ocrBackStatus === 'FAILED';
            const ocrAllDone = appAfterOcr.ocrFrontStatus === 'DONE' && (!backDoc || appAfterOcr.ocrBackStatus === 'DONE');

            let ocrStatus = 'EXTRACTED';
            if (ocrAnyFailed && ocrAllDone) ocrStatus = 'PARTIAL';
            else if (ocrAnyFailed) ocrStatus = 'PARTIAL';
            else if (!ocrFrontDone && !ocrBackDone) ocrStatus = 'FAILED';

            await prisma.kycApplication.update({
              where: { id: result.id },
              data: {
                ocrProcessingStatus: ocrStatus,
                workflowStage: 'AWAITING_USER_CONFIRMATION',
              },
            });

            if (ocrStatus === 'PARTIAL' || ocrStatus === 'FAILED') {
              await prisma.kycApplication.update({
                where: { id: result.id },
                data: { queuedForManualReview: true },
              });
              await prisma.manualReviewQueue.create({
                data: {
                  kycApplicationId: result.id,
                  reason: ocrStatus === 'FAILED' ? 'OCR_PROCESSING_ERROR' : 'PARTIAL_EXTRACTION',
                  details: appAfterOcr.ocrProcessingError || 'OCR completed with partial results',
                  priority: 'NORMAL',
                },
              });
            }
          }
        }

        // Final status
        const finalApp = await prisma.kycApplication.findUnique({ where: { id: result.id } });
        if (finalApp) {
          const allDone = finalApp.faceStatus !== 'PENDING' && finalApp.faceStatus !== 'PROCESSING' &&
            (!frontDoc || finalApp.ocrFrontStatus !== 'PENDING') && finalApp.ocrFrontStatus !== 'PROCESSING' &&
            (!backDoc || finalApp.ocrBackStatus !== 'PENDING') && finalApp.ocrBackStatus !== 'PROCESSING';
          const anyFailed = finalApp.faceStatus === 'FAILED' || finalApp.ocrFrontStatus === 'FAILED' || finalApp.ocrBackStatus === 'FAILED';
          await prisma.kycApplication.update({
            where: { id: result.id },
            data: {
              processingStatus: anyFailed ? 'FAILED' : allDone ? 'DONE' : 'PROCESSING',
              workflowStage: allDone ? 'COMPLETE' : finalApp.workflowStage,
            },
          });
        }

        logger.info({ kycId: result.id }, 'Background face-first processing complete');
      } catch (bgError: unknown) {
        logger.error({ err: bgError, kycId: result.id }, 'Background face-first processing failed');
        await prisma.kycApplication.update({
          where: { id: result.id },
          data: {
            processingStatus: 'FAILED',
            ocrProcessingError: bgError instanceof Error ? bgError.message : 'Background processing failed',
          },
        }).catch((e: unknown) => logger.error({ err: e }, 'Failed to store background error'));
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/v1/kyc/status
 * Get current user's KYC status
 */
export const getKycStatus = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json(apiResponse.error('Authentication required', 401));
      return;
    }

    const kyc = await kycService.getKycStatus(req.user.id);

    if (!kyc) {
      return res.json(
        apiResponse.success('No KYC application found', null)
      );
    }

    res.json(apiResponse.success('KYC status retrieved', kyc));
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/v1/kyc
 * List all KYC applications (admin/reviewer)
 */
export const listKycApplications = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { skip, take, page, limit } = paginate(req.query);
    const status = (req.query.status as string) || undefined;
    const search = (req.query.search as string) || undefined;

    const { applications, total } = await kycService.listKycApplications(
      take,
      skip,
      status,
      search
    );

    res.json(
      apiResponse.paginated(
        'KYC applications listed successfully',
        applications,
        page,
        limit,
        total
      )
    );
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/v1/kyc/:id
 * Get a specific KYC application (admin/reviewer)
 */
export const getKycById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;

    const kyc = await kycService.getKycById(id);

    res.json(apiResponse.success('KYC application retrieved', kyc));
  } catch (error) {
    next(error);
  }
};

/**
 * PATCH /api/v1/kyc/:id/approve
 * Approve a KYC application
 */
export const approveKyc = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json(apiResponse.error('Authentication required', 401));
      return;
    }

    const { id } = req.params;

    const result = await kycService.approveKyc(id, req.user.id);

    // Log KYC approval
    await auditService.log({
      userId: req.user.id,
      action: 'APPROVE_KYC',
      metadata: {
        kycId: id,
        targetUserId: result.userId,
      },
      ip: req.ip || undefined,
      userAgent: req.headers['user-agent'],
    });

    res.json(apiResponse.success('KYC application approved', result));
  } catch (error) {
    next(error);
  }
};

/**
 * PATCH /api/v1/kyc/:id/reject
 * Reject a KYC application
 */
export const rejectKyc = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json(apiResponse.error('Authentication required', 401));
      return;
    }

    const { id } = req.params;
    const { rejectionReason } = req.body;

    const result = await kycService.rejectKyc(id, req.user.id, rejectionReason);

    // Log KYC rejection
    await auditService.log({
      userId: req.user.id,
      action: 'REJECT_KYC',
      metadata: {
        kycId: id,
        targetUserId: result.userId,
        rejectionReason,
      },
      ip: req.ip || undefined,
      userAgent: req.headers['user-agent'],
    });

    res.json(apiResponse.success('KYC application rejected', result));
  } catch (error) {
    next(error);
  }
};

/**
 * PATCH /api/v1/kyc/:id/request-resubmit
 * Request resubmission of KYC application
 */
export const requestKycResubmit = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json(apiResponse.error('Authentication required', 401));
      return;
    }

    const { id } = req.params;
    const { note } = req.body;

    const result = await kycService.requestResubmit(id, req.user.id, note);

    // Log resubmit request
    await auditService.log({
      userId: req.user.id,
      action: 'REQUEST_RESUBMIT_KYC',
      metadata: {
        kycId: id,
        targetUserId: result.userId,
        note,
      },
      ip: req.ip || undefined,
      userAgent: req.headers['user-agent'],
    });

    res.json(apiResponse.success('Resubmission requested', result));
  } catch (error) {
    next(error);
  }
};
