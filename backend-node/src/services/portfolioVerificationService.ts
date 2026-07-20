import { prisma } from '@/config/database';
import { logger } from '@/config/logger';
import { AppError } from '@/utils/AppError';
import { Prisma } from '@prisma/client';

export const portfolioVerificationService = {
  async calculatePortfolioMetrics(userId: string) {
    try {
      const [employment, profile, loanFeatures, activeAccounts] = await Promise.all([
        prisma.employmentInfo.findUnique({ where: { userId } }),
        prisma.profile.findUnique({ where: { userId } }),
        prisma.loanFeatures.findUnique({ where: { userId } }),
        prisma.loanAccount.findMany({ where: { userId, isActive: true } }),
      ]);

      if (!employment) {
        throw new AppError('Employment info not found. Complete employment declaration first.', 400);
      }

      const annualIncome = employment.annualIncome.toNumber();
      const dependents = employment.dependentsCount;
      const incomePerDependent = annualIncome / (dependents + 1);
      const totalActiveDebt = activeAccounts.reduce((sum, a) => sum + a.monthlyEMI.toNumber(), 0);

      let loanToIncomeRatio = 0;
      let emiToIncomeRatio = 0;
      if (loanFeatures) {
        const requestedLoan = loanFeatures.requestedLoanAmount.toNumber();
        const emi = loanFeatures.calculatedEMI.toNumber();
        loanToIncomeRatio = annualIncome > 0 ? (requestedLoan / annualIncome) * 100 : 0;
        emiToIncomeRatio = annualIncome > 0 ? ((emi * 12) / annualIncome) * 100 : 0;
      }

      let employmentStabilityScore = 50;
      if (employment.employmentStartDate) {
        const today = new Date();
        const startDate = employment.employmentStartDate;
        const tenureYears = (today.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24 * 365);

        if (tenureYears < 1) employmentStabilityScore = 20;
        else if (tenureYears < 2) employmentStabilityScore = 40;
        else if (tenureYears < 5) employmentStabilityScore = 60;
        else if (tenureYears < 10) employmentStabilityScore = 80;
        else employmentStabilityScore = 100;

        if (employment.incomeStabilityScore < 50) {
          employmentStabilityScore = Math.round(employmentStabilityScore * 0.7);
        }
      }

      const ageCategory = 'UNKNOWN';
      if (profile?.dateOfBirth) {
        const today = new Date();
        const birthDate = profile.dateOfBirth;
        const age = today.getFullYear() - birthDate.getFullYear();
        if (age < 25) {
          employmentStabilityScore = Math.round(employmentStabilityScore * 0.8);
        }
      }

      const dti = totalActiveDebt > 0 && annualIncome > 0
        ? ((totalActiveDebt * 12) / annualIncome) * 100
        : 0;

      const overallRiskScore = Math.round(
        (100 - employmentStabilityScore) * 0.4 +
        (loanToIncomeRatio > 50 ? 30 : 10) * 0.3 +
        (dti > 50 ? 30 : 10) * 0.3
      );
      const clampedRiskScore = Math.max(0, Math.min(100, overallRiskScore));
      const riskLevel = clampedRiskScore < 35 ? 'LOW' : clampedRiskScore < 65 ? 'MEDIUM' : 'HIGH';

      const portfolio = await prisma.portfolioVerification.upsert({
        where: { userId },
        create: {
          userId,
          loanToIncomeRatio: new Prisma.Decimal(loanToIncomeRatio.toFixed(2)),
          emiToIncomeRatio: new Prisma.Decimal(emiToIncomeRatio.toFixed(2)),
          incomePerDependent: new Prisma.Decimal(incomePerDependent.toFixed(2)),
          employmentStabilityScore,
          ageCategory,
          overallRiskScore: clampedRiskScore,
          riskLevel,
        },
        update: {
          loanToIncomeRatio: new Prisma.Decimal(loanToIncomeRatio.toFixed(2)),
          emiToIncomeRatio: new Prisma.Decimal(emiToIncomeRatio.toFixed(2)),
          incomePerDependent: new Prisma.Decimal(incomePerDependent.toFixed(2)),
          employmentStabilityScore,
          ageCategory,
          overallRiskScore: clampedRiskScore,
          riskLevel,
          lastUpdated: new Date(),
        },
      });

      logger.info({ userId, riskScore: clampedRiskScore, riskLevel }, 'Portfolio metrics calculated');

      return portfolio;
    } catch (error) {
      if (error instanceof AppError) throw error;
      const message = error instanceof Error ? error.message : 'Unknown error';
      logger.error({ err: error, userId }, `Failed to calculate portfolio metrics: ${message}`);
      throw new AppError('Failed to calculate portfolio metrics', 500, { cause: message });
    }
  },

  async detectAnomalies(userId: string) {
    try {
      const [employment, documents] = await Promise.all([
        prisma.employmentInfo.findUnique({ where: { userId } }),
        prisma.financialDocument.findMany({
          where: { userId, isDeleted: false, ocrStatus: 'COMPLETED' },
        }),
      ]);

      const flags: Array<{ field: string; issue: string; severity: 'LOW' | 'MEDIUM' | 'HIGH' }> = [];

      if (!employment) {
        return { flags, flagsCount: 0 };
      }

      if (employment.employmentStartDate) {
        const profile = await prisma.profile.findUnique({ where: { userId } });
        if (profile?.dateOfBirth) {
          const dob = profile.dateOfBirth;
          const empStart = employment.employmentStartDate;
          if (empStart <= dob) {
            flags.push({
              field: 'employmentStartDate',
              issue: 'Employment start date is before or equal to date of birth',
              severity: 'HIGH',
            });
          }
        }
      }

      if (employment.dependentsCount > 10) {
        flags.push({
          field: 'dependentsCount',
          issue: `Unusually high number of dependents: ${employment.dependentsCount}`,
          severity: 'MEDIUM',
        });
      }

      if (documents.length > 0) {
        for (const doc of documents) {
          if (doc.ocrConfidence !== null && doc.ocrConfidence < 0.5) {
            flags.push({
              field: `document:${doc.documentType}`,
              issue: `Low OCR confidence (${(doc.ocrConfidence * 100).toFixed(0)}%) for document`,
              severity: 'HIGH',
            });
          }
        }
      }

      if (employment.incomeStabilityScore < 30) {
        flags.push({
          field: 'incomeStabilityScore',
          issue: `Low income stability score: ${employment.incomeStabilityScore}/100`,
          severity: 'MEDIUM',
        });
      }

      const existingLoans = await prisma.loanAccount.findMany({
        where: { userId, isActive: true },
      });
      if (existingLoans.length > 0) {
        const totalMonthlyDebt = existingLoans.reduce((sum, l) => sum + l.monthlyEMI.toNumber(), 0);
        const monthlyIncome = employment.monthlyGrossIncome.toNumber();
        if (monthlyIncome > 0 && (totalMonthlyDebt / monthlyIncome) > 0.9) {
          flags.push({
            field: 'debtToIncomeRatio',
            issue: `Existing debt payments (${totalMonthlyDebt}) exceed 90% of monthly income (${monthlyIncome})`,
            severity: 'HIGH',
          });
        }
      }

      await prisma.portfolioVerification.upsert({
        where: { userId },
        create: {
          userId,
          flagsCount: flags.length,
          flagDetails: flags,
        },
        update: {
          flagsCount: flags.length,
          flagDetails: flags,
        },
      });

      logger.info({ userId, flagsCount: flags.length }, 'Anomaly detection completed');

      return { flags, flagsCount: flags.length };
    } catch (error) {
      if (error instanceof AppError) throw error;
      const message = error instanceof Error ? error.message : 'Unknown error';
      logger.error({ err: error, userId }, `Failed to detect anomalies: ${message}`);
      throw new AppError('Failed to detect anomalies', 500, { cause: message });
    }
  },

  async updateVerificationStatus(userId: string, status: string, adminNotes?: string, reviewedBy?: string) {
    try {
      const updated = await prisma.portfolioVerification.upsert({
        where: { userId },
        create: {
          userId,
          verificationStatus: status,
          adminNotes: adminNotes ?? null,
          reviewedBy: reviewedBy ?? null,
          reviewedAt: status === 'VERIFIED' || status === 'REJECTED' ? new Date() : null,
        },
        update: {
          verificationStatus: status,
          adminNotes: adminNotes ?? null,
          reviewedBy: reviewedBy ?? null,
          reviewedAt: status === 'VERIFIED' || status === 'REJECTED' ? new Date() : null,
        },
      });

      logger.info({ userId, status, reviewedBy }, 'Portfolio verification status updated');

      return updated;
    } catch (error) {
      if (error instanceof AppError) throw error;
      const message = error instanceof Error ? error.message : 'Unknown error';
      logger.error({ err: error, userId }, `Failed to update verification status: ${message}`);
      throw new AppError('Failed to update verification status', 500, { cause: message });
    }
  },

  async getPortfolioSummary(userId: string) {
    try {
      const [employment, verification, documents, loanFeatures, activeAccounts] = await Promise.all([
        prisma.employmentInfo.findUnique({ where: { userId } }),
        prisma.portfolioVerification.findUnique({ where: { userId } }),
        prisma.financialDocument.findMany({
          where: { userId, isDeleted: false },
          orderBy: { createdAt: 'desc' },
        }),
        prisma.loanFeatures.findUnique({ where: { userId } }),
        prisma.loanAccount.findMany({ where: { userId, isActive: true } }),
      ]);

      return {
        employment,
        verification,
        documents,
        loanFeatures,
        activeAccounts,
        isComplete: verification?.verificationStatus === 'VERIFIED',
        documentSummary: {
          total: documents.length,
          verified: documents.filter((d) => d.verificationStatus === 'VERIFIED').length,
          pending: documents.filter((d) => d.verificationStatus === 'PENDING').length,
        },
      };
    } catch (error) {
      if (error instanceof AppError) throw error;
      const message = error instanceof Error ? error.message : 'Unknown error';
      logger.error({ err: error, userId }, `Failed to get portfolio summary: ${message}`);
      throw new AppError('Failed to get portfolio summary', 500, { cause: message });
    }
  },

  async generateVerificationReport(userId: string) {
    try {
      const summary = await this.getPortfolioSummary(userId);

      const report = {
        generatedAt: new Date().toISOString(),
        userId,
        employmentInfo: summary.employment ? {
          status: summary.employment.employmentStatus,
          jobTitle: summary.employment.occupationJobTitle,
          employer: summary.employment.employerName,
          monthlyIncome: summary.employment.monthlyGrossIncome.toNumber(),
          annualIncome: summary.employment.annualIncome.toNumber(),
          dependents: summary.employment.dependentsCount,
          tenureMonths: summary.employment.employmentTenureMonths,
          stabilityScore: summary.employment.incomeStabilityScore,
        } : null,
        verification: summary.verification ? {
          status: summary.verification.verificationStatus,
          riskScore: summary.verification.overallRiskScore,
          riskLevel: summary.verification.riskLevel,
          flagsCount: summary.verification.flagsCount,
          flags: summary.verification.flagDetails,
          loanToIncomeRatio: summary.verification.loanToIncomeRatio?.toNumber(),
          emiToIncomeRatio: summary.verification.emiToIncomeRatio?.toNumber(),
        } : null,
        documents: summary.documents.map((d) => ({
          id: d.id,
          type: d.documentType,
          status: d.verificationStatus,
          ocrConfidence: d.ocrConfidence,
          uploadedAt: d.createdAt,
        })),
        activeLoans: summary.activeAccounts.map((a) => ({
          id: a.id,
          principal: a.principalAmount.toNumber(),
          outstanding: a.outstandingBalance.toNumber(),
          monthlyEMI: a.monthlyEMI.toNumber(),
          status: a.status,
        })),
        loanFeatures: summary.loanFeatures ? {
          requestedAmount: summary.loanFeatures.requestedLoanAmount.toNumber(),
          emi: summary.loanFeatures.calculatedEMI.toNumber(),
          creditIncomePercent: summary.loanFeatures.creditIncomePercent.toNumber(),
          annuityIncomePercent: summary.loanFeatures.annuityIncomePercent.toNumber(),
          debtToIncomeRatio: summary.loanFeatures.debtToIncomeRatio.toNumber(),
        } : null,
      };

      return report;
    } catch (error) {
      if (error instanceof AppError) throw error;
      const message = error instanceof Error ? error.message : 'Unknown error';
      logger.error({ err: error, userId }, `Failed to generate verification report: ${message}`);
      throw new AppError('Failed to generate verification report', 500, { cause: message });
    }
  },

  async listPendingVerifications(page: number = 1, limit: number = 10) {
    try {
      const skip = (page - 1) * limit;

      const [items, total] = await Promise.all([
        prisma.portfolioVerification.findMany({
          where: {
            verificationStatus: { in: ['INCOMPLETE', 'PENDING_REVIEW'] },
          },
          include: {
            user: {
              select: {
                id: true,
                email: true,
                profile: { select: { fullName: true } },
                employmentInfo: { select: { employmentStatus: true, annualIncome: true } },
              },
            },
          },
          orderBy: { lastUpdated: 'asc' },
          take: limit,
          skip,
        }),
        prisma.portfolioVerification.count({
          where: {
            verificationStatus: { in: ['INCOMPLETE', 'PENDING_REVIEW'] },
          },
        }),
      ]);

      return { items, total, page, limit };
    } catch (error) {
      if (error instanceof AppError) throw error;
      const message = error instanceof Error ? error.message : 'Unknown error';
      logger.error({ err: error }, `Failed to list pending verifications: ${message}`);
      throw new AppError('Failed to list pending verifications', 500, { cause: message });
    }
  },
};
