import { prisma } from '@/config/database';
import { logger } from '@/config/logger';
import { AppError } from '@/utils/AppError';
import fs from 'fs/promises';
import path from 'path';

export interface DocumentDetail {
  id: string;
  userId: string;
  kycId: string;
  type: string;
  filePath: string;
  mimeType: string;
  sizeBytes: number;
  isDeleted: boolean;
  version: number;
  createdAt: Date;
}

export interface DocumentVersion {
  id: string;
  documentId: string;
  filePath: string;
  version: number;
  createdAt: Date;
}

export const documentService = {
  /**
   * Upload a new document
   */
  async uploadDocument(
    userId: string,
    kycId: string,
    filePath: string,
    type: string,
    mimeType: string,
    sizeBytes: number
  ): Promise<DocumentDetail> {
    try {
      // Verify KYC application exists and belongs to user
      const kyc = await prisma.kycApplication.findUnique({
        where: { id: kycId },
      });

      if (!kyc) {
        throw new AppError('KYC application not found', 404);
      }

      if (kyc.userId !== userId) {
        throw new AppError('KYC application does not belong to you', 403);
      }

      // Check if document of this type already exists
      const existingDoc = await prisma.document.findFirst({
        where: {
          kycId,
          type,
          isDeleted: false,
        },
      });

      // If exists, this will be handled by replaceDocument
      if (existingDoc) {
        throw new AppError(
          'Document of this type already exists. Use replace endpoint to update.',
          409
        );
      }

      // Create document record
      const document = await prisma.document.create({
        data: {
          userId,
          kycId,
          type,
          filePath,
          mimeType,
          sizeBytes,
          version: 1,
        },
      });

      logger.info(
        { userId, kycId, documentId: document.id, type },
        'Document uploaded'
      );

      return document as DocumentDetail;
    } catch (error) {
      if (error instanceof AppError) throw error;
      logger.error(
        { err: error, userId, kycId },
        'Failed to upload document'
      );
      throw new AppError('Failed to upload document', 500);
    }
  },

  /**
   * Get document metadata
   */
  async getDocument(documentId: string, userId: string): Promise<DocumentDetail> {
    try {
      const document = await prisma.document.findUnique({
        where: { id: documentId },
      });

      if (!document) {
        throw new AppError('Document not found', 404);
      }

      // Verify ownership
      if (document.userId !== userId) {
        throw new AppError('You do not have access to this document', 403);
      }

      return document as DocumentDetail;
    } catch (error) {
      if (error instanceof AppError) throw error;
      logger.error({ err: error, documentId, userId }, 'Failed to get document');
      throw new AppError('Failed to fetch document', 500);
    }
  },

  /**
   * Get document version history
   */
  async getDocumentVersions(documentId: string, userId: string): Promise<DocumentVersion[]> {
    try {
      // Verify document ownership
      const document = await prisma.document.findUnique({
        where: { id: documentId },
      });

      if (!document) {
        throw new AppError('Document not found', 404);
      }

      if (document.userId !== userId) {
        throw new AppError('You do not have access to this document', 403);
      }

      // Get all versions
      const versions = await prisma.documentVersion.findMany({
        where: { documentId },
        orderBy: { version: 'desc' },
      });

      return versions as DocumentVersion[];
    } catch (error) {
      if (error instanceof AppError) throw error;
      logger.error({ err: error, documentId, userId }, 'Failed to get document versions');
      throw new AppError('Failed to fetch document versions', 500);
    }
  },

  /**
   * Soft-delete a document (move to archive folder)
   */
  async deleteDocument(documentId: string, userId: string): Promise<DocumentDetail> {
    try {
      const document = await prisma.document.findUnique({
        where: { id: documentId },
      });

      if (!document) {
        throw new AppError('Document not found', 404);
      }

      if (document.userId !== userId) {
        throw new AppError('You do not have access to this document', 403);
      }

      if (document.isDeleted) {
        throw new AppError('Document is already deleted', 400);
      }

      // Move file to archive folder (fire-and-forget)
      try {
        const uploadDir = process.env.UPLOAD_DIR || 'uploads/kyc';
        const archiveDir = path.join(process.cwd(), uploadDir, 'archive');

        // Ensure archive directory exists
        await fs.mkdir(archiveDir, { recursive: true });

        // Move file
        const sourceFile = path.join(process.cwd(), document.filePath);
        const archivedFileName = `${documentId}_${document.type}_archived_${Date.now()}${path.extname(document.filePath)}`;
        const archiveFile = path.join(archiveDir, archivedFileName);

        await fs.rename(sourceFile, archiveFile);

        logger.info(
          { documentId, from: sourceFile, to: archiveFile },
          'Document file moved to archive'
        );
      } catch (fileError) {
        logger.warn(
          { err: fileError, documentId },
          'Failed to move file to archive (continuing with DB update)'
        );
        // Don't throw — continue with DB update
      }

      // Update document in database
      const updated = await prisma.document.update({
        where: { id: documentId },
        data: { isDeleted: true },
      });

      return updated as DocumentDetail;
    } catch (error) {
      if (error instanceof AppError) throw error;
      logger.error({ err: error, documentId, userId }, 'Failed to delete document');
      throw new AppError('Failed to delete document', 500);
    }
  },

  /**
   * Replace a document with a new version
   */
  async replaceDocument(
    documentId: string,
    userId: string,
    newFilePath: string,
    newMimeType: string,
    newSizeBytes: number,
    newType?: string
  ): Promise<DocumentDetail> {
    try {
      const document = await prisma.document.findUnique({
        where: { id: documentId },
      });

      if (!document) {
        throw new AppError('Document not found', 404);
      }

      if (document.userId !== userId) {
        throw new AppError('You do not have access to this document', 403);
      }

      if (document.isDeleted) {
        throw new AppError('Cannot replace a deleted document', 400);
      }

      // Create version entry for old document
      await prisma.documentVersion.create({
        data: {
          documentId,
          filePath: document.filePath,
          version: document.version,
        },
      });

      logger.info(
        { documentId, version: document.version },
        'Document version created'
      );

      // Archive old file (fire-and-forget)
      try {
        const uploadDir = process.env.UPLOAD_DIR || 'uploads/kyc';
        const archiveDir = path.join(process.cwd(), uploadDir, 'archive');

        await fs.mkdir(archiveDir, { recursive: true });

        const oldFile = path.join(process.cwd(), document.filePath);
        const archivedFileName = `${documentId}_v${document.version}_${Date.now()}${path.extname(oldFile)}`;
        const archiveFile = path.join(archiveDir, archivedFileName);

        await fs.rename(oldFile, archiveFile);

        logger.info({ documentId, oldFile, archiveFile }, 'Old document version archived');
      } catch (fileError) {
        logger.warn({ err: fileError, documentId }, 'Failed to archive old version');
      }

      // Update document with new version
      const updated = await prisma.document.update({
        where: { id: documentId },
        data: {
          filePath: newFilePath,
          mimeType: newMimeType,
          sizeBytes: newSizeBytes,
          type: newType || document.type,
          version: document.version + 1,
        },
      });

      logger.info(
        { documentId, newVersion: updated.version },
        'Document replaced with new version'
      );

      return updated as DocumentDetail;
    } catch (error) {
      if (error instanceof AppError) throw error;
      logger.error({ err: error, documentId, userId }, 'Failed to replace document');
      throw new AppError('Failed to replace document', 500);
    }
  },
};
