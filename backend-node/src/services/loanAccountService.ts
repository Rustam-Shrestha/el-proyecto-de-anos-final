import { prisma } from '@/config/database';
import { logger } from '@/config/logger';
import { AppError } from '@/utils/AppError';
import { Prisma } from '@prisma/client';

export interface LoanAccountInput {
  userId: string;
  loanId?: string;
  principalAmount: number;
  monthlyEMI: number;
  tenureMonths: number;
}

export const loanAccountService = {
  async recordActiveLoan(userId: string, data: LoanAccountInput) {
    try {
      const startDate = new Date();
      const endDate = new Date(startDate);
      endDate.setMonth(endDate.getMonth() + data.tenureMonths);

      const account = await prisma.loanAccount.create({
        data: {
          userId,
          loanId: data.loanId ?? null,
          principalAmount: new Prisma.Decimal(data.principalAmount),
          outstandingBalance: new Prisma.Decimal(data.principalAmount),
          monthlyEMI: new Prisma.Decimal(data.monthlyEMI),
          startDate,
          expectedEndDate: endDate,
          isActive: true,
          status: 'ACTIVE',
        },
      });

      await prisma.employmentInfo.findUnique({ where: { userId } });

      logger.info({ userId, accountId: account.id, amount: data.principalAmount }, 'Active loan recorded');

      return account;
    } catch (error) {
      if (error instanceof AppError) throw error;
      logger.error({ err: error, userId }, 'Failed to record active loan');
      throw new AppError('Failed to record active loan', 500);
    }
  },

  async updateLoanBalance(loanAccountId: string, newBalance: number) {
    try {
      const account = await prisma.loanAccount.findUnique({
        where: { id: loanAccountId },
      });

      if (!account) {
        throw new AppError('Loan account not found', 404);
      }

      const updated = await prisma.loanAccount.update({
        where: { id: loanAccountId },
        data: {
          outstandingBalance: new Prisma.Decimal(newBalance),
        },
      });

      logger.info({ loanAccountId, newBalance }, 'Loan balance updated');

      return updated;
    } catch (error) {
      if (error instanceof AppError) throw error;
      logger.error({ err: error, loanAccountId }, 'Failed to update loan balance');
      throw new AppError('Failed to update loan balance', 500);
    }
  },

  async markLoanClosed(loanAccountId: string) {
    try {
      const account = await prisma.loanAccount.findUnique({
        where: { id: loanAccountId },
      });

      if (!account) {
        throw new AppError('Loan account not found', 404);
      }

      const updated = await prisma.loanAccount.update({
        where: { id: loanAccountId },
        data: {
          status: 'PAID_OFF',
          isActive: false,
          closedAt: new Date(),
          outstandingBalance: new Prisma.Decimal(0),
        },
      });

      logger.info({ loanAccountId }, 'Loan account marked as closed');

      return updated;
    } catch (error) {
      if (error instanceof AppError) throw error;
      logger.error({ err: error, loanAccountId }, 'Failed to close loan account');
      throw new AppError('Failed to close loan account', 500);
    }
  },

  async getActiveLoansSummary(userId: string) {
    try {
      const accounts = await prisma.loanAccount.findMany({
        where: { userId, isActive: true },
      });

      const totalPrincipal = accounts.reduce((sum, a) => sum + a.principalAmount.toNumber(), 0);
      const totalOutstanding = accounts.reduce((sum, a) => sum + a.outstandingBalance.toNumber(), 0);
      const totalMonthlyEMI = accounts.reduce((sum, a) => sum + a.monthlyEMI.toNumber(), 0);

      return {
        activeCount: accounts.length,
        totalPrincipal,
        totalOutstanding,
        totalMonthlyEMI,
        accounts: accounts.map((a) => ({
          id: a.id,
          principal: a.principalAmount.toNumber(),
          outstanding: a.outstandingBalance.toNumber(),
          monthlyEMI: a.monthlyEMI.toNumber(),
          status: a.status,
          startDate: a.startDate,
          expectedEndDate: a.expectedEndDate,
        })),
      };
    } catch (error) {
      if (error instanceof AppError) throw error;
      logger.error({ err: error, userId }, 'Failed to get active loans summary');
      throw new AppError('Failed to get active loans summary', 500);
    }
  },

  async getLoanHistory(userId: string) {
    try {
      const accounts = await prisma.loanAccount.findMany({
        where: { userId },
        orderBy: { startDate: 'desc' },
      });

      return accounts.map((a) => ({
        id: a.id,
        principal: a.principalAmount.toNumber(),
        outstanding: a.outstandingBalance.toNumber(),
        monthlyEMI: a.monthlyEMI.toNumber(),
        status: a.status,
        startDate: a.startDate,
        expectedEndDate: a.expectedEndDate,
        closedAt: a.closedAt,
      }));
    } catch (error) {
      if (error instanceof AppError) throw error;
      logger.error({ err: error, userId }, 'Failed to get loan history');
      throw new AppError('Failed to get loan history', 500);
    }
  },
};
