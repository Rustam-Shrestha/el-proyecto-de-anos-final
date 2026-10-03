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

function resolveTid(tenantId?: number): number {
  if (tenantId === undefined || tenantId === null) {
    logger.warn("loanAccountService: tenantId not provided, falling back to 1");
    return 1;
  }
  return tenantId;
}
function isTenantSchemaError(e: unknown): boolean {
  const code = (e as { code?: string })?.code;
  const msg = String((e as { message?: string })?.message ?? (e as Error)?.message ?? "");
  return code === "P2021" || code === "P2022" || msg.includes("tenantId") || msg.includes("tenant_id") || msg.includes("does not exist");
}

export const loanAccountService = {
  async recordActiveLoan(userId: string, data: LoanAccountInput, tenantId?: number) {
    try {
      const tid = resolveTid(tenantId);
      const startDate = new Date();
      const endDate = new Date(startDate);
      endDate.setMonth(endDate.getMonth() + data.tenureMonths);

      let account: Awaited<ReturnType<typeof prisma.loanAccount.create>>;
      try {
        account = await prisma.loanAccount.create({
          data: {
            tenantId: tid,
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
      } catch (e) {
        if (isTenantSchemaError(e)) {
          account = await prisma.loanAccount.create({
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
        } else throw e;
      }

      try {
        await prisma.employmentInfo.findFirst({ where: { userId, tenantId: tid } });
      } catch (e) {
        if (!isTenantSchemaError(e)) throw e;
        await prisma.employmentInfo.findUnique({ where: { userId } });
      }

      logger.info({ userId, tenantId: tid, accountId: account.id, amount: data.principalAmount }, 'Active loan recorded');

      return account;
    } catch (error) {
      if (error instanceof AppError) throw error;
      logger.error({ err: error, userId }, 'Failed to record active loan');
      throw new AppError('Failed to record active loan', 500);
    }
  },

  async updateLoanBalance(loanAccountId: string, newBalance: number, tenantId?: number) {
    try {
      const tid = tenantId !== undefined ? tenantId : undefined;
      let account: Awaited<ReturnType<typeof prisma.loanAccount.findFirst>>;
      if (tid !== undefined) account = await prisma.loanAccount.findFirst({ where: { id: loanAccountId, tenantId: tid } });
      else account = await prisma.loanAccount.findUnique({ where: { id: loanAccountId } }) as never;

      if (!account) {
        throw new AppError('Loan account not found', 404);
      }

      const updated = await prisma.loanAccount.update({
        where: { id: loanAccountId },
        data: {
          outstandingBalance: new Prisma.Decimal(newBalance),
        },
      });

      logger.info({ loanAccountId, tenantId: tid, newBalance }, 'Loan balance updated');

      return updated;
    } catch (error) {
      if (error instanceof AppError) throw error;
      logger.error({ err: error, loanAccountId }, 'Failed to update loan balance');
      throw new AppError('Failed to update loan balance', 500);
    }
  },

  async markLoanClosed(loanAccountId: string, tenantId?: number) {
    try {
      const tid = tenantId !== undefined ? tenantId : undefined;
      let account: Awaited<ReturnType<typeof prisma.loanAccount.findFirst>>;
      if (tid !== undefined) account = await prisma.loanAccount.findFirst({ where: { id: loanAccountId, tenantId: tid } });
      else account = await prisma.loanAccount.findUnique({ where: { id: loanAccountId } }) as never;

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

      logger.info({ loanAccountId, tenantId: tid }, 'Loan account marked as closed');

      return updated;
    } catch (error) {
      if (error instanceof AppError) throw error;
      logger.error({ err: error, loanAccountId }, 'Failed to close loan account');
      throw new AppError('Failed to close loan account', 500);
    }
  },

  async getActiveLoansSummary(userId: string, tenantId?: number) {
    try {
      const tid = resolveTid(tenantId);
      let accounts: Awaited<ReturnType<typeof prisma.loanAccount.findMany>>;
      try {
        accounts = await prisma.loanAccount.findMany({ where: { userId, tenantId: tid, isActive: true } });
      } catch (e) {
        if (isTenantSchemaError(e)) accounts = await prisma.loanAccount.findMany({ where: { userId, isActive: true } });
        else throw e;
      }

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

  async getLoanHistory(userId: string, tenantId?: number) {
    try {
      const tid = resolveTid(tenantId);
      let accounts: Awaited<ReturnType<typeof prisma.loanAccount.findMany>>;
      try {
        accounts = await prisma.loanAccount.findMany({ where: { userId, tenantId: tid }, orderBy: { startDate: 'desc' } });
      } catch (e) {
        if (isTenantSchemaError(e)) accounts = await prisma.loanAccount.findMany({ where: { userId }, orderBy: { startDate: 'desc' } });
        else throw e;
      }

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
