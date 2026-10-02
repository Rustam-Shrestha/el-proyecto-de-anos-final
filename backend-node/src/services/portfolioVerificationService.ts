import { prisma } from '@/config/database';
import { logger } from '@/config/logger';
import { AppError } from '@/utils/AppError';
import { Prisma } from '@prisma/client';
import { notificationService } from '@/services/notificationService';

function resolveTid(tenantId?: number): number {
  if (tenantId === undefined || tenantId === null) {
    logger.warn("portfolioVerificationService: tenantId not provided, falling back to 1");
    return 1;
  }
  return tenantId;
}
function isTenantSchemaError(e: unknown): boolean {
  const code = (e as { code?: string })?.code;
  const msg = String((e as { message?: string })?.message ?? (e as Error)?.message ?? "");
  return code === "P2021" || code === "P2022" || msg.includes("tenantId") || msg.includes("tenant_id") || msg.includes("does not exist");
}

export const portfolioVerificationService = {
  async calculatePortfolioMetrics(userId: string, tenantId?: number) {
    try {
      const tid = resolveTid(tenantId);
      let employment: Awaited<ReturnType<typeof prisma.employmentInfo.findFirst>>;
      let profile: Awaited<ReturnType<typeof prisma.profile.findUnique>>;
      let loanFeatures: Awaited<ReturnType<typeof prisma.loanFeatures.findFirst>>;
      let activeAccounts: Awaited<ReturnType<typeof prisma.loanAccount.findMany>>;
      try {
        [employment, profile, loanFeatures, activeAccounts] = await Promise.all([
          prisma.employmentInfo.findFirst({ where: { userId, tenantId: tid } }),
          prisma.profile.findUnique({ where: { userId } }),
          prisma.loanFeatures.findFirst({ where: { userId, tenantId: tid } }),
          prisma.loanAccount.findMany({ where: { userId, tenantId: tid, isActive: true } }),
        ]);
      } catch (e) {
        if (isTenantSchemaError(e)) {
          [employment, profile, loanFeatures, activeAccounts] = await Promise.all([
            prisma.employmentInfo.findUnique({ where: { userId } }) as never,
            prisma.profile.findUnique({ where: { userId } }),
            prisma.loanFeatures.findUnique({ where: { userId } }) as never,
            prisma.loanAccount.findMany({ where: { userId, isActive: true } }),
          ]);
        } else throw e;
      }

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

      // tenant-aware upsert via findFirst + update/create to allow tenantId filtering (userId unique constraint)
      let portfolio: Awaited<ReturnType<typeof prisma.portfolioVerification.findFirst>>;
      try {
        const existing = await prisma.portfolioVerification.findFirst({ where: { userId, tenantId: tid } });
        if (existing) {
          portfolio = await prisma.portfolioVerification.update({
            where: { id: existing.id },
            data: {
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
        } else {
          try {
            portfolio = await prisma.portfolioVerification.create({
              data: {
                tenantId: tid,
                userId,
                loanToIncomeRatio: new Prisma.Decimal(loanToIncomeRatio.toFixed(2)),
                emiToIncomeRatio: new Prisma.Decimal(emiToIncomeRatio.toFixed(2)),
                incomePerDependent: new Prisma.Decimal(incomePerDependent.toFixed(2)),
                employmentStabilityScore,
                ageCategory,
                overallRiskScore: clampedRiskScore,
                riskLevel,
              },
            });
          } catch (e) {
            if (isTenantSchemaError(e)) {
              portfolio = await prisma.portfolioVerification.upsert({
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
              }) as never;
            } else throw e;
          }
        }
      } catch (e) {
        if (isTenantSchemaError(e)) {
          portfolio = await prisma.portfolioVerification.upsert({
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
          }) as never;
        } else throw e;
      }

      logger.info({ userId, tenantId: tid, riskScore: clampedRiskScore, riskLevel }, 'Portfolio metrics calculated');

      return portfolio!;
    } catch (error) {
      if (error instanceof AppError) throw error;
      const cause = error instanceof Error ? error.message : 'Unknown error';
      const detail = `Portfolio metrics calculation failed for user ${userId}. Root cause: ${cause}`;
      logger.error({ err: error, userId }, detail);
      throw new AppError(detail, 500, { cause });
    }
  },

  async detectAnomalies(userId: string, tenantId?: number) {
    try {
      const tid = resolveTid(tenantId);
      let employment: Awaited<ReturnType<typeof prisma.employmentInfo.findFirst>>;
      let documents: Awaited<ReturnType<typeof prisma.financialDocument.findMany>>;
      try {
        [employment, documents] = await Promise.all([
          prisma.employmentInfo.findFirst({ where: { userId, tenantId: tid } }),
          prisma.financialDocument.findMany({
            where: { userId, tenantId: tid, isDeleted: false, ocrStatus: 'COMPLETED' },
          }),
        ]);
      } catch (e) {
        if (isTenantSchemaError(e)) {
          [employment, documents] = await Promise.all([
            prisma.employmentInfo.findUnique({ where: { userId } }) as never,
            prisma.financialDocument.findMany({ where: { userId, isDeleted: false, ocrStatus: 'COMPLETED' } }),
          ]);
        } else throw e;
      }

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

      let existingLoans: Awaited<ReturnType<typeof prisma.loanAccount.findMany>>;
      try {
        existingLoans = await prisma.loanAccount.findMany({ where: { userId, tenantId: tid, isActive: true } });
      } catch (e) {
        if (isTenantSchemaError(e)) existingLoans = await prisma.loanAccount.findMany({ where: { userId, isActive: true } });
        else throw e;
      }
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

      try {
        const existingPv = await prisma.portfolioVerification.findFirst({ where: { userId, tenantId: tid } });
        if (existingPv) {
          await prisma.portfolioVerification.update({ where: { id: existingPv.id }, data: { flagsCount: flags.length, flagDetails: flags as unknown as Prisma.InputJsonValue } });
        } else {
          try {
            await prisma.portfolioVerification.create({ data: { tenantId: tid, userId, flagsCount: flags.length, flagDetails: flags as unknown as Prisma.InputJsonValue } });
          } catch (e) {
            if (isTenantSchemaError(e)) {
              await prisma.portfolioVerification.upsert({ where: { userId }, create: { userId, flagsCount: flags.length, flagDetails: flags as unknown as Prisma.InputJsonValue }, update: { flagsCount: flags.length, flagDetails: flags as unknown as Prisma.InputJsonValue } });
            } else throw e;
          }
        }
      } catch (e) {
        if (isTenantSchemaError(e)) {
          await prisma.portfolioVerification.upsert({ where: { userId }, create: { userId, flagsCount: flags.length, flagDetails: flags as unknown as Prisma.InputJsonValue }, update: { flagsCount: flags.length, flagDetails: flags as unknown as Prisma.InputJsonValue } });
        } else throw e;
      }

      logger.info({ userId, tenantId: tid, flagsCount: flags.length }, 'Anomaly detection completed');

      return { flags, flagsCount: flags.length };
    } catch (error) {
      if (error instanceof AppError) throw error;
      const cause = error instanceof Error ? error.message : 'Unknown error';
      const detail = `Anomaly detection failed for user ${userId}. Root cause: ${cause}`;
      logger.error({ err: error, userId }, detail);
      throw new AppError(detail, 500, { cause });
    }
  },

  async updateVerificationStatus(userId: string, status: string, adminNotes?: string, reviewedBy?: string, tenantId?: number) {
    try {
      const tid = resolveTid(tenantId);
      let updated: Awaited<ReturnType<typeof prisma.portfolioVerification.findFirst>>;
      try {
        const existing = await prisma.portfolioVerification.findFirst({ where: { userId, tenantId: tid } });
        if (existing) {
          updated = await prisma.portfolioVerification.update({
            where: { id: existing.id },
            data: {
              verificationStatus: status,
              adminNotes: adminNotes ?? null,
              reviewedBy: reviewedBy ?? null,
              reviewedAt: status === 'VERIFIED' || status === 'REJECTED' ? new Date() : null,
            },
          });
        } else {
          try {
            updated = await prisma.portfolioVerification.create({
              data: {
                tenantId: tid,
                userId,
                verificationStatus: status,
                adminNotes: adminNotes ?? null,
                reviewedBy: reviewedBy ?? null,
                reviewedAt: status === 'VERIFIED' || status === 'REJECTED' ? new Date() : null,
              },
            });
          } catch (e) {
            if (isTenantSchemaError(e)) {
              updated = await prisma.portfolioVerification.upsert({
                where: { userId },
                create: { userId, verificationStatus: status, adminNotes: adminNotes ?? null, reviewedBy: reviewedBy ?? null, reviewedAt: status === 'VERIFIED' || status === 'REJECTED' ? new Date() : null },
                update: { verificationStatus: status, adminNotes: adminNotes ?? null, reviewedBy: reviewedBy ?? null, reviewedAt: status === 'VERIFIED' || status === 'REJECTED' ? new Date() : null },
              }) as never;
            } else throw e;
          }
        }
      } catch (e) {
        if (isTenantSchemaError(e)) {
          updated = await prisma.portfolioVerification.upsert({
            where: { userId },
            create: { userId, verificationStatus: status, adminNotes: adminNotes ?? null, reviewedBy: reviewedBy ?? null, reviewedAt: status === 'VERIFIED' || status === 'REJECTED' ? new Date() : null },
            update: { verificationStatus: status, adminNotes: adminNotes ?? null, reviewedBy: reviewedBy ?? null, reviewedAt: status === 'VERIFIED' || status === 'REJECTED' ? new Date() : null },
          }) as never;
        } else throw e;
      }

      logger.info({ userId, tenantId: tid, status, reviewedBy }, 'Portfolio verification status updated');

      if (status === 'VERIFIED' || status === 'REJECTED') {
        await notificationService.create({
          userId,
          tenantId: tid,
          type: status === 'VERIFIED' ? 'PORTFOLIO_APPROVED' : 'PORTFOLIO_REJECTED',
          title:
            status === 'VERIFIED'
              ? 'Portfolio Verified'
              : 'Portfolio Verification Rejected',
          message:
            status === 'VERIFIED'
              ? 'Your financial portfolio has been verified. You can now apply for a loan.'
              : `Your portfolio verification was not approved.${adminNotes ? ` Reason: ${adminNotes}` : ''}`,
          relatedEntityType: 'PortfolioVerification',
          actionUrl: status === 'VERIFIED' ? '/loans/apply' : '/portfolio',
          priority: status === 'REJECTED' ? 'CRITICAL' : 'HIGH',
          metadata: { status, reviewedBy: reviewedBy ?? null, adminNotes: adminNotes ?? null },
        });
      }

      return updated!;
    } catch (error) {
      if (error instanceof AppError) throw error;
      const cause = error instanceof Error ? error.message : 'Unknown error';
      const detail = `Portfolio verification status update failed for user ${userId}. Root cause: ${cause}`;
      logger.error({ err: error, userId }, detail);
      throw new AppError(detail, 500, { cause });
    }
  },

  async getPortfolioSummary(userId: string, tenantId?: number) {
    try {
      const tid = resolveTid(tenantId);
      let employment: Awaited<ReturnType<typeof prisma.employmentInfo.findFirst>>;
      let verification: Awaited<ReturnType<typeof prisma.portfolioVerification.findFirst>>;
      let documents: Awaited<ReturnType<typeof prisma.financialDocument.findMany>>;
      let loanFeatures: Awaited<ReturnType<typeof prisma.loanFeatures.findFirst>>;
      let activeAccounts: Awaited<ReturnType<typeof prisma.loanAccount.findMany>>;
      try {
        [employment, verification, documents, loanFeatures, activeAccounts] = await Promise.all([
          prisma.employmentInfo.findFirst({ where: { userId, tenantId: tid } }),
          prisma.portfolioVerification.findFirst({ where: { userId, tenantId: tid } }),
          prisma.financialDocument.findMany({ where: { userId, tenantId: tid, isDeleted: false }, orderBy: { createdAt: 'desc' } }),
          prisma.loanFeatures.findFirst({ where: { userId, tenantId: tid } }),
          prisma.loanAccount.findMany({ where: { userId, tenantId: tid, isActive: true } }),
        ]);
      } catch (e) {
        if (isTenantSchemaError(e)) {
          [employment, verification, documents, loanFeatures, activeAccounts] = await Promise.all([
            prisma.employmentInfo.findUnique({ where: { userId } }) as never,
            prisma.portfolioVerification.findUnique({ where: { userId } }) as never,
            prisma.financialDocument.findMany({ where: { userId, isDeleted: false }, orderBy: { createdAt: 'desc' } }),
            prisma.loanFeatures.findUnique({ where: { userId } }) as never,
            prisma.loanAccount.findMany({ where: { userId, isActive: true } }),
          ]);
        } else throw e;
      }

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
      const cause = error instanceof Error ? error.message : 'Unknown error';
      const detail = `Portfolio summary retrieval failed for user ${userId}. Root cause: ${cause}`;
      logger.error({ err: error, userId }, detail);
      throw new AppError(detail, 500, { cause });
    }
  },

  async generateVerificationReport(userId: string, tenantId?: number) {
    try {
      const tid = resolveTid(tenantId);
      const summary = await this.getPortfolioSummary(userId, tid);

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
      const cause = error instanceof Error ? error.message : 'Unknown error';
      const detail = `Verification report generation failed for user ${userId}. Root cause: ${cause}`;
      logger.error({ err: error, userId }, detail);
      throw new AppError(detail, 500, { cause });
    }
  },

  async listPendingVerifications(page: number = 1, limit: number = 10, tenantId?: number) {
    try {
      const skip = (page - 1) * limit;
      const tid = tenantId !== undefined ? tenantId : undefined;
      if (tid === undefined) logger.warn("portfolioVerificationService.listPendingVerifications: tenantId not provided, querying across tenants");
      const where: Prisma.PortfolioVerificationWhereInput = {
        verificationStatus: { in: ['INCOMPLETE', 'PENDING_REVIEW'] },
        ...(tid !== undefined ? { tenantId: tid } : {}),
      };

      try {
        const [items, total] = await Promise.all([
          prisma.portfolioVerification.findMany({
            where,
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
          prisma.portfolioVerification.count({ where }),
        ]);
        return { items, total, page, limit };
      } catch (e) {
        if (isTenantSchemaError(e)) {
          const fallbackWhere: Prisma.PortfolioVerificationWhereInput = { verificationStatus: { in: ['INCOMPLETE', 'PENDING_REVIEW'] } };
          const [items, total] = await Promise.all([
            prisma.portfolioVerification.findMany({
              where: fallbackWhere,
              include: { user: { select: { id: true, email: true, profile: { select: { fullName: true } }, employmentInfo: { select: { employmentStatus: true, annualIncome: true } } } } },
              orderBy: { lastUpdated: 'asc' },
              take: limit,
              skip,
            }),
            prisma.portfolioVerification.count({ where: fallbackWhere }),
          ]);
          return { items, total, page, limit };
        }
        throw e;
      }
    } catch (error) {
      if (error instanceof AppError) throw error;
      const cause = error instanceof Error ? error.message : 'Unknown error';
      const detail = `Failed to list pending verifications. Root cause: ${cause}`;
      logger.error({ err: error }, detail);
      throw new AppError(detail, 500, { cause });
    }
  },

  async getVerificationStatus(userId: string, tenantId?: number) {
    const tid = resolveTid(tenantId);
    try {
      const v = await prisma.portfolioVerification.findFirst({ where: { userId, tenantId: tid } });
      return v;
    } catch (e) {
      if (isTenantSchemaError(e)) return prisma.portfolioVerification.findUnique({ where: { userId } });
      throw e;
    }
  },

  async upsert(userId: string, data: Prisma.PortfolioVerificationCreateInput, tenantId?: number) {
    const tid = resolveTid(tenantId);
    const existing = await prisma.portfolioVerification.findFirst({ where: { userId, tenantId: tid } }).catch(() => null);
    if (existing) return prisma.portfolioVerification.update({ where: { id: existing.id }, data });
    try {
      return await prisma.portfolioVerification.create({ data: { ...data, tenantId: tid, user: { connect: { id: userId } } } as never });
    } catch (e) {
      if (isTenantSchemaError(e)) return prisma.portfolioVerification.upsert({ where: { userId }, create: data, update: data });
      throw e;
    }
  }
};
