import { prisma } from '@/config/database';
import { logger } from '@/config/logger';
import { AppError } from '@/utils/AppError';
import { notificationService } from '@/services/notificationService';

export interface FinancialDocumentInput {
  userId: string;
  documentType: string;
  filePath: string;
  fileMimeType: string;
  fileSize: number;
  originalName: string;
}

export const financialDocumentService = {
  async uploadDocument(userId: string, data: FinancialDocumentInput) {
    try {
      const document = await prisma.financialDocument.create({
        data: {
          userId,
          documentType: data.documentType,
          filePath: data.filePath,
          fileMimeType: data.fileMimeType,
          fileSize: data.fileSize,
          originalName: data.originalName,
        },
      });

      logger.info({ userId, documentId: document.id, documentType: data.documentType }, 'Financial document uploaded');

      return document;
    } catch (error) {
      if (error instanceof AppError) throw error;
      logger.error({ err: error, userId }, 'Failed to upload financial document');
      throw new AppError('Failed to upload financial document', 500);
    }
  },

  async getDocumentsByUserId(userId: string) {
    try {
      const documents = await prisma.financialDocument.findMany({
        where: { userId, isDeleted: false },
        orderBy: { createdAt: 'desc' },
      });

      return documents;
    } catch (error) {
      if (error instanceof AppError) throw error;
      logger.error({ err: error, userId }, 'Failed to fetch financial documents');
      throw new AppError('Failed to fetch financial documents', 500);
    }
  },

  async getDocumentById(documentId: string) {
    try {
      const document = await prisma.financialDocument.findUnique({
        where: { id: documentId },
      });

      if (!document) {
        throw new AppError('Financial document not found', 404);
      }

      return document;
    } catch (error) {
      if (error instanceof AppError) throw error;
      logger.error({ err: error, documentId }, 'Failed to fetch financial document');
      throw new AppError('Failed to fetch financial document', 500);
    }
  },

  async deleteDocument(documentId: string, userId: string) {
    try {
      const document = await prisma.financialDocument.findUnique({
        where: { id: documentId },
      });

      if (!document) {
        throw new AppError('Financial document not found', 404);
      }

      if (document.userId !== userId) {
        throw new AppError('You do not have access to this document', 403);
      }

      const updated = await prisma.financialDocument.update({
        where: { id: documentId },
        data: { isDeleted: true },
      });

      logger.info({ documentId }, 'Financial document soft-deleted');

      return updated;
    } catch (error) {
      if (error instanceof AppError) throw error;
      logger.error({ err: error, documentId }, 'Failed to delete financial document');
      throw new AppError('Failed to delete financial document', 500);
    }
  },

  async getDocumentsByStatus(userId: string, status: string) {
    try {
      const documents = await prisma.financialDocument.findMany({
        where: { userId, verificationStatus: status, isDeleted: false },
        orderBy: { createdAt: 'desc' },
      });

      return documents;
    } catch (error) {
      if (error instanceof AppError) throw error;
      logger.error({ err: error, userId, status }, 'Failed to fetch documents by status');
      throw new AppError('Failed to fetch financial documents', 500);
    }
  },

  async updateOcrResult(documentId: string, ocrData: Record<string, unknown>, confidence: number | null, status: string) {
    try {
      const updated = await prisma.financialDocument.update({
        where: { id: documentId },
        data: {
          ocrData,
          ocrConfidence: confidence,
          ocrStatus: status,
          verificationStatus: confidence !== null && confidence < 0.8 ? 'FLAGGED' : undefined,
        },
      });

      return updated;
    } catch (error) {
      if (error instanceof AppError) throw error;
      logger.error({ err: error, documentId }, 'Failed to update OCR result');
      throw new AppError('Failed to update OCR result', 500);
    }
  },

  async verifyDocument(documentId: string, status: string, adminNotes?: string, verifiedBy?: string) {
    try {
      const document = await prisma.financialDocument.findUnique({
        where: { id: documentId },
      });

      if (!document) {
        throw new AppError('Financial document not found', 404);
      }

      const updated = await prisma.financialDocument.update({
        where: { id: documentId },
        data: {
          verificationStatus: status,
          adminNotes: adminNotes ?? null,
          verifiedBy: verifiedBy ?? null,
          verifiedAt: status === 'VERIFIED' || status === 'REJECTED' ? new Date() : null,
        },
      });

      logger.info({ documentId, status, verifiedBy }, 'Financial document verification updated');

      if (status === 'VERIFIED' || status === 'REJECTED') {
        await notificationService.create({
          userId: document.userId,
          type: status === 'VERIFIED' ? 'DOCUMENT_VERIFIED' : 'DOCUMENT_FLAGGED',
          title:
            status === 'VERIFIED'
              ? 'Document Verified'
              : 'Document Flagged for Review',
          message:
            status === 'VERIFIED'
              ? 'Your financial document has been verified successfully.'
              : `A document was flagged.${adminNotes ? ` Reason: ${adminNotes}` : ''}`,
          relatedEntityType: 'FinancialDocument',
          relatedEntityId: documentId,
          actionUrl: '/portfolio',
          priority: status === 'REJECTED' ? 'HIGH' : 'NORMAL',
          metadata: { status, verifiedBy: verifiedBy ?? null, adminNotes: adminNotes ?? null },
        });
      }

      return updated;
    } catch (error) {
      if (error instanceof AppError) throw error;
      logger.error({ err: error, documentId }, 'Failed to verify financial document');
      throw new AppError('Failed to verify financial document', 500);
    }
  },

  async markExpiredDocuments() {
    try {
      const now = new Date();
      const result = await prisma.financialDocument.updateMany({
        where: {
          isExpired: false,
          expiryDate: { lte: now },
        },
        data: { isExpired: true },
      });

      logger.info({ count: result.count }, 'Expired financial documents marked');

      return result.count;
    } catch (error) {
      if (error instanceof AppError) throw error;
      logger.error({ err: error }, 'Failed to mark expired documents');
      throw new AppError('Failed to mark expired documents', 500);
    }
  },

  async getDocumentSummary(userId: string) {
    try {
      const documents = await prisma.financialDocument.findMany({
        where: { userId, isDeleted: false },
      });

      const total = documents.length;
      const verified = documents.filter((d) => d.verificationStatus === 'VERIFIED').length;
      const pending = documents.filter((d) => d.verificationStatus === 'PENDING' || d.verificationStatus === 'PROCESSING').length;
      const rejected = documents.filter((d) => d.verificationStatus === 'REJECTED').length;
      const flagged = documents.filter((d) => d.verificationStatus === 'FLAGGED').length;

      return { total, verified, pending, rejected, flagged };
    } catch (error) {
      if (error instanceof AppError) throw error;
      logger.error({ err: error, userId }, 'Failed to compute document summary');
      throw new AppError('Failed to compute document summary', 500);
    }
  },
};
