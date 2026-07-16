import { prisma } from '@/config/database';
import { logger } from '@/config/logger';

interface FieldComparison {
  field: string;
  ocrValue: string | null;
  userValue: string | null;
  match: boolean;
  exactMatch: boolean;
  normalizedMatch: boolean;
  matchPercent: number;
}

interface ComparisonResult {
  fieldComparisons: FieldComparison[];
  matchScore: number;
  totalFields: number;
  matchedFields: number;
  autoVerifyEligible: boolean;
  reason: string;
}

const COMPARISON_FIELDS = [
  { ocr: 'ocrFullName', user: 'confirmedFullName', label: 'Full Name' },
  { ocr: 'ocrCitizenshipNumber', user: 'confirmedCitizenshipNumber', label: 'Citizenship Number' },
  { ocr: 'ocrDateOfBirth', user: 'confirmedDateOfBirth', label: 'Date of Birth' },
  { ocr: 'ocrGender', user: 'confirmedGender', label: 'Gender' },
  { ocr: 'ocrAddress', user: 'confirmedAddress', label: 'Address' },
];

function normalizeForComparison(val: string | null | undefined): string {
  if (!val) return '';
  return val.trim().toLowerCase().replace(/\s+/g, ' ').replace(/[^a-z0-9\s\-/]/g, '');
}

function getMatchPercent(ocrVal: string | null, userVal: string | null): number {
  if (!ocrVal && !userVal) return 100;
  if (!ocrVal || !userVal) return 0;
  const o = normalizeForComparison(ocrVal);
  const u = normalizeForComparison(userVal);
  if (o === u) return 100;
  const minLen = Math.min(o.length, u.length);
  if (minLen === 0) return 0;
  let matches = 0;
  for (let i = 0; i < minLen; i++) {
    if (o[i] === u[i]) matches++;
  }
  return Math.round((matches / Math.max(o.length, u.length)) * 100);
}

function compareOcrWithUserData(kyc: any): ComparisonResult {
  const fieldComparisons: FieldComparison[] = [];
  let totalMatchPercent = 0;
  let fieldsWithBothValues = 0;

  for (const field of COMPARISON_FIELDS) {
    const ocrVal = (kyc as any)[field.ocr] || null;
    const userVal = (kyc as any)[field.user] || null;

    if (userVal === null) continue;

    const normalizedOcr = normalizeForComparison(ocrVal);
    const normalizedUser = normalizeForComparison(userVal);
    const exactMatch = normalizedOcr === normalizedUser;
    const normalizedMatch = exactMatch;
    const matchPercent = getMatchPercent(ocrVal, userVal);

    fieldComparisons.push({
      field: field.label,
      ocrValue: ocrVal,
      userValue: userVal,
      match: matchPercent >= 90,
      exactMatch,
      normalizedMatch,
      matchPercent,
    });

    totalMatchPercent += matchPercent;
    fieldsWithBothValues++;
  }

  const matchScore = fieldsWithBothValues > 0
    ? Math.round(totalMatchPercent / fieldsWithBothValues)
    : 0;

  const matchedFields = fieldComparisons.filter(f => f.match).length;

  let reason: string;
  let autoVerifyEligible: boolean;

  const ocrConfidence = kyc.ocrResults?.[0]?.overallConfidence || 0;

  if (fieldsWithBothValues === 0) {
    autoVerifyEligible = false;
    reason = 'No user confirmed data to compare';
  } else if (ocrConfidence < 0.85) {
    autoVerifyEligible = false;
    reason = `OCR confidence too low (${Math.round(ocrConfidence * 100)}% < 85%)`;
  } else if (matchScore < 90) {
    autoVerifyEligible = false;
    reason = `Data match score too low (${matchScore}% < 90%)`;
  } else {
    autoVerifyEligible = true;
    reason = `All criteria met: OCR ${Math.round(ocrConfidence * 100)}% confidence, ${matchScore}% data match`;
  }

  return {
    fieldComparisons,
    matchScore,
    totalFields: fieldsWithBothValues,
    matchedFields,
    autoVerifyEligible,
    reason,
  };
}

