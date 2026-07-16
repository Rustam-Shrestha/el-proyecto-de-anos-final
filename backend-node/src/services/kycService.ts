import { prisma } from '@/config/database';
import { logger } from '@/config/logger';
import { AppError } from '@/utils/AppError';
import { mailService } from '@/services/mailService';

export interface SubmitKycInput {
  userId: string;
  documents: Array<{
    type: string;
    filePath: string;
    mimeType: string;
    sizeBytes: number;
  }>;
}

export interface KycApplicationDetail {
  id: string;
  userId: string;
  userEmail?: string;
  applicantEmail?: string;
  status: string;
  submittedAt: Date;
  reviewedAt: Date | null;
  reviewerId: string | null;
  rejectionReason: string | null;
  documents: Array<{
    id: string;
    type: string;
    filePath: string;
    mimeType: string;
    sizeBytes: number;
    verificationStatus?: string;
    createdAt?: Date;
  }>;
  createdAt: Date;
  updatedAt: Date;
}

function formatKycDocument(doc: any) {
  return {
    id: doc.id,
    type: doc.documentType ?? doc.type,
    filePath: doc.filePath,
    mimeType: doc.fileMimeType ?? doc.mimeType,
    sizeBytes: doc.fileSize ?? doc.sizeBytes,
    verificationStatus: doc.verificationStatus ?? 'PENDING',
    createdAt: doc.createdAt ?? doc.uploadedAt,
  };
}

function formatKycApplication(kyc: any, userEmail?: string) {
  if (!kyc) return null;
  const user = kyc.user as { email?: string } | undefined;
  const email = userEmail ?? user?.email;
  return {
    ...kyc,
    userEmail: email,
    applicantEmail: email,
    documents: (kyc.documents ?? []).map(formatKycDocument),
  } as KycApplicationDetail;
}

