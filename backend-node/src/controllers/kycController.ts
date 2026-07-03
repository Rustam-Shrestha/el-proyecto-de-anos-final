import type { Request, Response, NextFunction } from 'express';
import { kycService } from '@/services/kycService';
import { userService } from '@/services/userService';
import { auditService } from '@/services/auditService';
import { ocrService } from '@/services/ocrService';
import { faceService } from '@/services/faceService';
import { apiResponse } from '@/utils/apiResponse';
import { paginate } from '@/utils/pagination';
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
        filePath: file.path,
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

    // --- Auto-trigger OCR and Face Verification ---
    // Fire these asynchronously (non-blocking) so the response is fast
    setTimeout(async () => {
      try {
        const createdDocs = await prisma.document.findMany({
          where: { kycId: result.id },
        });

        const selfieDoc = createdDocs.find((d: any) => d.documentType === 'SELFIE');
        const citizenshipFrontDoc = createdDocs.find((d: any) => d.documentType === 'CITIZENSHIP_FRONT');
        const citizenshipBackDoc = createdDocs.find((d: any) => d.documentType === 'CITIZENSHIP_BACK');

        // 1. OCR on citizenship front document
        if (citizenshipFrontDoc) {
          try {
            const ocrResult = await ocrService.extractCitizenshipData(
              citizenshipFrontDoc.filePath,
              'citizenship_front'
            );

            await prisma.ocrResult.create({
              data: {
                kycApplicationId: result.id,
                documentType: 'CITIZENSHIP_FRONT',
                rawOcrText: ocrResult.rawText,
                extractedData: ocrResult.extractedData,
                overallConfidence: ocrResult.overallConfidence,
              },
            });

            const updateData: Record<string, string> = {};
            if (ocrResult.extractedData.name) updateData.ocrFullName = ocrResult.extractedData.name;
            if (ocrResult.extractedData.citizenshipNumber) updateData.ocrCitizenshipNumber = ocrResult.extractedData.citizenshipNumber;
            if (ocrResult.extractedData.dateOfBirth) updateData.ocrDateOfBirth = ocrResult.extractedData.dateOfBirth;
            if (ocrResult.extractedData.gender) updateData.ocrGender = ocrResult.extractedData.gender;
            if (ocrResult.extractedData.address) updateData.ocrAddress = ocrResult.extractedData.address;
            if (Object.keys(updateData).length > 0) {
              await prisma.kycApplication.update({
                where: { id: result.id },
                data: updateData,
              });
            }
          } catch (error) {
            logger.error({ err: error, kycId: result.id }, 'OCR processing failed for citizenship front');
          }
        }

        // 2. OCR on citizenship back document
        if (citizenshipBackDoc) {
          try {
            const ocrResult = await ocrService.extractCitizenshipData(
              citizenshipBackDoc.filePath,
              'citizenship_back'
            );

            await prisma.ocrResult.create({
              data: {
                kycApplicationId: result.id,
                documentType: 'CITIZENSHIP_BACK',
                rawOcrText: ocrResult.rawText,
                extractedData: ocrResult.extractedData,
                overallConfidence: ocrResult.overallConfidence,
              },
            });
          } catch (error) {
            logger.error({ err: error, kycId: result.id }, 'OCR processing failed for citizenship back');
          }
        }

        // 3. Face verification (selfie vs citizenship front)
        if (selfieDoc && citizenshipFrontDoc) {
          try {
            const faceResult = await faceService.verifyFace(
              citizenshipFrontDoc.filePath,
              selfieDoc.filePath
            );

            await prisma.faceVerification.upsert({
              where: { kycApplicationId: result.id },
              update: {
                citizenshipPhotoPath: citizenshipFrontDoc.filePath,
                selfiePhotoPath: selfieDoc.filePath,
                similarityScore: faceResult.similarityScore,
                status: faceResult.status,
                recommendation: faceResult.recommendation,
              },
              create: {
                kycApplicationId: result.id,
                citizenshipPhotoPath: citizenshipFrontDoc.filePath,
                selfiePhotoPath: selfieDoc.filePath,
                similarityScore: faceResult.similarityScore,
                status: faceResult.status,
                recommendation: faceResult.recommendation,
              },
            });
          } catch (error) {
            logger.error({ err: error, kycId: result.id }, 'Face verification failed');
          }
        }
      } catch (error) {
        logger.error({ err: error, kycId: result.id }, 'Background KYC processing failed');
      }
    }, 0);
    // --- End auto-trigger ---

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
