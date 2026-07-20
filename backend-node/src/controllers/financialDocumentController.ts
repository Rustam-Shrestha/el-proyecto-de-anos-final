import type { Request, Response, NextFunction } from 'express';
import { financialDocumentService } from '@/services/financialDocumentService';
import { portfolioVerificationService } from '@/services/portfolioVerificationService';
import { auditService } from '@/services/auditService';
import { apiResponse } from '@/utils/apiResponse';
import { getRelativePath } from '@/utils/pathUtils';

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
      apiResponse.success('Financial document uploaded successfully', result)
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
      verificationStatus,
      adminNotes,
      user.id
    );

    const doc = await financialDocumentService.getDocumentById(id);
    await portfolioVerificationService.calculatePortfolioMetrics(doc.userId);
    await portfolioVerificationService.detectAnomalies(doc.userId);

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
