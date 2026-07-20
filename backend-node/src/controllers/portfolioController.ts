import type { Request, Response, NextFunction } from 'express';
import { portfolioVerificationService } from '@/services/portfolioVerificationService';
import { financialDocumentService } from '@/services/financialDocumentService';
import { employmentService } from '@/services/employmentService';
import { loanAccountService } from '@/services/loanAccountService';
import { auditService } from '@/services/auditService';
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

export const submitPortfolio = async (
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

    const employment = await employmentService.getEmploymentInfo(user.id);
    if (!employment) {
      res.status(400).json(apiResponse.error('Please complete your employment details first', 400));
      return;
    }

    const updated = await portfolioVerificationService.updateVerificationStatus(user.id, 'PENDING_REVIEW');

    await portfolioVerificationService.calculatePortfolioMetrics(user.id);
    await portfolioVerificationService.detectAnomalies(user.id);

    await auditService.log({
      userId: user.id,
      action: 'SUBMIT_PORTFOLIO',
      metadata: { verificationStatus: 'PENDING_REVIEW' },
      ip: req.ip || undefined,
      userAgent: req.headers['user-agent'],
    });

    res.json(apiResponse.success('Portfolio submitted for review', updated));
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
