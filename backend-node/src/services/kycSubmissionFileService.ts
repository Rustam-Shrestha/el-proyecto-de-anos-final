import { Prisma } from '@prisma/client';
import { prisma } from '@/config/database';
import { AppError } from '@/utils/AppError';
import { logger } from '@/config/logger';

export const kycSubmissionFileService = {
  async createSubmissionFile(kycApplicationId: string): Promise<Prisma.KYCSubmissionFileGetPayload<{}>> {
    try {
      const kyc = await prisma.kycApplication.findUnique({
        where: { id: kycApplicationId },
        include: {
          documents: true,
          faceVerification: true,
          user: { select: { email: true } },
        },
      });

      if (!kyc) throw new AppError('KYC application not found', 404);
      if (!kyc.faceVerification) throw new AppError('Face verification must complete before creating submission file', 400);

      const snapshotData = {
        userId: kyc.userId,
        userEmail: kyc.user.email,
        status: kyc.status,
        documents: kyc.documents.map((d: Prisma.DocumentGetPayload<{}>) => ({
          type: d.documentType,
          filePath: d.filePath,
          mimeType: d.fileMimeType,
          sizeBytes: d.fileSize,
        })),
        faceVerification: {
          similarityScore: kyc.faceVerification.similarityScore,
          status: kyc.faceVerification.status,
          recommendation: kyc.faceVerification.recommendation,
        },
        ocrPrefill: {
          fullName: kyc.ocrFullName,
          citizenshipNumber: kyc.ocrCitizenshipNumber,
          dateOfBirth: kyc.ocrDateOfBirth,
          gender: kyc.ocrGender,
          address: kyc.ocrAddress,
        },
        createdAt: new Date().toISOString(),
      };

      return await prisma.kYCSubmissionFile.upsert({
        where: { kycApplicationId },
        update: {
          status: 'CREATED',
          snapshotData,
          faceSimilarity: kyc.faceVerification.similarityScore,
          faceStatusAtCreation: kyc.faceVerification.status,
          ocrStatusAtCreation: kyc.ocrProcessingStatus,
        },
        create: {
          kycApplicationId,
          status: 'CREATED',
          snapshotData,
          faceSimilarity: kyc.faceVerification.similarityScore,
          faceStatusAtCreation: kyc.faceVerification.status,
          ocrStatusAtCreation: kyc.ocrProcessingStatus,
        },
      });
    } catch (error) {
      if (error instanceof AppError) throw error;
      logger.error({ err: error, kycApplicationId }, 'Failed to create submission file');
      throw new AppError('Failed to create submission file', 500);
    }
  },

  async getSubmissionFile(kycApplicationId: string): Promise<Prisma.KYCSubmissionFileGetPayload<{}>> {
    const file = await prisma.kYCSubmissionFile.findUnique({
      where: { kycApplicationId },
    });
    if (!file) throw new AppError('Submission file not found', 404);
    return file;
  },
};
