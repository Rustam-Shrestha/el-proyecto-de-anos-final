import type { Request, Response, NextFunction } from 'express';
import { kycService } from '@/services/kycService';
import { userService } from '@/services/userService';
import { auditService } from '@/services/auditService';
import { apiResponse } from '@/utils/apiResponse';
import { paginate } from '@/utils/pagination';

const documentTypeMap: Record<string, string> = {
  selfie: 'SELFIE',
  idProof: 'CITIZENSHIP_FRONT',
  addressProof: 'CITIZENSHIP_BACK',
};

/**
 * GET /api/v1/kyc/my-status
 * Get current user's KYC status with document summary
 */
export const getMyStatus = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json(apiResponse.error('Authentication required', 401));
      return;
    }

    const application = await kycService.getKycStatus(req.user.id);

    if (!application) {
      res.json(apiResponse.success('No KYC application found', null));
      return;
    }

    res.json(apiResponse.success('KYC status retrieved', application));
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/v1/kyc/submit
 * Submit a new KYC application with file uploads
 */
export const submitKyc = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json(apiResponse.error('Authentication required', 401));
      return;
    }

    const files = req.files as { [fieldname: string]: Express.Multer.File[] } | undefined;

    if (!files || Object.keys(files).length === 0) {
      res.status(400).json(apiResponse.error('At least one document file is required', 400));
      return;
    }

    const documents = Object.entries(files).flatMap(([fieldname, fileArray]) =>
      fileArray.map((file) => ({
        type: documentTypeMap[fieldname] || 'OTHER',
        filePath: file.path,
        mimeType: file.mimetype,
        sizeBytes: file.size,
      }))
    );

    const result = await kycService.submitKyc({
      userId: req.user.id,
      documents,
    });

    // Update user profile if personal info was provided
    const { fullName, phone, address } = req.body;
    if (fullName || phone || address) {
      await userService.updateUser(req.user.id, {
        ...(fullName && { fullName }),
        ...(phone && { phone }),
        ...(address && { address }),
      });
    }

    // Log KYC submission
    await auditService.log({
      userId: req.user.id,
      action: 'SUBMIT_KYC',
      metadata: {
        kycId: result.id,
        documentCount: documents.length,
      },
      ip: req.ip || undefined,
      userAgent: req.headers['user-agent'],
    });

    res.status(201).json(
      apiResponse.success('KYC application submitted successfully', result)
    );
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/v1/kyc/status
 * Get current user's KYC status
 */
export const getKycStatus = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json(apiResponse.error('Authentication required', 401));
      return;
    }

    const kyc = await kycService.getKycStatus(req.user.id);

    if (!kyc) {
      return res.json(
        apiResponse.success('No KYC application found', null)
      );
    }

    res.json(apiResponse.success('KYC status retrieved', kyc));
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/v1/kyc
 * List all KYC applications (admin/reviewer)
 */
export const listKycApplications = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { skip, take, page, limit } = paginate(req.query);
    const status = (req.query.status as string) || undefined;
    const search = (req.query.search as string) || undefined;

    const { applications, total } = await kycService.listKycApplications(
      take,
      skip,
      status,
      search
    );

    res.json(
      apiResponse.paginated(
        'KYC applications listed successfully',
        applications,
        page,
        limit,
        total
      )
    );
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/v1/kyc/:id
 * Get a specific KYC application (admin/reviewer)
 */
export const getKycById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;

    const kyc = await kycService.getKycById(id);

    res.json(apiResponse.success('KYC application retrieved', kyc));
  } catch (error) {
    next(error);
  }
};

/**
 * PATCH /api/v1/kyc/:id/approve
 * Approve a KYC application
 */
export const approveKyc = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json(apiResponse.error('Authentication required', 401));
      return;
    }

    const { id } = req.params;

    const result = await kycService.approveKyc(id, req.user.id);

    // Log KYC approval
    await auditService.log({
      userId: req.user.id,
      action: 'APPROVE_KYC',
      metadata: {
        kycId: id,
        targetUserId: result.userId,
      },
      ip: req.ip || undefined,
      userAgent: req.headers['user-agent'],
    });

    res.json(apiResponse.success('KYC application approved', result));
  } catch (error) {
    next(error);
  }
};

/**
 * PATCH /api/v1/kyc/:id/reject
 * Reject a KYC application
 */
export const rejectKyc = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json(apiResponse.error('Authentication required', 401));
      return;
    }

    const { id } = req.params;
    const { rejectionReason } = req.body;

    const result = await kycService.rejectKyc(id, req.user.id, rejectionReason);

    // Log KYC rejection
    await auditService.log({
      userId: req.user.id,
      action: 'REJECT_KYC',
      metadata: {
        kycId: id,
        targetUserId: result.userId,
        rejectionReason,
      },
      ip: req.ip || undefined,
      userAgent: req.headers['user-agent'],
    });

    res.json(apiResponse.success('KYC application rejected', result));
  } catch (error) {
    next(error);
  }
};

/**
 * PATCH /api/v1/kyc/:id/request-resubmit
 * Request resubmission of KYC application
 */
export const requestKycResubmit = async (
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
    const { note } = req.body;

    const result = await kycService.requestResubmit(id, req.user.id, note);

    // Log resubmit request
    await auditService.log({
      userId: req.user.id,
      action: 'REQUEST_RESUBMIT_KYC',
      metadata: {
        kycId: id,
        targetUserId: result.userId,
        note,
      },
      ip: req.ip || undefined,
      userAgent: req.headers['user-agent'],
    });

    res.json(apiResponse.success('Resubmission requested', result));
  } catch (error) {
    next(error);
  }
};
