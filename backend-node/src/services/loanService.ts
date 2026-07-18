import { prisma } from '@/config/database';
import { logger } from '@/config/logger';
import { AppError } from '@/utils/AppError';
import { riskService } from '@/services/riskService';
import { LoanPurpose, LoanStatus, Prisma } from '@prisma/client';

export interface ApplyLoanInput {
  requestedAmount: number;
  tenureMonths: number;
  purpose: LoanPurpose;
}

export const loanService = {
  async applyForLoan(userId: string, data: ApplyLoanInput) {
    try {
      const kyc = await prisma.kycApplication.findFirst({
        where: {
          userId,
          status: 'APPROVED',
        },
        orderBy: { createdAt: 'desc' },
      });

      if (!kyc) {
        throw new AppError('You must have an approved KYC before applying for a loan', 400);
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

      const loan = await prisma.loanApplication.create({
        data: {
          userId,
          requestedAmount: data.requestedAmount,
          tenureMonths: data.tenureMonths,
          purpose: data.purpose,
          calculatedEmi: emi,
          status: 'SUBMITTED',
          riskScore,
          riskLevel,
        },
        include: {
          user: {
            select: { id: true, email: true },
          },
        },
      });

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

  async getLoanById(loanId: string, requestingUserId: string, requestingUserRole: string) {
    try {
      const loan = await prisma.loanApplication.findUnique({
        where: { id: loanId },
        include: {
          user: {
            select: { id: true, email: true },
          },
          reviewedByUser: {
            select: { id: true, email: true },
          },
        },
      });

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
    },
    requestingUserRole: string,
    requestingUserId?: string
  ) {
    try {
      const where: Prisma.LoanApplicationWhereInput = {};

      if (filters.status) {
        where.status = filters.status;
      }

      if (requestingUserRole === 'USER') {
        where.userId = requestingUserId;
      } else if (filters.userId) {
        where.userId = filters.userId;
      }

      const skip = (filters.page - 1) * filters.limit;

      const [loans, total] = await Promise.all([
        prisma.loanApplication.findMany({
          where,
          include: {
            user: {
              select: { id: true, email: true },
            },
          },
          orderBy: { createdAt: 'desc' },
          take: filters.limit,
          skip,
        }),
        prisma.loanApplication.count({ where }),
      ]);

      return { loans, total };
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
    notes?: string
  ) {
    try {
      const loan = await prisma.loanApplication.findUnique({
        where: { id: loanId },
      });

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

      return updated;
    } catch (error) {
      if (error instanceof AppError) throw error;
      logger.error({ err: error, loanId }, 'Failed to review loan');
      throw new AppError('Failed to review loan application', 500);
    }
  },
};
