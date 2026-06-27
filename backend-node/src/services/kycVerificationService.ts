import { prisma } from '@/config/database';
import { AppError } from '@/utils/AppError';
import { logger } from '@/config/logger';

export const kycVerificationService = {
  async generateVerificationReport(kycApplicationId: string): Promise<any> {
    try {
      const kyc = await prisma.kycApplication.findUnique({
        where: { id: kycApplicationId },
        include: {
          ocrResults: true,
          faceVerification: true
        }
      });

      if (!kyc) throw new AppError('KYC application not found', 404);

      let fieldsCorrected = 0;
      const possibleMismatches: string[] = [];

      if (kyc.ocrCitizenshipNumber && kyc.confirmedCitizenshipNumber &&
          kyc.ocrCitizenshipNumber !== kyc.confirmedCitizenshipNumber) {
        fieldsCorrected++;
        possibleMismatches.push('Citizenship Number');
      }

      if (kyc.ocrFullName && kyc.confirmedFullName &&
          kyc.ocrFullName.toLowerCase() !== kyc.confirmedFullName.toLowerCase()) {
        fieldsCorrected++;
        possibleMismatches.push('Full Name');
      }

      if (kyc.ocrDateOfBirth && kyc.confirmedDateOfBirth &&
          kyc.ocrDateOfBirth !== kyc.confirmedDateOfBirth) {
        fieldsCorrected++;
        possibleMismatches.push('Date of Birth');
      }

      const faceScore = kyc.faceVerification?.similarityScore || 0;
      const ocrScore = kyc.ocrResults?.[0]?.overallConfidence || 0;
      const ocrConfidence = ocrScore * 100;
      const faceSimilarity = faceScore * 100;

      const manualReviewSuggested =
        ocrConfidence < 80 ||
        faceSimilarity < 85 ||
        possibleMismatches.length > 0;

      const report = {
        faceSimilarity: faceSimilarity.toFixed(2),
        ocrConfidence: ocrConfidence.toFixed(2),
        fieldsCorrected,
        possibleMismatches,
        manualReviewSuggested
      };

      return await prisma.verificationReport.upsert({
        where: { kycApplicationId },
        update: {
          faceSimilarity: faceScore,
          ocrConfidence: ocrScore,
          fieldsCorrected,
          possibleMismatches,
          manualReviewSuggested,
          report: JSON.stringify(report)
        },
        create: {
          kycApplicationId,
          faceSimilarity: faceScore,
          ocrConfidence: ocrScore,
          fieldsCorrected,
          possibleMismatches,
          manualReviewSuggested,
          report: JSON.stringify(report)
        }
      });
    } catch (error) {
      if (error instanceof AppError) throw error;
      logger.error({ err: error, kycApplicationId }, 'Failed to generate verification report');
      throw new AppError('Failed to generate report', 500);
    }
  }
};
