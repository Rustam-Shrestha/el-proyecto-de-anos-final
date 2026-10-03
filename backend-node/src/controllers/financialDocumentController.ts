import type { Request, Response, NextFunction } from 'express';
import { financialDocumentService } from '@/services/financialDocumentService';
import { portfolioVerificationService } from '@/services/portfolioVerificationService';
import { auditService } from '@/services/auditService';
import { apiResponse } from '@/utils/apiResponse';
import { getRelativePath } from '@/utils/pathUtils';
import { prisma } from '@/config/database';
import { logger } from '@/config/logger';
import { queueOcrJob } from '@/jobs/ocrProcessingJob';

export const uploadFinancialDocument = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const user = req.user;
    if (!user) {
      res.status(401).json(apiResponse.error('Authentication required', 401));
      return;
    }

    if (!req.file) {
      res.status(400).json(apiResponse.error('No file provided', 400));
      return;
    }

    const { documentType } = req.body;

    const result = await financialDocumentService.uploadDocument(user.id, {
      userId: user.id,
      documentType,
      filePath: getRelativePath(req.file.path),
      fileMimeType: req.file.mimetype,
      fileSize: req.file.size,
      originalName: req.file.originalname,
    });

    queueOcrJob(result.id);

    await auditService.log({
      userId: user.id,
      action: 'UPLOAD_FINANCIAL_DOC',
      metadata: {
        documentId: result.id,
        documentType,
        fileName: req.file.originalname,
        fileSize: req.file.size,
      },
      ip: req.ip || undefined,
      userAgent: req.headers['user-agent'],
    });

    res.status(201).json(
      apiResponse.success('Financial document uploaded successfully', {
        id: result.id,
        documentType: result.documentType,
        ocrStatus: 'SKIPPED',
        createdAt: result.createdAt,
        message: 'Document uploaded. Face-match KYC remains active; financial text extraction is disabled for this flow and the record is kept for manual review.',
      })
    );
  } catch (error) {
    if (req.file) {
      import('fs/promises')
        .then((fs) => fs.unlink(req.file!.path))
        .catch(() => { /* ignore */ });
    }
    next(error);
  }
};

export const listFinancialDocuments = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const user = req.user;
    if (!user) {
      res.status(401).json(apiResponse.error('Authentication required', 401));
      return;
    }

    const documents = await financialDocumentService.getDocumentsByUserId(user.id);

    res.json(apiResponse.success('Financial documents retrieved', documents));
  } catch (error) {
    next(error);
  }
};

export const getFinancialDocument = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const user = req.user;
    if (!user) {
      res.status(401).json(apiResponse.error('Authentication required', 401));
      return;
    }

    const { id } = req.params as { id: string };
    const document = await financialDocumentService.getDocumentById(id);

    if (document.userId !== user.id && user.role !== 'ADMIN' && user.role !== 'REVIEWER') {
      res.status(403).json(apiResponse.error('You do not have access to this document', 403));
      return;
    }

    res.json(apiResponse.success('Financial document retrieved', document));
  } catch (error) {
    next(error);
  }
};

export const deleteFinancialDocument = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const user = req.user;
    if (!user) {
      res.status(401).json(apiResponse.error('Authentication required', 401));
      return;
    }

    const { id } = req.params as { id: string };
    const result = await financialDocumentService.deleteDocument(id, user.id);

    await auditService.log({
      userId: user.id,
      action: 'DELETE_FINANCIAL_DOC',
      metadata: { documentId: id },
      ip: req.ip || undefined,
      userAgent: req.headers['user-agent'],
    });

    res.json(apiResponse.success('Financial document deleted', result));
  } catch (error) {
    next(error);
  }
};

export const getDocumentSummary = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const user = req.user;
    if (!user) {
      res.status(401).json(apiResponse.error('Authentication required', 401));
      return;
    }

    const summary = await financialDocumentService.getDocumentSummary(user.id);

    res.json(apiResponse.success('Document summary retrieved', summary));
  } catch (error) {
    next(error);
  }
};

