import type { Request, Response, NextFunction } from 'express';
import { portfolioVerificationService } from '@/services/portfolioVerificationService';
import { financialDocumentService } from '@/services/financialDocumentService';
import { employmentService } from '@/services/employmentService';
import { loanAccountService } from '@/services/loanAccountService';
import { apiResponse } from '@/utils/apiResponse';

export const getPortfolioSummary = async (
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

    const summary = await portfolioVerificationService.getPortfolioSummary(user.id);

    res.json(apiResponse.success('Portfolio summary retrieved', summary));
  } catch (error) {
    next(error);
  }
};

export const getVerificationStatus = async (
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

    const verification = await portfolioVerificationService.getPortfolioSummary(user.id);

    res.json(apiResponse.success('Verification status retrieved', {
      verificationStatus: verification.verification?.verificationStatus ?? 'INCOMPLETE',
      isComplete: verification.isComplete,
      riskScore: verification.verification?.overallRiskScore,
      riskLevel: verification.verification?.riskLevel,
      flagsCount: verification.verification?.flagsCount,
    }));
  } catch (error) {
    next(error);
  }
};

export const getPortfolioMetrics = async (
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

    const [portfolio, employment, documents] = await Promise.all([
      portfolioVerificationService.calculatePortfolioMetrics(user.id),
      employmentService.getEmploymentInfo(user.id),
      financialDocumentService.getDocumentSummary(user.id),
    ]);

    res.json(apiResponse.success('Portfolio metrics retrieved', {
      portfolio,
      metrics: {
        employmentStatus: employment?.employmentStatus,
        annualIncome: employment?.annualIncome.toNumber(),
        dependents: employment?.dependentsCount,
        incomeStabilityScore: employment?.incomeStabilityScore,
      },
      documents,
    }));
  } catch (error) {
    next(error);
  }
};

export const getVerificationReport = async (
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

    const report = await portfolioVerificationService.generateVerificationReport(user.id);

    res.json(apiResponse.success('Verification report generated', report));
  } catch (error) {
    next(error);
  }
};

export const getLoanHistory = async (
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

    const history = await loanAccountService.getLoanHistory(user.id);

    res.json(apiResponse.success('Loan history retrieved', history));
  } catch (error) {
    next(error);
  }
};
