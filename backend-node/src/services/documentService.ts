import { prisma } from '@/config/database';
import { logger } from '@/config/logger';
import { AppError } from '@/utils/AppError';
import { DocumentType, DocumentVerificationStatus } from '@prisma/client';

export interface DocumentSummary {
  total: number;
  verified: number;
  pending: number;
  rejected: number;
  allRequiredVerified: boolean;
}

export const documentService = {
  async uploadDocument(
    userId: string,
    kycApplicationId: string,
    documentType: DocumentType,
    filePath: string,
    fileMimeType: string,
    fileSize: number
  ) {
    try {
      const kyc = await prisma.kycApplication.findUnique({
        where: { id: kycApplicationId },
      });

      if (!kyc) {
        throw new AppError('KYC application not found', 404);
      }

      if (kyc.userId !== userId) {
        throw new AppError('KYC application does not belong to you', 403);
      }

      const existing = await prisma.document.findFirst({
        where: {
          kycId: kycApplicationId,
          documentType,
          isDeleted: false,
        },
      });

      if (existing) {
        throw new AppError(
          'A document of this type already exists for this KYC. Use the replace endpoint to update it.',
          409
        );
      }

      const document = await prisma.document.create({
        data: {
          userId,
          kycId: kycApplicationId,
          documentType,
          filePath,
          fileMimeType,
          fileSize,
          version: 1,
          ocrStatus: 'PENDING' as DocumentVerificationStatus,
          verificationStatus: 'PENDING' as DocumentVerificationStatus,
        },
      });

      logger.info(
        { userId, kycId: kycApplicationId, documentId: document.id, documentType },
        'Document uploaded'
      );

      return document;
    } catch (error) {
      if (error instanceof AppError) throw error;
      logger.error({ err: error, userId, kycId: kycApplicationId }, 'Failed to upload document');
      throw new AppError('Failed to upload document', 500);
    }
  },

  async getDocumentsByKycId(kycApplicationId: string) {
    try {
      const documents = await prisma.document.findMany({
        where: {
          kycId: kycApplicationId,
          isDeleted: false,
        },
        orderBy: { createdAt: 'desc' },
      });

      return documents;
    } catch (error) {
      if (error instanceof AppError) throw error;
      logger.error({ err: error, kycId: kycApplicationId }, 'Failed to fetch documents');
      throw new AppError('Failed to fetch documents', 500);
    }
  },

  async getDocumentById(documentId: string) {
    try {
      const document = await prisma.document.findUnique({
        where: { id: documentId },
        include: {
          user: {
            select: { id: true, email: true },
          },
          kyc: {
            select: { id: true, status: true },
          },
        },
      });

      if (!document) {
        throw new AppError('Document not found', 404);
      }

      return document;
    } catch (error) {
      if (error instanceof AppError) throw error;
      logger.error({ err: error, documentId }, 'Failed to fetch document');
      throw new AppError('Failed to fetch document', 500);
    }
  },

  async verifyDocument(
    documentId: string,
    reviewerId: string,
    status: DocumentVerificationStatus,
    notes?: string
  ) {
    try {
      const document = await prisma.document.findUnique({
        where: { id: documentId },
      });

      if (!document) {
        throw new AppError('Document not found', 404);
      }

      if (document.isDeleted) {
        throw new AppError('Cannot verify a deleted document', 400);
      }

      const updated = await prisma.document.update({
        where: { id: documentId },
        data: {
          verificationStatus: status,
          verifiedBy: reviewerId,
          verifiedAt: new Date(),
          verificationNotes: notes ?? null,
        },
      });

      logger.info(
        { documentId, reviewerId, status },
        'Document verification status updated'
      );

      return updated;
    } catch (error) {
      if (error instanceof AppError) throw error;
      logger.error({ err: error, documentId }, 'Failed to verify document');
      throw new AppError('Failed to verify document', 500);
    }
  },

  async softDeleteDocument(documentId: string) {
    try {
      const document = await prisma.document.findUnique({
        where: { id: documentId },
      });

      if (!document) {
        throw new AppError('Document not found', 404);
      }

      if (document.isDeleted) {
        throw new AppError('Document is already deleted', 400);
      }

      const updated = await prisma.document.update({
        where: { id: documentId },
        data: { isDeleted: true },
      });

      logger.info({ documentId }, 'Document soft-deleted');

      return updated;
    } catch (error) {
      if (error instanceof AppError) throw error;
      logger.error({ err: error, documentId }, 'Failed to delete document');
      throw new AppError('Failed to delete document', 500);
    }
  },

  async replaceDocument(
    existingDocumentId: string,
    userId: string,
    filePath: string,
    fileMimeType: string,
    fileSize: number,
    documentType?: DocumentType
  ) {
    try {
      const existing = await prisma.document.findUnique({
        where: { id: existingDocumentId },
      });

      if (!existing) {
        throw new AppError('Document not found', 404);
      }

      if (existing.userId !== userId) {
        throw new AppError('You do not have access to this document', 403);
      }

      if (existing.isDeleted) {
        throw new AppError('Cannot replace a deleted document', 400);
      }

      const newDoc = await prisma.document.create({
        data: {
          userId: existing.userId,
          kycId: existing.kycId,
          documentType: documentType ?? existing.documentType,
          filePath,
          fileMimeType,
          fileSize,
          version: existing.version + 1,
          ocrStatus: 'PENDING' as DocumentVerificationStatus,
          verificationStatus: 'PENDING' as DocumentVerificationStatus,
          replacedById: existing.id,
        },
      });

      await prisma.document.update({
        where: { id: existing.id },
        data: { isDeleted: true },
      });

      await prisma.documentVersion.create({
        data: {
          documentId: existing.id,
          filePath: existing.filePath,
          version: existing.version,
        },
      });

      logger.info(
        { existingDocumentId, newDocumentId: newDoc.id, newVersion: newDoc.version },
        'Document replaced with new version'
      );

      return newDoc;
    } catch (error) {
      if (error instanceof AppError) throw error;
      logger.error({ err: error, documentId: existingDocumentId }, 'Failed to replace document');
      throw new AppError('Failed to replace document', 500);
    }
  },

  async getDocumentSummary(kycApplicationId: string): Promise<DocumentSummary> {
    try {
      interface DocSummary {
        id: string;
        documentType: DocumentType;
        verificationStatus: DocumentVerificationStatus;
      }

      const documents: DocSummary[] = await prisma.document.findMany({
        where: {
          kycId: kycApplicationId,
          isDeleted: false,
        },
        select: {
          id: true,
          documentType: true,
          verificationStatus: true,
        },
      });

      const total = documents.length;
      const verified = documents.filter((d) => d.verificationStatus === 'VERIFIED').length;
      const pending = documents.filter((d) => d.verificationStatus === 'PENDING' || d.verificationStatus === 'PROCESSING').length;
      const rejected = documents.filter((d) => d.verificationStatus === 'REJECTED').length;

      const requiredTypes: DocumentType[] = [
        'CITIZENSHIP_FRONT',
        'CITIZENSHIP_BACK',
        'SELFIE',
        'INCOME_PROOF',
      ];

      const presentTypes = new Set(documents.map((d) => d.documentType));
      const allRequiredPresent = requiredTypes.every((t) => presentTypes.has(t));

      const verifiedTypes = new Set(
        documents
          .filter((d) => d.verificationStatus === 'VERIFIED')
          .map((d) => d.documentType)
      );
      const allRequiredVerified = allRequiredPresent
        && requiredTypes.every((t) => verifiedTypes.has(t));

      return { total, verified, pending, rejected, allRequiredVerified };
    } catch (error) {
      if (error instanceof AppError) throw error;
      logger.error({ err: error, kycId: kycApplicationId }, 'Failed to compute document summary');
      throw new AppError('Failed to compute document summary', 500);
    }
  },
};