export const getDocumentStatus = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const user = req.user;
    if (!user) {
      res.status(401).json(apiResponse.error('Authentication required', 401));
      return;
    }

    const { id } = req.params as { id: string };
    const document = await financialDocumentService.getDocumentById(id);

    if (document.userId !== user.id && user.role !== 'ADMIN' && user.role !== 'REVIEWER') {
      res.status(403).json(apiResponse.error('You do not have access to this document', 403));
      return;
    }

    res.json(apiResponse.success('Document status retrieved', {
      id: document.id,
      documentType: document.documentType,
      ocrStatus: document.ocrStatus,
      ocrConfidence: document.ocrConfidence,
      verificationStatus: document.verificationStatus,
      flagCount: document.flagCount,
      anomalyFlags: document.anomalyFlags,
      extractedFields: document.extractedFields,
      comparisonResult: document.comparisonResult,
      isExpired: document.isExpired,
    }));
  } catch (error) {
    next(error);
  }
};

export const adminListDocuments = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { status, page = '1', limit = '20' } = req.query as Record<string, string>;
    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(50, Math.max(1, parseInt(limit, 10) || 20));
    const skip = (pageNum - 1) * limitNum;

    const where: Record<string, unknown> = { isDeleted: false };
    if (status) {
      if (status === 'FLAGGED') {
        where.verificationStatus = 'FLAGGED_REVIEW';
      } else {
        where.verificationStatus = status;
      }
    }

    const [items, total] = await Promise.all([
      prisma.financialDocument.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              email: true,
              profile: { select: { fullName: true } },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        take: limitNum,
        skip,
      }),
      prisma.financialDocument.count({ where }),
    ]);

    res.json(apiResponse.paginated('Documents retrieved', items, pageNum, limitNum, total));
  } catch (error) {
    next(error);
  }
};

async function updatePortfolioCountersAfterVerify(userId: string): Promise<void> {
  try {
    const docs = await prisma.financialDocument.findMany({
      where: { userId, isDeleted: false },
    });
    const uploaded = docs.length;
    const verified = docs.filter((d) => d.verificationStatus === 'VERIFIED').length;
    const flagged = docs.filter((d) => d.anomalyFlags.length > 0 || d.verificationStatus === 'FLAGGED_REVIEW').length;
    const allVerified = uploaded > 0 && verified === uploaded;

    await prisma.portfolioVerification.upsert({
      where: { userId },
      create: {
        userId,
        documentsUploaded: uploaded,
        documentsVerified: verified,
        documentsFlagged: flagged,
        allDocumentsVerified: allVerified,
        canProceedToLoan: allVerified,
        verificationStatus: allVerified ? 'VERIFIED' : 'PENDING_VERIFICATION',
      },
      update: {
        documentsUploaded: uploaded,
        documentsVerified: verified,
        documentsFlagged: flagged,
        allDocumentsVerified: allVerified,
        canProceedToLoan: allVerified,
        verificationStatus: allVerified ? 'VERIFIED' : 'PENDING_VERIFICATION',
      },
    });
  } catch (error) {
    logger.error({ err: error, userId }, 'Failed to update portfolio counters after verify');
  }
}

export const adminVerifyFinancialDocument = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const user = req.user;
    if (!user) {
      res.status(401).json(apiResponse.error('Authentication required', 401));
      return;
    }

    const { id } = req.params as { id: string };
    const { verificationStatus, adminNotes } = req.body;

    const result = await financialDocumentService.verifyDocument(
      id,
      verificationStatus === 'REQUEST_RESUBMISSION' ? 'REJECTED' : verificationStatus,
      adminNotes,
      user.id
    );

    if (verificationStatus === 'REQUEST_RESUBMISSION') {
      await prisma.financialDocument.update({
        where: { id },
        data: { adminNotes: adminNotes || 'Admin requested resubmission' },
      });
    }

    const doc = await financialDocumentService.getDocumentById(id);
    await portfolioVerificationService.calculatePortfolioMetrics(doc.userId);
    await portfolioVerificationService.detectAnomalies(doc.userId);
    await updatePortfolioCountersAfterVerify(doc.userId);

    await auditService.log({
      userId: user.id,
      action: 'VERIFY_FINANCIAL_DOC',
      metadata: {
        documentId: id,
        targetUserId: doc.userId,
        verificationStatus,
        adminNotes,
      },
      ip: req.ip || undefined,
      userAgent: req.headers['user-agent'],
    });

    res.json(apiResponse.success('Financial document verified', result));
  } catch (error) {
    next(error);
  }
};
