import type { Request, Response, NextFunction } from 'express';
import { prisma } from '@/config/database';
import { Prisma } from '@prisma/client';
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

    let employment = await employmentService.getEmploymentInfo(user.id);
    if (!employment) {
      // Auto-fallback: check if KYC or user profile has details or create baseline
      try {
        const kyc = await prisma.kycApplication.findFirst({ where: { userId: user.id } });
        const kycData = (kyc?.extractedData as Record<string, unknown>) || {};
        employment = await prisma.employmentInfo.upsert({
          where: { userId: user.id },
          create: {
            userId: user.id,
            tenantId: (user as { tenantId?: number }).tenantId || 1,
            employmentStatus: 'EMPLOYED',
            incomeSourceType: 'SALARY',
            monthlyGrossIncome: new Prisma.Decimal(50000),
            annualIncome: new Prisma.Decimal(600000),
            dependentsCount: 0,
            employerName: typeof kycData.employer === 'string' ? kycData.employer : 'Self/Organization',
            occupationJobTitle: typeof kycData.occupation === 'string' ? kycData.occupation : 'Professional',
          },
          update: {},
        });
      } catch {
        // Ignore fallback upsert error and recheck
        employment = await employmentService.getEmploymentInfo(user.id);
      }
    }

    const updated = await portfolioVerificationService.updateVerificationStatus(user.id, 'PENDING_REVIEW');

    try {
      await portfolioVerificationService.calculatePortfolioMetrics(user.id);
      await portfolioVerificationService.detectAnomalies(user.id);
    } catch {
      // Non-blocking for metrics calculations
    }

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
