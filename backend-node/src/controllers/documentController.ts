import type { Request, Response, NextFunction } from 'express';
import { documentService } from '@/services/documentService';
import { auditService } from '@/services/auditService';
import { apiResponse } from '@/utils/apiResponse';

/**
 * POST /api/v1/documents/upload
 * Upload a new document
 */
export const uploadDocument = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json(apiResponse.error('Authentication required', 401));
      return;
    }

    if (!req.file) {
      res.status(400).json(apiResponse.error('No file provided', 400));
      return;
    }

    const { kycId, type } = req.body;

    // Calculate relative path for storage
    const relativePath = req.file.path
      .replace(process.cwd(), '')
      .replace(/\\/g, '/') // Convert backslashes to forward slashes
      .replace(/^\//, ''); // Remove leading slash

    const result = await documentService.uploadDocument(
      req.user.id,
      kycId,
      relativePath,
      type,
      req.file.mimetype,
      req.file.size
    );

    // Log upload
    await auditService.log({
      userId: req.user.id,
      action: 'UPLOAD',
      metadata: {
        documentId: result.id,
        kycId,
        type,
        fileName: req.file.filename,
        sizeBytes: req.file.size,
      },
      ip: req.ip || undefined,
      userAgent: req.headers['user-agent'],
    });

    res.status(201).json(
      apiResponse.success('Document uploaded successfully', result)
    );
  } catch (error) {
    // Clean up uploaded file on error (fire-and-forget)
    if (req.file) {
      import('fs/promises')
        .then((fs) => fs.unlink(req.file!.path))
        .catch(() => {
          /* ignore */
        });
    }
    next(error);
  }
};

/**
 * GET /api/v1/documents/:id
 * Get document metadata
 */
export const getDocument = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json(apiResponse.error('Authentication required', 401));
      return;
    }

    const { id } = req.params;

    const document = await documentService.getDocument(id, req.user.id);

    res.json(apiResponse.success('Document metadata retrieved', document));
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/v1/documents/:id/versions
 * Get document version history
 */
export const getDocumentVersions = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json(apiResponse.error('Authentication required', 401));
      return;
    }

    const { id } = req.params;

    const versions = await documentService.getDocumentVersions(id, req.user.id);

    res.json(apiResponse.success('Document versions retrieved', versions));
  } catch (error) {
    next(error);
  }
};

/**
 * DELETE /api/v1/documents/:id
 * Soft-delete a document
 */
export const deleteDocument = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json(apiResponse.error('Authentication required', 401));
      return;
    }

    const { id } = req.params;

    const result = await documentService.deleteDocument(id, req.user.id);

    // Log deletion
    await auditService.log({
      userId: req.user.id,
      action: 'DELETE_FILE',
      metadata: {
        documentId: id,
        type: result.type,
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

/**
 * POST /api/v1/documents/:id/replace
 * Replace a document with a new version
 */
export const replaceDocument = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json(apiResponse.error('Authentication required', 401));
      return;
    }

    if (!req.file) {
      res.status(400).json(apiResponse.error('No file provided', 400));
      return;
    }

    const { id } = req.params;
    const { type } = req.body;

    // Calculate relative path for storage
    const relativePath = req.file.path
      .replace(process.cwd(), '')
      .replace(/\\/g, '/') // Convert backslashes to forward slashes
      .replace(/^\//, ''); // Remove leading slash

    const result = await documentService.replaceDocument(
      id,
      req.user.id,
      relativePath,
      req.file.mimetype,
      req.file.size,
      type
    );

    // Log replacement
    await auditService.log({
      userId: req.user.id,
      action: 'UPLOAD',
      metadata: {
        documentId: id,
        action: 'REPLACE',
        newVersion: result.version,
        fileName: req.file.filename,
        sizeBytes: req.file.size,
      },
      ip: req.ip || undefined,
      userAgent: req.headers['user-agent'],
    });

    res.json(apiResponse.success('Document replaced with new version', result));
  } catch (error) {
    // Clean up uploaded file on error
    if (req.file) {
      import('fs/promises')
        .then((fs) => fs.unlink(req.file!.path))
        .catch(() => {
          /* ignore */
        });
    }
    next(error);
  }
};
