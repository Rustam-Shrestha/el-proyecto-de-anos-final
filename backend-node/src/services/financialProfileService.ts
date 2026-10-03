import { prisma } from '@/config/database';
import { logger } from '@/config/logger';
import { AppError } from '@/utils/AppError';
import { statementParserService } from './statementParserService';

export const financialProfileService = {
  async getProfile(userId: string) {
    let profile = await prisma.financialProfile.findUnique({ where: { userId } });

    if (!profile) {
      await statementParserService.recalculateFinancialProfile(userId);
      profile = await prisma.financialProfile.findUnique({ where: { userId } });
    }

    if (!profile) {
      throw new AppError('No financial profile found. Upload a bank statement first.', 404);
    }

    return profile;
  },

  async recalculate(userId: string) {
    await statementParserService.recalculateFinancialProfile(userId);
    return this.getProfile(userId);
  },

  async getMonthlyTrends(userId: string) {
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
  },

  async getCategoryBreakdown(userId: string) {
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
  },
};