export const kycService = {
  /**
   * Submit a new KYC application
   */
  async submitKyc(input: SubmitKycInput): Promise<KycApplicationDetail> {
    try {
      const user = await prisma.user.findUnique({
        where: { id: input.userId },
        include: { profile: true },
      });

      if (!user) {
        throw new AppError('User not found', 404);
      }

      // Check for existing active KYC application
      const existingKyc = await prisma.kycApplication.findFirst({
        where: {
          userId: input.userId,
          status: {
            in: ['PENDING', 'UNDER_REVIEW'],
          },
        },
      });

      if (existingKyc) {
        throw new AppError('You already have an active KYC application', 409);
      }

      // Create KYC application
      const kyc = await prisma.kycApplication.create({
        data: {
          userId: input.userId,
          status: 'PENDING',
          documents: {
            create: input.documents.map((doc) => ({
              userId: input.userId,
              documentType: doc.type,
              filePath: doc.filePath,
              fileMimeType: doc.mimeType,
              fileSize: doc.sizeBytes,
              version: 1,
            })),
          },
        },
        include: {
          documents: {
            select: {
              id: true,
              documentType: true,
              filePath: true,
              fileMimeType: true,
              fileSize: true,
            },
          },
        },
      });

      logger.info({ userId: input.userId, kycId: kyc.id }, 'KYC application submitted');

      return { ...kyc, userEmail: user.email, applicantEmail: user.email, documents: kyc.documents.map((d: any) => ({ id: d.id, type: d.documentType, filePath: d.filePath, mimeType: d.fileMimeType, sizeBytes: d.fileSize, verificationStatus: 'PENDING', createdAt: new Date() })) } as KycApplicationDetail;
    } catch (error) {
      if (error instanceof AppError) throw error;
      logger.error({ err: error, userId: input.userId }, 'Failed to submit KYC');
      throw new AppError(
        `Failed to submit KYC application: ${error instanceof Error ? error.message : 'Unknown error'}`,
        500
      );
    }
  },

  /**
   * Get user's KYC status
   */
  async getKycStatus(userId: string): Promise<KycApplicationDetail | null> {
    try {
      const kyc = await prisma.kycApplication.findFirst({
        where: { userId },
        orderBy: { createdAt: 'desc' },
          include: {
            documents: {
              select: {
                id: true,
                documentType: true,
                filePath: true,
                fileMimeType: true,
                fileSize: true,
                verificationStatus: true,
                createdAt: true,
              },
            },
            user: {
              select: { email: true },
            },
            ocrResults: true,
            ocrExtractions: {
              orderBy: { createdAt: 'desc' },
            },
            extractionVerification: true,
            faceVerification: true,
            submissionFile: true,
          },
      });

      if (!kyc) return null;

      return {
        ...formatKycApplication(kyc)!,
        ocrResults: kyc.ocrResults || [],
        ocrExtractions: kyc.ocrExtractions || [],
        extractionVerification: kyc.extractionVerification || null,
        faceVerification: kyc.faceVerification || null,
        ocrFullName: kyc.ocrFullName,
        ocrCitizenshipNumber: kyc.ocrCitizenshipNumber,
        ocrDateOfBirth: kyc.ocrDateOfBirth,
        ocrGender: kyc.ocrGender,
        ocrAddress: kyc.ocrAddress,
        confirmedFullName: kyc.confirmedFullName,
        confirmedCitizenshipNumber: kyc.confirmedCitizenshipNumber,
        confirmedDateOfBirth: kyc.confirmedDateOfBirth,
        confirmedGender: kyc.confirmedGender,
        confirmedAddress: kyc.confirmedAddress,
        confirmedPhoneNumber: kyc.confirmedPhoneNumber,
        confirmedEmail: kyc.confirmedEmail,
        processingStatus: kyc.processingStatus,
        ocrFrontStatus: kyc.ocrFrontStatus,
        ocrBackStatus: kyc.ocrBackStatus,
        faceStatus: kyc.faceStatus,
        ocrProcessingError: kyc.ocrProcessingError,
        faceProcessingError: kyc.faceProcessingError,
        workflowStage: kyc.workflowStage,
        faceVerificationStatus: kyc.faceVerificationStatus,
        ocrProcessingStatus: kyc.ocrProcessingStatus,
        queuedForManualReview: kyc.queuedForManualReview,
      } as any;
    } catch (error) {
      if (error instanceof AppError) throw error;
      logger.error({ err: error, userId }, 'Failed to get KYC status');
      throw new AppError(
        `Failed to fetch KYC status: ${error instanceof Error ? error.message : 'Unknown error'}`,
        500
      );
    }
  },

  /**
   * Get single KYC application by ID
   */
  async getKycById(kycId: string): Promise<any> {
    try {
      const kyc = await prisma.kycApplication.findUnique({
        where: { id: kycId },
        include: {
          documents: {
            select: {
              id: true,
              documentType: true,
              filePath: true,
              fileMimeType: true,
              fileSize: true,
              verificationStatus: true,
              createdAt: true,
            },
          },
          user: {
            select: {
              id: true,
              email: true,
              profile: {
                select: {
                  fullName: true,
                },
              },
            },
          },
          ocrResults: true,
          ocrExtractions: {
            orderBy: { createdAt: 'desc' },
          },
          extractionVerification: true,
          faceVerification: true,
          verificationReport: true,
          submissionFile: true,
        },
      });

      if (!kyc) {
        throw new AppError('KYC application not found', 404);
      }

      return {
        ...formatKycApplication(kyc),
        ocrResults: kyc.ocrResults || [],
        ocrExtractions: kyc.ocrExtractions || [],
        extractionVerification: kyc.extractionVerification || null,
        faceVerification: kyc.faceVerification || null,
        verificationReport: kyc.verificationReport || null,
        submissionFile: kyc.submissionFile || null,
        ocrFullName: kyc.ocrFullName,
        ocrCitizenshipNumber: kyc.ocrCitizenshipNumber,
        ocrDateOfBirth: kyc.ocrDateOfBirth,
        ocrGender: kyc.ocrGender,
        ocrAddress: kyc.ocrAddress,
        confirmedFullName: kyc.confirmedFullName,
        confirmedCitizenshipNumber: kyc.confirmedCitizenshipNumber,
        confirmedDateOfBirth: kyc.confirmedDateOfBirth,
        confirmedGender: kyc.confirmedGender,
        confirmedAddress: kyc.confirmedAddress,
        confirmedPhoneNumber: kyc.confirmedPhoneNumber,
        confirmedEmail: kyc.confirmedEmail,
        processingStatus: kyc.processingStatus,
        ocrFrontStatus: kyc.ocrFrontStatus,
        ocrBackStatus: kyc.ocrBackStatus,
        faceStatus: kyc.faceStatus,
        ocrProcessingError: kyc.ocrProcessingError,
        faceProcessingError: kyc.faceProcessingError,
        workflowStage: kyc.workflowStage,
        faceVerificationStatus: kyc.faceVerificationStatus,
        ocrProcessingStatus: kyc.ocrProcessingStatus,
        queuedForManualReview: kyc.queuedForManualReview,
      };
    } catch (error) {
      if (error instanceof AppError) throw error;
      logger.error({ err: error, kycId }, 'Failed to get KYC by ID');
      throw new AppError(
        `Failed to fetch KYC application: ${error instanceof Error ? error.message : 'Unknown error'}`,
        500
      );
    }
  },

  /**
   * List KYC applications (admin/reviewer)
   */
  async listKycApplications(
    limit: number = 10,
    offset: number = 0,
    status?: string,
    search?: string
  ): Promise<{ applications: any[]; total: number }> {
    try {
      const where: any = {};

      if (status) {
        where.status = status;
      }

      if (search) {
        where.user = {
          OR: [
            { email: { contains: search, mode: 'insensitive' } },
            { profile: { fullName: { contains: search, mode: 'insensitive' } } },
          ],
        };
      }

      const [applications, total] = await Promise.all([
        prisma.kycApplication.findMany({
          where,
          include: {
            user: {
              select: {
                id: true,
                email: true,
                profile: {
                  select: {
                    fullName: true,
                  },
                },
              },
            },
            documents: {
              select: {
                id: true,
                documentType: true,
                filePath: true,
                fileMimeType: true,
                fileSize: true,
                verificationStatus: true,
                createdAt: true,
              },
            },
          },
          orderBy: { createdAt: 'desc' },
          take: limit,
          skip: offset,
        }),
        prisma.kycApplication.count({ where }),
      ]);

      return {
        applications: applications.map((a) => formatKycApplication(a)),
        total,
      };
    } catch (error) {
      if (error instanceof AppError) throw error;
      logger.error({ err: error }, 'Failed to list KYC applications');
      throw new AppError(
        `Failed to fetch KYC applications: ${error instanceof Error ? error.message : 'Unknown error'}`,
        500
      );
    }
  },

  /**
   * Approve KYC application
   */
  async approveKyc(kycId: string, reviewerId: string): Promise<KycApplicationDetail> {
    try {
      const kyc = await prisma.kycApplication.findUnique({
        where: { id: kycId },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              profile: {
                select: {
                  fullName: true,
                },
              },
            },
          },
          documents: {
            select: {
              id: true,
              documentType: true,
              filePath: true,
              fileMimeType: true,
              fileSize: true,
              verificationStatus: true,
              createdAt: true,
            },
          },
        },
      });

      if (!kyc) {
        throw new AppError('KYC application not found', 404);
      }

      if (kyc.status === 'APPROVED') {
        throw new AppError('KYC application is already approved', 400);
      }

      const updated = await prisma.kycApplication.update({
        where: { id: kycId },
        data: {
          status: 'APPROVED',
          reviewedAt: new Date(),
          reviewerId,
        },
        include: {
          documents: {
            select: {
              id: true,
              documentType: true,
              filePath: true,
              fileMimeType: true,
              fileSize: true,
              verificationStatus: true,
              createdAt: true,
            },
          },
        },
      });

      // Send approval email (fire-and-forget)
      await mailService.sendKycApprovedMail(
        kyc.user.email,
        kyc.user.profile?.fullName
      );

      logger.info(
        { kycId, userId: kyc.userId, reviewerId },
        'KYC application approved'
      );

      return formatKycApplication(updated) as KycApplicationDetail;
    } catch (error) {
      if (error instanceof AppError) throw error;
      logger.error({ err: error, kycId }, 'Failed to approve KYC');
      throw new AppError(
        `Failed to approve KYC application: ${error instanceof Error ? error.message : 'Unknown error'}`,
        500
      );
    }
  },

  /**
   * Reject KYC application
   */
  async rejectKyc(
    kycId: string,
    reviewerId: string,
    rejectionReason: string
  ): Promise<KycApplicationDetail> {
    try {
      const kyc = await prisma.kycApplication.findUnique({
        where: { id: kycId },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              profile: {
                select: {
                  fullName: true,
                },
              },
            },
          },
          documents: {
            select: {
              id: true,
              documentType: true,
              filePath: true,
              fileMimeType: true,
              fileSize: true,
              verificationStatus: true,
              createdAt: true,
            },
          },
        },
      });

      if (!kyc) {
        throw new AppError('KYC application not found', 404);
      }

      if (kyc.status === 'REJECTED') {
        throw new AppError('KYC application is already rejected', 400);
      }

      const updated = await prisma.kycApplication.update({
        where: { id: kycId },
        data: {
          status: 'REJECTED',
          reviewedAt: new Date(),
          reviewerId,
          rejectionReason,
        },
        include: {
          documents: {
            select: {
              id: true,
              documentType: true,
              filePath: true,
              fileMimeType: true,
              fileSize: true,
              verificationStatus: true,
              createdAt: true,
            },
          },
        },
      });

      // Send rejection email (fire-and-forget)
      await mailService.sendKycRejectedMail(
        kyc.user.email,
        kyc.user.profile?.fullName,
        rejectionReason
      );

      logger.info(
        { kycId, userId: kyc.userId, reviewerId, rejectionReason },
        'KYC application rejected'
      );

      return formatKycApplication(updated) as KycApplicationDetail;
    } catch (error) {
      if (error instanceof AppError) throw error;
      logger.error({ err: error, kycId }, 'Failed to reject KYC');
      throw new AppError(
        `Failed to reject KYC application: ${error instanceof Error ? error.message : 'Unknown error'}`,
        500
      );
    }
  },

  /**
   * Request resubmission of KYC application
   */
  async requestResubmit(kycId: string, reviewerId: string, note: string): Promise<KycApplicationDetail> {
    try {
      const kyc = await prisma.kycApplication.findUnique({
        where: { id: kycId },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              profile: {
                select: {
                  fullName: true,
                },
              },
            },
          },
          documents: {
            select: {
              id: true,
              documentType: true,
              filePath: true,
              fileMimeType: true,
              fileSize: true,
              verificationStatus: true,
              createdAt: true,
            },
          },
        },
      });

      if (!kyc) {
        throw new AppError('KYC application not found', 404);
      }

      if (kyc.status === 'RESUBMIT_REQUIRED') {
        throw new AppError('Resubmission already requested for this KYC', 400);
      }

      const updated = await prisma.kycApplication.update({
        where: { id: kycId },
        data: {
          status: 'RESUBMIT_REQUIRED',
          reviewedAt: new Date(),
          reviewerId,
          rejectionReason: note,
        },
        include: {
          documents: {
            select: {
              id: true,
              documentType: true,
              filePath: true,
              fileMimeType: true,
              fileSize: true,
              verificationStatus: true,
              createdAt: true,
            },
          },
        },
      });

      // Send resubmit request email (fire-and-forget)
      await mailService.sendKycResubmitMail(
        kyc.user.email,
        kyc.user.profile?.fullName,
        note
      );

      logger.info(
        { kycId, userId: kyc.userId, reviewerId },
        'KYC resubmission requested'
      );

      return formatKycApplication(updated) as KycApplicationDetail;
    } catch (error) {
      if (error instanceof AppError) throw error;
      logger.error({ err: error, kycId }, 'Failed to request resubmission');
      throw new AppError('Failed to request resubmission', 500);
    }
  },

  async submitKycWithConfirmedData(kycApplicationId: string, data: {
    confirmedCitizenshipNumber?: string,
    confirmedFullName?: string,
    confirmedDateOfBirth?: string,
    confirmedGender?: string,
    confirmedAddress?: string,
    confirmedPhoneNumber?: string,
    confirmedEmail?: string,
    confirmedOccupation?: string,
    confirmedEmployer?: string,
    confirmedMonthlyIncome?: number,
    confirmedMaritalStatus?: string,
    confirmedEducationLevel?: string
  }) {
    return await prisma.kycApplication.update({
      where: { id: kycApplicationId },
      data: {
        ...data,
        status: 'UNDER_REVIEW'
      }
    });
  },
};
