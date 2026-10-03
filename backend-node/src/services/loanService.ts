import { prisma } from '@/config/database';
import { logger } from '@/config/logger';
import { AppError } from '@/utils/AppError';
import { riskService } from '@/services/riskService';
import { LoanPurpose, LoanStatus, Prisma } from '@prisma/client';
import { notificationService } from '@/services/notificationService';
import { mailService } from '@/services/mailService';
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
      // Two-stage KYC: document approval is global (superadmin, one-time,
      // reusable across tenants). Financial verification stays per-tenant
      // via the portfolio check below.
      let kyc: Awaited<ReturnType<typeof prisma.kycApplication.findFirst>>;
      try {
        kyc = await prisma.kycApplication.findFirst({
          where: { userId, status: 'APPROVED' },
          orderBy: { createdAt: 'desc' },
        });
      } catch (e) {
        if (isTenantSchemaError(e)) {
          kyc = await prisma.kycApplication.findFirst({ where: { userId, tenantId: tid, status: 'APPROVED' }, orderBy: { createdAt: 'desc' } });
        } else throw e;
      }

      if (!kyc) {
        throw new AppError('You must have an approved KYC before applying for a loan', 400);
      }

      // Stage 2: the tenant reviewer verifies income + employment together with
      // the loan, so the customer is not blocked by a pre-approved portfolio.
      // The one-time profile is reused as-is; only an explicit rejection (or a
      // missing employment record) is surfaced to the customer/reviewer.
      const [portfolio, employmentForGate] = await Promise.all([
        prisma.portfolioVerification.findUnique({ where: { userId } }),
        prisma.employmentInfo.findUnique({ where: { userId } }),
      ]);

      if (portfolio?.verificationStatus === 'REJECTED') {
        throw new AppError(
          'Your financial profile was rejected during review. Correct the details and try again.',
          400
        );
      }

      const profileIncomplete = !employmentForGate;

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
        const [employment, profile] = await Promise.all([
          prisma.employmentInfo.findFirst({ where: { userId } }),
          prisma.profile.findUnique({ where: { userId } }),
        ]);

        const today = new Date();
        let daysBirth = -10957;
        if (profile?.dateOfBirth) {
          const b = new Date(profile.dateOfBirth);
          if (!isNaN(b.getTime())) {
            const diff = Math.floor((today.getTime() - b.getTime()) / 86400000);
            daysBirth = -Math.min(30000, Math.max(6000, diff));
          }
        }

        let daysEmployed = 365243;
        if (employment?.employmentStartDate) {
          const e = new Date(employment.employmentStartDate);
          if (!isNaN(e.getTime())) {
            const diff = Math.floor((today.getTime() - e.getTime()) / 86400000);
            daysEmployed = -Math.min(20000, Math.max(0, diff));
          }
        }

        const annualIncome = features.amtIncomeTotal ?? (employment?.annualIncome
          ? Number(employment.annualIncome)
          : (employment?.monthlyGrossIncome ? Number(employment.monthlyGrossIncome) * 12 : 500000));

        ml = await finguardProxyService.evaluate({
          amt_income_total: annualIncome,
          amt_credit: data.requestedAmount,
          amt_annuity: emi,
          amt_goods_price: data.requestedAmount,
          days_birth: daysBirth,
          days_employed: daysEmployed,
          cnt_children: employment?.dependentsCount ?? 0,
          cnt_fam_members: (employment?.dependentsCount ?? 0) + 1,
          occupation_type: employment?.occupationJobTitle ?? undefined,
          organization_type: employment?.businessType ?? undefined,
          ext_source_2: employment?.incomeStabilityScore ? (Number(employment.incomeStabilityScore) / 100) : undefined,
        });
      } catch { /* ignore ml error */ }

      let loan: Awaited<ReturnType<typeof prisma.loanApplication.create>>;
      // Tell the reviewer when the reusable financial profile is thin, instead
      // of blocking the customer before the tenant ever reviews it.
      const reviewerNote = profileIncomplete
        ? 'Customer has not completed employment/income details yet — request them before deciding.'
        : null;
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
            ...(reviewerNote ? { loanOfficerNotes: reviewerNote } : {}),
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
      const roleUpper = (requestingUserRole || '').toUpperCase();
      const isCustomer = roleUpper === 'USER' || roleUpper === 'CUSTOMER';
      let loan: Awaited<ReturnType<typeof prisma.loanApplication.findFirst>>;
      try {
        if (isCustomer || roleUpper === 'SUPERADMIN' || !tenantId) {
          loan = await prisma.loanApplication.findUnique({
            where: { id: loanId },
            include: {
              user: { select: { id: true, email: true } },
              reviewedByUser: { select: { id: true, email: true } },
            },
          });
        } else {
          loan = await prisma.loanApplication.findFirst({
            where: { id: loanId, tenantId },
            include: {
              user: { select: { id: true, email: true } },
              reviewedByUser: { select: { id: true, email: true } },
            },
          });
        }
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
        // Fallback global lookup
        loan = await prisma.loanApplication.findUnique({
          where: { id: loanId },
          include: {
            user: { select: { id: true, email: true } },
            reviewedByUser: { select: { id: true, email: true } },
          },
        });
      }

      if (!loan) {
        throw new AppError('Loan application not found', 404);
      }

      if (roleUpper !== 'ADMIN' && roleUpper !== 'REVIEWER' && roleUpper !== 'SUPERADMIN' && loan.userId !== requestingUserId) {
        throw new AppError('You do not have access to this loan application', 403);
      }

      // Auto-score unscored loans on the fly
      if (loan && (loan.defaultProbability === null || loan.defaultProbability === undefined || loan.creditScore === null)) {
        try {
          const [employment, profile] = await Promise.all([
            prisma.employmentInfo.findFirst({ where: { userId: loan.userId } }),
            prisma.profile.findUnique({ where: { userId: loan.userId } }),
          ]);

          const today = new Date();
          let daysBirth = -10957;
          if (profile?.dateOfBirth) {
            const b = new Date(profile.dateOfBirth);
            if (!isNaN(b.getTime())) {
              const diff = Math.floor((today.getTime() - b.getTime()) / 86400000);
              daysBirth = -Math.min(30000, Math.max(6000, diff));
            }
          }

          let daysEmployed = 365243;
          if (employment?.employmentStartDate) {
            const e = new Date(employment.employmentStartDate);
            if (!isNaN(e.getTime())) {
              const diff = Math.floor((today.getTime() - e.getTime()) / 86400000);
              daysEmployed = -Math.min(20000, Math.max(0, diff));
            }
          }

          const annualIncome = employment?.annualIncome
            ? Number(employment.annualIncome)
            : (employment?.monthlyGrossIncome ? Number(employment.monthlyGrossIncome) * 12 : 500000);

          const ml = await finguardProxyService.evaluate({
            amt_income_total: annualIncome,
            amt_credit: Number(loan.requestedAmount),
            amt_annuity: Number(loan.calculatedEmi) || 0,
            amt_goods_price: Number(loan.requestedAmount),
            days_birth: daysBirth,
            days_employed: daysEmployed,
            cnt_children: employment?.dependentsCount ?? 0,
            cnt_fam_members: (employment?.dependentsCount ?? 0) + 1,
            occupation_type: employment?.occupationJobTitle ?? undefined,
            organization_type: employment?.businessType ?? undefined,
            ext_source_2: employment?.incomeStabilityScore ? (Number(employment.incomeStabilityScore) / 100) : undefined,
          });

          if (ml) {
            loan = await prisma.loanApplication.update({
              where: { id: loan.id },
              data: {
                riskScore: Math.round(ml.default_probability * 100),
                riskLevel: (ml.risk_band.toUpperCase() as typeof loan.riskLevel) || loan.riskLevel,
                defaultProbability: ml.default_probability,
                modelVersion: ml.model_version,
                shapValues: ml.shap_summary as unknown as Prisma.InputJsonValue | undefined,
                mlDecision: ml.decision,
                creditScore: ml.credit_score,
              },
              include: {
                user: { select: { id: true, email: true } },
                reviewedByUser: { select: { id: true, email: true } },
              },
            });
          }
        } catch {
          // ignore on-the-fly score error
        }
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
      const roleUpper = (requestingUserRole || '').toUpperCase();
      const isCustomer = roleUpper === 'USER' || roleUpper === 'CUSTOMER';
      const where: Prisma.LoanApplicationWhereInput = {};

      if (isCustomer) {
        where.userId = requestingUserId;
        if (filters.status) {
          where.status = filters.status;
        }
      } else {
        if (filters.tenantId) {
          where.tenantId = filters.tenantId;
        } else if (roleUpper !== 'SUPERADMIN') {
          where.tenantId = 1;
        }
        if (filters.status) {
          where.status = filters.status;
        }
        if (filters.userId) {
          where.userId = filters.userId;
        }
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
        if (roleUpper === 'USER') fallbackWhere.userId = requestingUserId;
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

      // Loan decision email (fire-and-forget, never blocks the review)
      if (updated.user?.email) {
        if (action === 'APPROVED') {
          mailService.sendLoanApprovedMail(updated.user.email, Number(loan.requestedAmount));
        } else {
          mailService.sendLoanRejectedMail(updated.user.email, undefined, notes ?? undefined);
        }
      }

      return updated;
    } catch (error) {
      if (error instanceof AppError) throw error;
      logger.error({ err: error, loanId }, 'Failed to review loan');
      throw new AppError('Failed to review loan application', 500);
    }
  },
};
