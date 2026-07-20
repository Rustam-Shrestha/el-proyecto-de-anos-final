import type { Request, Response, NextFunction } from 'express';
import { portfolioVerificationService } from '@/services/portfolioVerificationService';
import { employmentService } from '@/controllers/employmentController';
import { auditService } from '@/services/auditService';
import { financialDocumentService } from '@/services/financialDocumentService';
import { apiResponse } from '@/utils/apiResponse';
import { paginate } from '@/utils/pagination';

export const listPendingPortfolios = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { page, limit } = paginate(req.query);

    const result = await portfolioVerificationService.listPendingVerifications(page, limit);

    res.json(
      apiResponse.paginated(
        'Pending portfolio verifications retrieved',
        result.items,
        result.page,
        result.limit,
        result.total
      )
    );
  } catch (error) {
    next(error);
  }
};

export const getPortfolioDetail = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { userId } = req.params as { userId: string };

    const summary = await portfolioVerificationService.getPortfolioSummary(userId);
    const report = await portfolioVerificationService.generateVerificationReport(userId);

    res.json(apiResponse.success('Portfolio detail retrieved', {
      summary,
      report,
    }));
  } catch (error) {
    next(error);
  }
};

export const verifyPortfolio = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const admin = req.user;
    if (!admin) {
      res.status(401).json(apiResponse.error('Authentication required', 401));
      return;
    }

    const { userId } = req.params as { userId: string };
    const { verificationStatus, adminNotes } = req.body;

    const result = await portfolioVerificationService.updateVerificationStatus(
      userId,
      verificationStatus,
      adminNotes,
      admin.id
    );

    await auditService.log({
      userId: admin.id,
      action: 'VERIFY_PORTFOLIO',
      metadata: {
        targetUserId: userId,
        verificationStatus,
        adminNotes,
      },
      ip: req.ip || undefined,
      userAgent: req.headers['user-agent'],
    });

    res.json(apiResponse.success('Portfolio verification updated', result));
  } catch (error) {
    next(error);
  }
};

export const getPortfolioReport = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { userId } = req.params as { userId: string };

    const report = await portfolioVerificationService.generateVerificationReport(userId);

    res.json(apiResponse.success('Portfolio verification report', report));
  } catch (error) {
    next(error);
  }
};

export const getUserDocuments = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { userId } = req.params as { userId: string };

    const documents = await financialDocumentService.getDocumentsByUserId(userId);

    res.json(apiResponse.success('User financial documents retrieved', documents));
  } catch (error) {
    next(error);
  }
};