export const extractionVerificationService = {
  async storeExtraction(kycApplicationId: string, documentType: string, ocrResult: {
    rawText: string;
    extractedData: Record<string, any>;
    overallConfidence: number;
    error?: string;
  }) {
    const extraction = await prisma.ocrExtraction.create({
      data: {
        kycApplicationId,
        documentType,
        rawText: ocrResult.rawText || '',
        extractedFields: ocrResult.extractedData || {},
        overallConfidence: ocrResult.overallConfidence || 0,
      },
    });
    logger.info({ extractionId: extraction.id, kycApplicationId }, 'OCR extraction stored');
    return extraction;
  },

  async runVerification(kycApplicationId: string) {
    const kyc = await prisma.kycApplication.findUnique({
      where: { id: kycApplicationId },
      include: {
        ocrResults: { orderBy: { createdAt: 'desc' }, take: 1 },
      },
    });

    if (!kyc) {
      logger.warn({ kycApplicationId }, 'KYC not found for verification');
      return null;
    }

    const comparison = compareOcrWithUserData(kyc);

    const hasUserData = COMPARISON_FIELDS.some(
      f => (kyc as any)[f.user] !== null
    );

    if (!hasUserData) {
      logger.info({ kycApplicationId }, 'No user confirmed data yet, skipping verification');
      return null;
    }

    const ocrConfidence = kyc.ocrResults?.[0]?.overallConfidence || 0;

    const existingVerification = await prisma.extractionVerification.findUnique({
      where: { kycApplicationId },
    });
    if (existingVerification) {
      logger.info({ kycApplicationId }, 'Verification already exists and is locked');
      return existingVerification;
    }

    const verification = await prisma.extractionVerification.create({
      data: {
        kycApplicationId,
        decision: comparison.autoVerifyEligible ? 'AUTO_VERIFIED' : 'QUEUED_FOR_REVIEW',
        ocrConfidence,
        matchScore: comparison.matchScore,
        autoVerified: comparison.autoVerifyEligible,
        manualReviewAdded: !comparison.autoVerifyEligible,
        decisionDetails: comparison,
        verifiedAt: new Date(),
        verifiedBy: 'system',
        locked: true,
      },
    });

    if (comparison.autoVerifyEligible) {
      await prisma.kycApplication.update({
        where: { id: kycApplicationId },
        data: {
          status: 'APPROVED',
          processingStatus: 'DONE',
          workflowStage: 'COMPLETE',
        },
      });
      logger.info({ kycApplicationId, matchScore: comparison.matchScore }, 'KYC auto-verified via OCR');
    } else {
      const pendingQueue = await prisma.manualReviewQueue.findFirst({
        where: { kycApplicationId, status: 'PENDING' },
      });
      if (!pendingQueue) {
        await prisma.manualReviewQueue.create({
          data: {
            kycApplicationId,
            reason: comparison.matchScore < 90 ? 'LOW_OCR_CONFIDENCE' : 'OCR_PROCESSING_ERROR',
            details: comparison.reason,
            priority: comparison.matchScore < 50 ? 'HIGH' : 'NORMAL',
          },
        });
      }
      await prisma.kycApplication.update({
        where: { id: kycApplicationId },
        data: {
          queuedForManualReview: true,
          status: 'UNDER_REVIEW',
          processingStatus: 'DONE',
          workflowStage: 'COMPLETE',
        },
      });
      logger.info({ kycApplicationId, reason: comparison.reason }, 'KYC queued for manual review');
    }

    await prisma.kycApplication.update({
      where: { id: kycApplicationId },
      data: { ocrProcessingStatus: 'EXTRACTED' },
    });

    return verification;
  },

  async getVerification(kycApplicationId: string) {
    return prisma.extractionVerification.findUnique({
      where: { kycApplicationId },
    });
  },

  async getExtractions(kycApplicationId: string) {
    return prisma.ocrExtraction.findMany({
      where: { kycApplicationId },
      orderBy: { createdAt: 'desc' },
    });
  },
};
