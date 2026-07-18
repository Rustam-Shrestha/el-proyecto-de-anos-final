import type { Request, Response, NextFunction } from 'express';
import { documentService } from '@/services/documentService';
import { auditService } from '@/services/auditService';
import { apiResponse } from '@/utils/apiResponse';
import { getRelativePath } from '@/utils/pathUtils';
import { DocumentType, DocumentVerificationStatus } from '@prisma/client';

export const uploadDocument = async (
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

    const { kycId, documentType } = req.body;

    const result = await documentService.uploadDocument(
      user.id,
      kycId,
      documentType as DocumentType,
      getRelativePath(req.file.path),
      req.file.mimetype,
      req.file.size
    );

    await auditService.log({
      userId: user.id,
      action: 'UPLOAD',
      metadata: {
        documentId: result.id,
        kycId,
        documentType,
        fileName: req.file.filename,
        fileSize: req.file.size,
      },
      ip: req.ip || undefined,
      userAgent: req.headers['user-agent'],
    });

    res.status(201).json(
      apiResponse.success('Document uploaded successfully', result)
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

export const getKycDocuments = async (
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

    const { kycId } = req.params as { kycId: string };

    const documents = await documentService.getDocumentsByKycId(kycId);

    res.json(apiResponse.success('Documents retrieved', documents));
  } catch (error) {
    next(error);
  }
};

export const getDocument = async (
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

    const { documentId } = req.params as { documentId: string };

    const document = await documentService.getDocumentById(documentId);

    res.json(apiResponse.success('Document retrieved', document));
  } catch (error) {
    next(error);
  }
};

export const verifyDocument = async (
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

    const { documentId } = req.params as { documentId: string };
    const { verificationStatus, verificationNotes } = req.body;

    const result = await documentService.verifyDocument(
      documentId,
      user.id,
      verificationStatus as DocumentVerificationStatus,
      verificationNotes
    );

    await auditService.log({
      userId: user.id,
      action: 'VERIFY_DOCUMENT',
      metadata: {
        documentId,
        verificationStatus,
        verificationNotes,
      },
      ip: req.ip || undefined,
      userAgent: req.headers['user-agent'],
    });

    res.json(apiResponse.success('Document verified successfully', result));
  } catch (error) {
    next(error);
  }
};

export const replaceDocument = async (
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

    const { documentId } = req.params as { documentId: string };
    const { documentType } = req.body;

    const result = await documentService.replaceDocument(
      documentId,
      user.id,
      getRelativePath(req.file.path),
      req.file.mimetype,
      req.file.size,
      documentType as DocumentType | undefined
    );

    await auditService.log({
      userId: user.id,
      action: 'UPLOAD',
      metadata: {
        documentId,
        action: 'REPLACE',
        newDocumentId: result.id,
        newVersion: result.version,
        fileName: req.file.filename,
        fileSize: req.file.size,
      },
      ip: req.ip || undefined,
      userAgent: req.headers['user-agent'],
    });

    res.json(apiResponse.success('Document replaced successfully', result));
  } catch (error) {
    if (req.file) {
      import('fs/promises')
        .then((fs) => fs.unlink(req.file!.path))
        .catch(() => { /* ignore */ });
    }
    next(error);
  }
};

export const deleteDocument = async (
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

    const { documentId } = req.params as { documentId: string };

    const result = await documentService.softDeleteDocument(documentId);

    await auditService.log({
      userId: user.id,
      action: 'DELETE_FILE',
      metadata: {
        documentId,
        documentType: result.documentType,
        filePath: result.filePath,
      },
      ip: req.ip || undefined,
      userAgent: req.headers['user-agent'],
    });

    res.json(apiResponse.success('Document deleted successfully', result));
  } catch (error) {
    next(error);
  }
};
