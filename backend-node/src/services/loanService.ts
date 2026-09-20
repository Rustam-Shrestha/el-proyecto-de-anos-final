import { prisma } from '@/config/database';
import { logger } from '@/config/logger';
import { AppError } from '@/utils/AppError';
import { riskService } from '@/services/riskService';
import { LoanPurpose, LoanStatus, Prisma } from '@prisma/client';
import { notificationService } from '@/services/notificationService';
import { finguardProxyService } from '@/services/finguardProxyService';
import { centralRegistry } from '@/services/centralLoanRegistry';

export interface ApplyLoanInput {
  requestedAmount: number;
  tenureMonths: number;
  purpose: LoanPurpose;
}

function isTenantSchemaError(e: unknown): boolean {
  const code = (e as { code?: string })?.code;
  const msg = String((e as { message?: string })?.message ?? (e as Error)?.message ?? "");
  return code === "P2021" || code === "P2022" || msg.includes("auth.tenants") || msg.includes("tenantId") || msg.includes("does not exist");
}

export const loanService = {
  async applyForLoan(userId: string, data: ApplyLoanInput, tenantId?: number) {
    try {
      const tid = tenantId ?? 1;
      let kyc: Awaited<ReturnType<typeof prisma.kycApplication.findFirst>>;
      try {
        kyc = await prisma.kycApplication.findFirst({
          where: { userId, tenantId: tid, status: 'APPROVED' },
          orderBy: { createdAt: 'desc' },
        });
      } catch (e) {
        if (isTenantSchemaError(e)) {
          kyc = await prisma.kycApplication.findFirst({ where: { userId, status: 'APPROVED' }, orderBy: { createdAt: 'desc' } });
        } else throw e;
      }

      if (!kyc) {
        throw new AppError('You must have an approved KYC before applying for a loan', 400);
      }

      const portfolio = await prisma.portfolioVerification.findUnique({
        where: { userId },
      });

      if (!portfolio || portfolio.verificationStatus !== 'VERIFIED' || (portfolio as unknown as { tenantId?: number }).tenantId !== undefined && (portfolio as unknown as { tenantId: number }).tenantId !== tid) {
        throw new AppError(
          'Your financial portfolio must be verified before applying for a loan. Complete your employment info and document upload, then wait for admin verification.',
          400
        );
      }

      const emi = riskService.calculateEmi(data.requestedAmount, data.tenureMonths);

      const { riskScore, riskLevel, features } = await riskService.computeRiskScore(
        userId,
        data.requestedAmount,
        data.tenureMonths
      );

      await prisma.borrowerFeatures.upsert({
        where: { userId },
        create: {
          userId,
          amtIncomeTotal: features.amtIncomeTotal,
          daysEmployed: features.daysEmployed,
          debtToIncomeRatio: features.debtToIncomeRatio,
          cntInstalment: features.cntInstalment,
          amtCredit: features.amtCredit,
          computedAt: new Date(),
        },
        update: {
          amtIncomeTotal: features.amtIncomeTotal,
          daysEmployed: features.daysEmployed,
          debtToIncomeRatio: features.debtToIncomeRatio,
          cntInstalment: features.cntInstalment,
          amtCredit: features.amtCredit,
          computedAt: new Date(),
        },
      });

      const exposure = await centralRegistry.getExposureByUser(userId).catch(()=> ({ totalOutstanding:0, totalMonthlyEMI:0, activeCount:0, loans:[] as any[] }));
      logger.info({ userId, exposure }, "Centralized outstanding before new loan");
      // FinGuard ML prediction (non-blocking fallback to heuristic) — include exposure
      let ml: Awaited<ReturnType<typeof finguardProxyService.evaluate>> = null;
      try {
        const employment = await prisma.employmentInfo.findUnique({ where: { userId } });
        const profile = await prisma.profile.findUnique({ where: { userId } });
        const daysBirth = profile?.dateOfBirth
          ? -Math.floor((Date.now() - new Date(profile.dateOfBirth).getTime()) / 86400000)
          : -12000;
        const daysEmployed = employment?.employmentStartDate
          ? -Math.floor((Date.now() - new Date(employment.employmentStartDate).getTime()) / 86400000)
          : 365243;
        ml = await finguardProxyService.evaluate({
          amt_income_total: features.amtIncomeTotal ?? Number(employment?.annualIncome ?? 0),
          amt_credit: data.requestedAmount,
          amt_annuity: emi,
          days_birth: daysBirth,
          days_employed: daysEmployed,
          cnt_children: employment?.dependentsCount ?? 0,
          cnt_fam_members: (employment?.dependentsCount ?? 0) + 1,
          occupation_type: employment?.occupationJobTitle ?? undefined,
        });
      } catch { /* ignore ml error */ }

      let loan: Awaited<ReturnType<typeof prisma.loanApplication.create>>;
      try {
        loan = await prisma.loanApplication.create({
          data: {
            tenantId: tid,
            userId,
            requestedAmount: data.requestedAmount,
            tenureMonths: data.tenureMonths,
            purpose: data.purpose,
            calculatedEmi: emi,
            status: 'SUBMITTED',
            riskScore: ml ? Math.round(ml.default_probability * 100) : riskScore,
            riskLevel: ml ? (ml.risk_band.toUpperCase() as typeof riskLevel) : riskLevel,
            defaultProbability: ml?.default_probability,
            modelVersion: ml?.model_version,
            shapValues: ml?.shap_summary as unknown as Prisma.InputJsonValue | undefined,
            featureSnapshot: { amtIncomeTotal: features.amtIncomeTotal, amtCredit: data.requestedAmount, outstandingBefore: (exposure as any).totalOutstanding, monthlyEMIBefore: (exposure as any).totalMonthlyEMI, activeLoansBefore: (exposure as any).activeCount } as unknown as Prisma.InputJsonValue,
            mlDecision: ml?.decision,
            creditScore: ml?.credit_score,
          },
          include: { user: { select: { id: true, email: true } } },
        });
      } catch (e) {
        if (isTenantSchemaError(e)) {
          loan = await prisma.loanApplication.create({
            data: {
              userId,
              requestedAmount: data.requestedAmount,
              tenureMonths: data.tenureMonths,
              purpose: data.purpose,
              calculatedEmi: emi,
              status: 'SUBMITTED',
              riskScore: ml ? Math.round(ml.default_probability * 100) : riskScore,
              riskLevel: ml ? (ml.risk_band.toUpperCase() as typeof riskLevel) : riskLevel,
              defaultProbability: ml?.default_probability,
              modelVersion: ml?.model_version,
              shapValues: ml?.shap_summary as unknown as Prisma.InputJsonValue | undefined,
              featureSnapshot: ml ? ({ amtIncomeTotal: features.amtIncomeTotal, amtCredit: data.requestedAmount } as unknown as Prisma.InputJsonValue) : undefined,
              mlDecision: ml?.decision,
              creditScore: ml?.credit_score,
            },
            include: { user: { select: { id: true, email: true } } },
          });
        } else throw e;
      }

      logger.info(
        { userId, loanId: loan.id, riskScore, riskLevel },
        'Loan application submitted'
      );

      return loan;
    } catch (error) {
      if (error instanceof AppError) throw error;
      logger.error({ err: error, userId }, 'Failed to apply for loan');
      throw new AppError('Failed to apply for loan', 500);
    }
  },

  async getLoanById(loanId: string, requestingUserId: string, requestingUserRole: string, tenantId?: number) {
    try {
      let loan: Awaited<ReturnType<typeof prisma.loanApplication.findFirst>>;
      try {
        loan = await prisma.loanApplication.findFirst({
          where: { id: loanId, tenantId: tenantId ?? 1 },
        include: {
          user: {
            select: { id: true, email: true },
          },
          reviewedByUser: {
            select: { id: true, email: true },
          },
        },
        });
      } catch (e) {
        if (isTenantSchemaError(e)) {
          loan = await prisma.loanApplication.findFirst({
            where: { id: loanId },
            include: {
              user: { select: { id: true, email: true } },
              reviewedByUser: { select: { id: true, email: true } },
            },
          });
        } else throw e;
      }

      if (!loan) {
        throw new AppError('Loan application not found', 404);
      }

      if (requestingUserRole !== 'ADMIN' && requestingUserRole !== 'REVIEWER' && loan.userId !== requestingUserId) {
        throw new AppError('You do not have access to this loan application', 403);
      }

      return loan;
    } catch (error) {
      if (error instanceof AppError) throw error;
      logger.error({ err: error, loanId }, 'Failed to fetch loan');
      throw new AppError('Failed to fetch loan application', 500);
    }
  },

  async listLoans(
    filters: {
      status?: LoanStatus;
      userId?: string;
      page: number;
      limit: number;
      tenantId?: number;
    },
    requestingUserRole: string,
    requestingUserId?: string
  ) {
    try {
      const where: Prisma.LoanApplicationWhereInput = { tenantId: filters.tenantId ?? 1 };

      if (filters.status) {
        where.status = filters.status;
      }

      if (requestingUserRole === 'USER') {
        where.userId = requestingUserId;
      } else if (filters.userId) {
        where.userId = filters.userId;
      }

      const skip = (filters.page - 1) * filters.limit;

      try {
        const [loans, total] = await Promise.all([
          prisma.loanApplication.findMany({
            where,
            include: { user: { select: { id: true, email: true } } },
            orderBy: { createdAt: 'desc' },
            take: filters.limit,
            skip,
          }),
          prisma.loanApplication.count({ where }),
        ]);
        return { loans, total };
      } catch (e) {
        if (!isTenantSchemaError(e)) throw e;
        const fallbackWhere: Prisma.LoanApplicationWhereInput = {};
        if (filters.status) fallbackWhere.status = filters.status;
        if (requestingUserRole === 'USER') fallbackWhere.userId = requestingUserId;
        else if (filters.userId) fallbackWhere.userId = filters.userId;
        const [loans, total] = await Promise.all([
          prisma.loanApplication.findMany({
            where: fallbackWhere,
            include: { user: { select: { id: true, email: true } } },
            orderBy: { createdAt: 'desc' },
            take: filters.limit,
            skip,
          }),
          prisma.loanApplication.count({ where: fallbackWhere }),
        ]);
        return { loans, total };
      }
    } catch (error) {
      if (error instanceof AppError) throw error;
      logger.error({ err: error }, 'Failed to list loans');
      throw new AppError('Failed to list loan applications', 500);
    }
  },

  async reviewLoan(
    loanId: string,
    reviewerId: string,
    action: 'APPROVED' | 'REJECTED',
    notes?: string,
    tenantId?: number
  ) {
    try {
      let loan: Awaited<ReturnType<typeof prisma.loanApplication.findFirst>>;
      try {
        loan = await prisma.loanApplication.findFirst({ where: { id: loanId, tenantId: tenantId ?? 1 } });
      } catch (e) {
        if (isTenantSchemaError(e)) loan = await prisma.loanApplication.findFirst({ where: { id: loanId } });
        else throw e;
      }

      if (!loan) {
        throw new AppError('Loan application not found', 404);
      }

      if (loan.status !== 'SUBMITTED' && loan.status !== 'UNDER_REVIEW') {
        throw new AppError('Loan application has already been reviewed', 400);
      }

      const updated = await prisma.loanApplication.update({
        where: { id: loanId },
        data: {
          status: action,
          reviewedBy: reviewerId,
          reviewedAt: new Date(),
          loanOfficerNotes: notes ?? null,
        },
        include: {
          user: {
            select: { id: true, email: true },
          },
          reviewedByUser: {
            select: { id: true, email: true },
          },
        },
      });

      logger.info(
        { loanId, reviewerId, action },
        `Loan application ${action.toLowerCase()}`
      );

      await notificationService.create({
        userId: updated.userId,
        type: action === 'APPROVED' ? 'LOAN_APPROVED' : 'LOAN_REJECTED',
        title: action === 'APPROVED' ? 'Loan Application Approved' : 'Loan Application Rejected',
        message:
          action === 'APPROVED'
            ? `Your loan application has been approved. Disbursement will occur within 2-3 business days.`
            : `Your loan application was not approved.${notes ? ` Reason: ${notes}` : ''}`,
        relatedEntityType: 'LoanApplication',
        relatedEntityId: loanId,
        actionUrl: `/loans/${loanId}`,
        priority: 'CRITICAL',
        metadata: { status: action, notes: notes ?? null, requestedAmount: loan.requestedAmount },
      });

      return updated;
    } catch (error) {
      if (error instanceof AppError) throw error;
      logger.error({ err: error, loanId }, 'Failed to review loan');
      throw new AppError('Failed to review loan application', 500);
    }
  },
};
