import { Prisma } from '@prisma/client';
import { prisma } from '@/config/database';
import { logger } from '@/config/logger';
import { AppError } from '@/utils/AppError';
import { mailService } from '@/services/mailService';
import { notificationService } from '@/services/notificationService';

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

interface KycDocumentLike {
  id: string;
  documentType?: string | null;
  type?: string | null;
  filePath: string;
  fileMimeType?: string | null;
  mimeType?: string | null;
  fileSize?: number | null;
  sizeBytes?: number | null;
  verificationStatus?: string | null;
  createdAt?: Date | null;
  uploadedAt?: Date | null;
  [key: string]: unknown;
}

function formatKycDocument(doc: KycDocumentLike) {
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

function formatKycApplication(kyc: {
  user?: { email?: string } | null;
  documents?: KycDocumentLike[];
  [key: string]: unknown;
} | null, userEmail?: string) {
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

function isTenantSchemaError(e: unknown): boolean {
  const code = (e as { code?: string })?.code;
  const msg = String((e as { message?: string })?.message ?? (e as Error)?.message ?? "");
  return code === "P2021" || code === "P2022" || msg.includes("tenantId") || msg.includes("tenant_id") || msg.includes("does not exist");
}

function resolveTid(tenantId?: number): number {
  if (tenantId === undefined || tenantId === null) {
    logger.warn("kycService: tenantId not provided, falling back to 1");
    return 1;
  }
  return tenantId;
}

export const kycService = {
  /**
   * Submit a new KYC application
   */
  async submitKyc(input: SubmitKycInput, tenantId?: number): Promise<KycApplicationDetail> {
    try {
      const tid = resolveTid(tenantId);
      const user = await prisma.user.findUnique({
        where: { id: input.userId },
        include: { profile: true },
      });

      if (!user) {
        throw new AppError('User not found', 404);
      }

      // Check for existing active or approved KYC application (tenant scoped)
      let existingKyc: Awaited<ReturnType<typeof prisma.kycApplication.findFirst>>;
      try {
        existingKyc = await prisma.kycApplication.findFirst({
          where: {
            userId: input.userId,
            tenantId: tid,
            status: {
              in: ['PENDING', 'UNDER_REVIEW', 'APPROVED'],
            },
          },
        });
      } catch (e) {
        if (isTenantSchemaError(e)) {
          existingKyc = await prisma.kycApplication.findFirst({
            where: {
              userId: input.userId,
              status: { in: ['PENDING', 'UNDER_REVIEW', 'APPROVED'] },
            },
          });
        } else throw e;
      }

      if (existingKyc) {
        if (existingKyc.status === 'APPROVED') {
          throw new AppError('Your KYC is already approved. You do not need to submit again.', 409);
        }
        throw new AppError('You already have an active KYC application', 409);
      }

      // Create KYC application
      let kyc: Awaited<ReturnType<typeof prisma.kycApplication.create>>;
      try {
        kyc = await prisma.kycApplication.create({
          data: {
            tenantId: tid,
            userId: input.userId,
            status: 'PENDING',
            documents: {
              create: input.documents.map((doc) => ({
                tenantId: tid,
                userId: input.userId,
                documentType: doc.type as never,
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
      } catch (e) {
        if (isTenantSchemaError(e)) {
          kyc = await prisma.kycApplication.create({
            data: {
              userId: input.userId,
              status: 'PENDING',
              documents: {
                create: input.documents.map((doc) => ({
                  userId: input.userId,
                  documentType: doc.type as never,
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
        } else throw e;
      }

      logger.info({ userId: input.userId, tenantId: tid, kycId: kyc.id }, 'KYC application submitted');

      return { ...kyc, userEmail: user.email, applicantEmail: user.email, documents: (kyc.documents as unknown as Array<{ id: string; documentType: string; filePath: string; fileMimeType: string; fileSize: number }>).map((d) => ({ id: d.id, type: d.documentType, filePath: d.filePath, mimeType: d.fileMimeType, sizeBytes: d.fileSize, verificationStatus: 'PENDING', createdAt: new Date() })) } as KycApplicationDetail;
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
  async getKycStatus(userId: string, tenantId?: number): Promise<KycApplicationDetail | null> {
    try {
      const tid = resolveTid(tenantId);
      let kyc: Awaited<ReturnType<typeof prisma.kycApplication.findFirst>>;
      try {
        kyc = await prisma.kycApplication.findFirst({
          where: { userId, tenantId: tid },
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
      } catch (e) {
        if (isTenantSchemaError(e)) {
          kyc = await prisma.kycApplication.findFirst({
            where: { userId },
            orderBy: { createdAt: 'desc' },
            include: {
              documents: { select: { id: true, documentType: true, filePath: true, fileMimeType: true, fileSize: true, verificationStatus: true, createdAt: true } },
              user: { select: { email: true } },
              ocrResults: true,
              ocrExtractions: { orderBy: { createdAt: 'desc' } },
              extractionVerification: true,
              faceVerification: true,
              submissionFile: true,
            },
          });
        } else throw e;
      }

      if (!kyc) return null;

      return {
        ...formatKycApplication(kyc)!,
        ocrResults: (kyc as never as { ocrResults: unknown[] }).ocrResults || [],
        ocrExtractions: (kyc as never as { ocrExtractions: unknown[] }).ocrExtractions || [],
        extractionVerification: (kyc as never as { extractionVerification: unknown }).extractionVerification || null,
        faceVerification: (kyc as never as { faceVerification: unknown }).faceVerification || null,
        submissionFile: (kyc as never as { submissionFile: unknown }).submissionFile || null,
        ocrFullName: (kyc as never as { ocrFullName: unknown }).ocrFullName,
        ocrCitizenshipNumber: (kyc as never as { ocrCitizenshipNumber: unknown }).ocrCitizenshipNumber,
        ocrDateOfBirth: (kyc as never as { ocrDateOfBirth: unknown }).ocrDateOfBirth,
        ocrGender: (kyc as never as { ocrGender: unknown }).ocrGender,
        ocrAddress: (kyc as never as { ocrAddress: unknown }).ocrAddress,
        confirmedFullName: (kyc as never as { confirmedFullName: unknown }).confirmedFullName,
        confirmedCitizenshipNumber: (kyc as never as { confirmedCitizenshipNumber: unknown }).confirmedCitizenshipNumber,
        confirmedDateOfBirth: (kyc as never as { confirmedDateOfBirth: unknown }).confirmedDateOfBirth,
        confirmedGender: (kyc as never as { confirmedGender: unknown }).confirmedGender,
        confirmedAddress: (kyc as never as { confirmedAddress: unknown }).confirmedAddress,
        confirmedPhoneNumber: (kyc as never as { confirmedPhoneNumber: unknown }).confirmedPhoneNumber,
        confirmedEmail: (kyc as never as { confirmedEmail: unknown }).confirmedEmail,
        processingStatus: (kyc as never as { processingStatus: unknown }).processingStatus,
        ocrFrontStatus: (kyc as never as { ocrFrontStatus: unknown }).ocrFrontStatus,
        ocrBackStatus: (kyc as never as { ocrBackStatus: unknown }).ocrBackStatus,
        faceStatus: (kyc as never as { faceStatus: unknown }).faceStatus,
        ocrProcessingError: (kyc as never as { ocrProcessingError: unknown }).ocrProcessingError,
        faceProcessingError: (kyc as never as { faceProcessingError: unknown }).faceProcessingError,
        workflowStage: (kyc as never as { workflowStage: unknown }).workflowStage,
        faceVerificationStatus: (kyc as never as { faceVerificationStatus: unknown }).faceVerificationStatus,
        ocrProcessingStatus: (kyc as never as { ocrProcessingStatus: unknown }).ocrProcessingStatus,
        queuedForManualReview: (kyc as never as { queuedForManualReview: unknown }).queuedForManualReview,
      } as unknown as KycApplicationDetail;
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
  async getKycById(kycId: string, tenantId?: number): Promise<KycApplicationDetail> {
    try {
      const tid = resolveTid(tenantId);
      let kyc: Awaited<ReturnType<typeof prisma.kycApplication.findFirst>>;
      try {
        kyc = await prisma.kycApplication.findFirst({
          where: { id: kycId, tenantId: tid },
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
      } catch (e) {
        if (isTenantSchemaError(e)) {
          kyc = await prisma.kycApplication.findUnique({
            where: { id: kycId },
            include: {
              documents: { select: { id: true, documentType: true, filePath: true, fileMimeType: true, fileSize: true, verificationStatus: true, createdAt: true } },
              user: { select: { id: true, email: true, profile: { select: { fullName: true } } } },
              ocrResults: true,
              ocrExtractions: { orderBy: { createdAt: 'desc' } },
              extractionVerification: true,
              faceVerification: true,
              verificationReport: true,
              submissionFile: true,
            },
          }) as unknown as typeof kyc;
        } else throw e;
      }

      if (!kyc) {
        throw new AppError('KYC application not found', 404);
      }

      return {
        ...formatKycApplication(kyc as Parameters<typeof formatKycApplication>[0]),
        ocrResults: (kyc as never as { ocrResults: unknown[] }).ocrResults || [],
        ocrExtractions: (kyc as never as { ocrExtractions: unknown[] }).ocrExtractions || [],
        extractionVerification: (kyc as never as { extractionVerification: unknown }).extractionVerification || null,
        faceVerification: (kyc as never as { faceVerification: unknown }).faceVerification || null,
        verificationReport: (kyc as never as { verificationReport: unknown }).verificationReport || null,
        submissionFile: (kyc as never as { submissionFile: unknown }).submissionFile || null,
        ocrFullName: (kyc as never as { ocrFullName: unknown }).ocrFullName,
        ocrCitizenshipNumber: (kyc as never as { ocrCitizenshipNumber: unknown }).ocrCitizenshipNumber,
        ocrDateOfBirth: (kyc as never as { ocrDateOfBirth: unknown }).ocrDateOfBirth,
        ocrGender: (kyc as never as { ocrGender: unknown }).ocrGender,
        ocrAddress: (kyc as never as { ocrAddress: unknown }).ocrAddress,
        confirmedFullName: (kyc as never as { confirmedFullName: unknown }).confirmedFullName,
        confirmedCitizenshipNumber: (kyc as never as { confirmedCitizenshipNumber: unknown }).confirmedCitizenshipNumber,
        confirmedDateOfBirth: (kyc as never as { confirmedDateOfBirth: unknown }).confirmedDateOfBirth,
        confirmedGender: (kyc as never as { confirmedGender: unknown }).confirmedGender,
        confirmedAddress: (kyc as never as { confirmedAddress: unknown }).confirmedAddress,
        confirmedPhoneNumber: (kyc as never as { confirmedPhoneNumber: unknown }).confirmedPhoneNumber,
        confirmedEmail: (kyc as never as { confirmedEmail: unknown }).confirmedEmail,
        processingStatus: (kyc as never as { processingStatus: unknown }).processingStatus,
        ocrFrontStatus: (kyc as never as { ocrFrontStatus: unknown }).ocrFrontStatus,
        ocrBackStatus: (kyc as never as { ocrBackStatus: unknown }).ocrBackStatus,
        faceStatus: (kyc as never as { faceStatus: unknown }).faceStatus,
        ocrProcessingError: (kyc as never as { ocrProcessingError: unknown }).ocrProcessingError,
        faceProcessingError: (kyc as never as { faceProcessingError: unknown }).faceProcessingError,
        workflowStage: (kyc as never as { workflowStage: unknown }).workflowStage,
        faceVerificationStatus: (kyc as never as { faceVerificationStatus: unknown }).faceVerificationStatus,
        ocrProcessingStatus: (kyc as never as { ocrProcessingStatus: unknown }).ocrProcessingStatus,
        queuedForManualReview: (kyc as never as { queuedForManualReview: unknown }).queuedForManualReview,
      } as unknown as KycApplicationDetail;
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
    search?: string,
    tenantId?: number
  ): Promise<{ applications: (KycApplicationDetail | null)[]; total: number }> {
    try {
      const tid = tenantId !== undefined ? tenantId : undefined;
      const where: Prisma.KycApplicationWhereInput = {};

      // tenant scoping: if tenantId provided, filter; otherwise allow all (supercontroller)
      if (tid !== undefined) {
        where.tenantId = tid;
      } else {
        logger.warn("kycService.listKycApplications: tenantId not provided, querying across tenants");
      }

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

      try {
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
          applications: applications.map((a: Parameters<typeof formatKycApplication>[0]) => formatKycApplication(a)),
          total,
        };
      } catch (e) {
        if (isTenantSchemaError(e)) {
          const fallbackWhere: Prisma.KycApplicationWhereInput = {};
          if (status) fallbackWhere.status = status;
          if (search) fallbackWhere.user = where.user;
          const [applications, total] = await Promise.all([
            prisma.kycApplication.findMany({
              where: fallbackWhere,
              include: {
                user: { select: { id: true, email: true, profile: { select: { fullName: true } } } },
                documents: { select: { id: true, documentType: true, filePath: true, fileMimeType: true, fileSize: true, verificationStatus: true, createdAt: true } },
              },
              orderBy: { createdAt: 'desc' },
              take: limit,
              skip: offset,
            }),
            prisma.kycApplication.count({ where: fallbackWhere }),
          ]);
          return { applications: applications.map((a: Parameters<typeof formatKycApplication>[0]) => formatKycApplication(a)), total };
        }
        throw e;
      }
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
  async approveKyc(kycId: string, reviewerId: string, tenantId?: number): Promise<KycApplicationDetail> {
    try {
      const tid = resolveTid(tenantId);
      let kyc: Awaited<ReturnType<typeof prisma.kycApplication.findFirst>>;
      try {
        kyc = await prisma.kycApplication.findFirst({
          where: { id: kycId, tenantId: tid },
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
      } catch (e) {
        if (isTenantSchemaError(e)) {
          kyc = await prisma.kycApplication.findUnique({
            where: { id: kycId },
            include: {
              user: { select: { id: true, email: true, profile: { select: { fullName: true } } } },
              documents: { select: { id: true, documentType: true, filePath: true, fileMimeType: true, fileSize: true, verificationStatus: true, createdAt: true } },
            },
          }) as unknown as typeof kyc;
        } else throw e;
      }

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
        (kyc.user as unknown as { email: string }).email,
        (kyc.user as unknown as { profile?: { fullName?: string } }).profile?.fullName
      );

      await notificationService.create({
        userId: kyc.userId,
        tenantId: tid,
        type: 'KYC_APPROVED',
        title: 'KYC Application Approved',
        message:
          'Congratulations! Your KYC verification has been approved. You can now proceed to portfolio verification.',
        relatedEntityType: 'KycApplication',
        relatedEntityId: kycId,
        actionUrl: '/portfolio',
        priority: 'HIGH',
        metadata: {
          approvedAt: new Date().toISOString(),
          nextStep: 'Portfolio Verification',
        },
      });

      logger.info(
        { kycId, tenantId: tid, userId: kyc.userId, reviewerId },
        'KYC application approved'
      );

      return formatKycApplication(updated as Parameters<typeof formatKycApplication>[0]) as KycApplicationDetail;
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
    rejectionReason: string,
    tenantId?: number
  ): Promise<KycApplicationDetail> {
    try {
      const tid = resolveTid(tenantId);
      let kyc: Awaited<ReturnType<typeof prisma.kycApplication.findFirst>>;
      try {
        kyc = await prisma.kycApplication.findFirst({
          where: { id: kycId, tenantId: tid },
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
      } catch (e) {
        if (isTenantSchemaError(e)) {
          kyc = await prisma.kycApplication.findUnique({
            where: { id: kycId },
            include: {
              user: { select: { id: true, email: true, profile: { select: { fullName: true } } } },
              documents: { select: { id: true, documentType: true, filePath: true, fileMimeType: true, fileSize: true, verificationStatus: true, createdAt: true } },
            },
          }) as unknown as typeof kyc;
        } else throw e;
      }

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
        (kyc.user as unknown as { email: string }).email,
        (kyc.user as unknown as { profile?: { fullName?: string } }).profile?.fullName,
        rejectionReason
      );

      await notificationService.create({
        userId: kyc.userId,
        tenantId: tid,
        type: 'KYC_REJECTED',
        title: 'KYC Application Rejected',
        message: `Your KYC application has been rejected. Reason: ${rejectionReason}. You can resubmit after correcting the issues.`,
        relatedEntityType: 'KycApplication',
        relatedEntityId: kycId,
        actionUrl: '/kyc/resubmit',
        priority: 'CRITICAL',
        metadata: { rejectionReason, resubmissionDeadline: '30 days' },
      });

      logger.info(
        { kycId, tenantId: tid, userId: kyc.userId, reviewerId, rejectionReason },
        'KYC application rejected'
      );

      return formatKycApplication(updated as Parameters<typeof formatKycApplication>[0]) as KycApplicationDetail;
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
  async requestResubmit(kycId: string, reviewerId: string, note: string, tenantId?: number): Promise<KycApplicationDetail> {
    try {
      const tid = resolveTid(tenantId);
      let kyc: Awaited<ReturnType<typeof prisma.kycApplication.findFirst>>;
      try {
        kyc = await prisma.kycApplication.findFirst({
          where: { id: kycId, tenantId: tid },
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
      } catch (e) {
        if (isTenantSchemaError(e)) {
          kyc = await prisma.kycApplication.findUnique({
            where: { id: kycId },
            include: {
              user: { select: { id: true, email: true, profile: { select: { fullName: true } } } },
              documents: { select: { id: true, documentType: true, filePath: true, fileMimeType: true, fileSize: true, verificationStatus: true, createdAt: true } },
            },
          }) as unknown as typeof kyc;
        } else throw e;
      }

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
        (kyc.user as unknown as { email: string }).email,
        (kyc.user as unknown as { profile?: { fullName?: string } }).profile?.fullName,
        note
      );

      logger.info(
        { kycId, tenantId: tid, userId: kyc.userId, reviewerId },
        'KYC resubmission requested'
      );

      return formatKycApplication(updated as Parameters<typeof formatKycApplication>[0]) as KycApplicationDetail;
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
  }, tenantId?: number) {
    const tid = resolveTid(tenantId);
    try {
      // verify tenant scope via findFirst first
      const existing = await prisma.kycApplication.findFirst({ where: { id: kycApplicationId, tenantId: tid } });
      if (!existing) {
        // fallback check without tenant if schema error
        const fallback = await prisma.kycApplication.findUnique({ where: { id: kycApplicationId } });
        if (!fallback) throw new AppError('KYC application not found', 404);
        // if tenant mismatch, deny
        if ((fallback as unknown as { tenantId?: number }).tenantId !== undefined && (fallback as unknown as { tenantId: number }).tenantId !== tid) {
          throw new AppError('KYC application not found', 404);
        }
      }
    } catch (e) {
      if (e instanceof AppError) throw e;
      if (!isTenantSchemaError(e)) throw e;
    }
    return await prisma.kycApplication.update({
      where: { id: kycApplicationId },
      data: {
        ...data,
        status: 'UNDER_REVIEW'
      }
    });
  },

  async resubmitKyc(kycId: string, tenantId?: number): Promise<KycApplicationDetail> {
    const tid = resolveTid(tenantId);
    // alias for resubmit flow - simply reopens
    const kyc = await prisma.kycApplication.findFirst({ where: { id: kycId, tenantId: tid } });
    if (!kyc) throw new AppError('KYC application not found', 404);
    const updated = await prisma.kycApplication.update({
      where: { id: kycId },
      data: { status: 'PENDING', rejectionReason: null },
      include: { documents: { select: { id: true, documentType: true, filePath: true, fileMimeType: true, fileSize: true, verificationStatus: true, createdAt: true } } },
    });
    return formatKycApplication(updated as Parameters<typeof formatKycApplication>[0]) as KycApplicationDetail;
  }
};
