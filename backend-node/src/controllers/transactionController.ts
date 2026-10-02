import type { Request, Response, NextFunction } from 'express';
import { prisma } from '@/config/database';
import { apiResponse } from '@/utils/apiResponse';
import { AppError } from '@/utils/AppError';
import { paginate } from '@/utils/pagination';

export const listTransactions = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const user = req.user;
    if (!user) {
      res.status(401).json(apiResponse.error('Authentication required', 401));
      return;
    }

    const { fromDate, toDate, category, transactionType, page = '1', limit = '50' } = req.query as Record<string, string>;
    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 50));
    const skip = (pageNum - 1) * limitNum;

    const where: Record<string, unknown> = { userId: user.id };
    if (fromDate) where.transactionDate = { ...(where.transactionDate as Record<string, unknown> || {}), gte: new Date(fromDate) };
    if (toDate) where.transactionDate = { ...(where.transactionDate as Record<string, unknown> || {}), lte: new Date(toDate) };
    if (category) where.category = category;
    if (transactionType) where.transactionType = transactionType;

    const [items, total] = await Promise.all([
      prisma.transaction.findMany({
        where,
        orderBy: { transactionDate: 'desc' },
        take: limitNum,
        skip,
      }),
      prisma.transaction.count({ where }),
    ]);

    res.json(apiResponse.paginated('Transactions retrieved', items, pageNum, limitNum, total));
  } catch (error) {
    next(error);
  }
};

export const getTransaction = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const user = req.user;
    if (!user) {
      res.status(401).json(apiResponse.error('Authentication required', 401));
      return;
    }

    const { id } = req.params as { id: string };
    const tx = await prisma.transaction.findUnique({ where: { id } });

    if (!tx) {
      throw new AppError('Transaction not found', 404);
    }

    if (tx.userId !== user.id && user.role !== 'ADMIN' && user.role !== 'REVIEWER') {
      throw new AppError('Access denied', 403);
    }

    res.json(apiResponse.success('Transaction retrieved', tx));
  } catch (error) {
    next(error);
  }
};

export const updateTransaction = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const user = req.user;
    if (!user) {
      res.status(401).json(apiResponse.error('Authentication required', 401));
      return;
    }

    const { id } = req.params as { id: string };
    const { category, transactionType, description } = req.body;

    const existing = await prisma.transaction.findUnique({ where: { id } });
    if (!existing) throw new AppError('Transaction not found', 404);
    if (existing.userId !== user.id) throw new AppError('Access denied', 403);

    const updated = await prisma.transaction.update({
      where: { id },
      data: {
        ...(category !== undefined && { category }),
        ...(transactionType !== undefined && { transactionType }),
        ...(description !== undefined && { description }),
      },
    });

    res.json(apiResponse.success('Transaction updated', updated));
  } catch (error) {
    next(error);
  }
};
