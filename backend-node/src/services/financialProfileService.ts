import { prisma } from '@/config/database';
import { logger } from '@/config/logger';
import { AppError } from '@/utils/AppError';
import { statementParserService } from './statementParserService';

function resolveTid(tenantId?: number): number {
  if (tenantId === undefined || tenantId === null) {
    logger.warn("financialProfileService: tenantId not provided, falling back to 1");
    return 1;
  }
  return tenantId;
}
function isTenantSchemaError(e: unknown): boolean {
  const code = (e as { code?: string })?.code;
  const msg = String((e as { message?: string })?.message ?? (e as Error)?.message ?? "");
  return code === "P2021" || code === "P2022" || msg.includes("tenantId") || msg.includes("tenant_id") || msg.includes("does not exist");
}

export const financialProfileService = {
  async getProfile(userId: string, tenantId?: number) {
    const tid = resolveTid(tenantId);
    let profile: Awaited<ReturnType<typeof prisma.financialProfile.findFirst>>;
    try {
      profile = await prisma.financialProfile.findFirst({ where: { userId, tenantId: tid } });
    } catch (e) {
      if (isTenantSchemaError(e)) profile = await prisma.financialProfile.findUnique({ where: { userId } }) as never;
      else throw e;
    }

    if (!profile) {
      await statementParserService.recalculateFinancialProfile(userId);
      try {
        profile = await prisma.financialProfile.findFirst({ where: { userId, tenantId: tid } });
      } catch (e) {
        if (isTenantSchemaError(e)) profile = await prisma.financialProfile.findUnique({ where: { userId } }) as never;
        else throw e;
      }
    }

    if (!profile) {
      throw new AppError('No financial profile found. Upload a bank statement first.', 404);
    }

    return profile;
  },

  async recalculate(userId: string, tenantId?: number) {
    await statementParserService.recalculateFinancialProfile(userId);
    return this.getProfile(userId, tenantId);
  },

  async getMonthlyTrends(userId: string, tenantId?: number) {
    const tid = resolveTid(tenantId);
    try {
      const raw = await prisma.$queryRawUnsafe(
        `SELECT
          TO_CHAR(DATE_TRUNC('month', t.transaction_date)::DATE, 'YYYY-MM') AS month,
          COALESCE(SUM(CASE WHEN t.credit IS NOT NULL THEN t.credit ELSE 0 END), 0) AS income,
          COALESCE(SUM(CASE WHEN t.debit IS NOT NULL THEN t.debit ELSE 0 END), 0) AS expense
        FROM "auth"."transactions" t
        WHERE t.user_id = $1 AND t.tenant_id = $2
        GROUP BY DATE_TRUNC('month', t.transaction_date)
        ORDER BY month`,
        userId,
        tid,
      ) as Array<{ month: string; income: number; expense: number }>;
      return raw || [];
    } catch (e) {
      if (isTenantSchemaError(e)) {
        const raw = await prisma.$queryRawUnsafe(
          `SELECT
            TO_CHAR(DATE_TRUNC('month', t.transaction_date)::DATE, 'YYYY-MM') AS month,
            COALESCE(SUM(CASE WHEN t.credit IS NOT NULL THEN t.credit ELSE 0 END), 0) AS income,
            COALESCE(SUM(CASE WHEN t.debit IS NOT NULL THEN t.debit ELSE 0 END), 0) AS expense
          FROM "auth"."transactions" t
          WHERE t.user_id = $1
          GROUP BY DATE_TRUNC('month', t.transaction_date)
          ORDER BY month`,
          userId,
        ) as Array<{ month: string; income: number; expense: number }>;
        return raw || [];
      }
      throw e;
    }
  },

  async getCategoryBreakdown(userId: string, tenantId?: number) {
    const tid = resolveTid(tenantId);
    try {
      const expenses = await prisma.transaction.groupBy({
        by: ['transactionType'],
        where: { userId, tenantId: tid, category: 'EXPENSE' },
        _sum: { debit: true },
        _count: true,
        orderBy: { _sum: { debit: 'desc' } },
      });

      const income = await prisma.transaction.groupBy({
        by: ['transactionType'],
        where: { userId, tenantId: tid, category: 'INCOME' },
        _sum: { credit: true },
        _count: true,
        orderBy: { _sum: { credit: 'desc' } },
      });

      return { expenses, income };
    } catch (e) {
      if (isTenantSchemaError(e)) {
        const expenses = await prisma.transaction.groupBy({
          by: ['transactionType'],
          where: { userId, category: 'EXPENSE' },
          _sum: { debit: true },
          _count: true,
          orderBy: { _sum: { debit: 'desc' } },
        });
        const income = await prisma.transaction.groupBy({
          by: ['transactionType'],
          where: { userId, category: 'INCOME' },
          _sum: { credit: true },
          _count: true,
          orderBy: { _sum: { credit: 'desc' } },
        });
        return { expenses, income };
      }
      throw e;
    }
  },
};
