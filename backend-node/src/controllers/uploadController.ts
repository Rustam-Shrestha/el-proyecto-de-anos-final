import type { Request, Response, NextFunction } from 'express';
import { prisma } from '@/config/database';
import { auditService } from '@/services/auditService';
import { apiResponse } from '@/utils/apiResponse';
import { AppError } from '@/utils/AppError';
import { statementParserService } from '@/services/statementParserService';
import { logger } from '@/config/logger';
import fs from 'fs/promises';
import crypto from 'crypto';

export const uploadStatement = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const user = req.user;
    if (!user) {
      res.status(401).json(apiResponse.error('Authentication required', 401));
      return;
    }

    if (!req.file) {
      res.status(400).json(apiResponse.error('No file provided', 400));
      return;
    }

    const fileBuffer = await fs.readFile(req.file.path);
    const fileChecksum = crypto.createHash('sha256').update(fileBuffer).digest('hex');

    const existing = await prisma.bankStatement.findUnique({ where: { fileChecksum } });
    if (existing) {
      await fs.unlink(req.file.path).catch(() => {});
      res.status(409).json(apiResponse.error('This statement has already been uploaded', 409));
      return;
    }

    const text = fileBuffer.toString('utf-8');
    if (!text || text.trim().length < 50) {
      await fs.unlink(req.file.path).catch(() => {});
      res.status(400).json(apiResponse.error('Could not extract text from the file. Ensure it is a valid PDF/Excel with text layer.', 400));
      return;
    }

    const parsed = await statementParserService.parseStatementText(text);

    await prisma.bankStatement.create({
      data: {
        userId: user.id,
        filePath: req.file.path,
        fileChecksum,
        bankName: parsed.bankName,
        accountNumber: parsed.accountNumber,
        accountHolderName: parsed.accountHolderName,
        statementFromDate: parsed.statementFromDate,
        statementToDate: parsed.statementToDate,
        openingBalance: parsed.openingBalance,
        closingBalance: parsed.closingBalance,
        parsingStatus: 'SUCCESS',
      },
    });

    const statementId = await statementParserService.saveParsedStatement(user.id, parsed);

    await statementParserService.recalculateFinancialProfile(user.id);

    await auditService.log({
      userId: user.id,
      action: 'UPLOAD_BANK_STATEMENT',
      metadata: {
        statementId,
        bankName: parsed.bankName,
        txCount: parsed.transactions.length,
        dateRange: `${parsed.statementFromDate.toISOString()} - ${parsed.statementToDate.toISOString()}`,
      },
      ip: req.ip || undefined,
      userAgent: req.headers['user-agent'],
    });

    res.status(201).json(apiResponse.success('Bank statement uploaded and processed', {
      id: statementId,
      bankName: parsed.bankName,
      accountNumber: parsed.accountNumber,
      transactionCount: parsed.transactions.length,
      statementFromDate: parsed.statementFromDate,
      statementToDate: parsed.statementToDate,
      openingBalance: parsed.openingBalance,
      closingBalance: parsed.closingBalance,
    }));
  } catch (error) {
    if (req.file) {
      fs.unlink(req.file.path).catch(() => {});
    }
    next(error);
  }
};

export const listUploads = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const user = req.user;
    if (!user) {
      res.status(401).json(apiResponse.error('Authentication required', 401));
      return;
    }

    const statements = await prisma.bankStatement.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' },
      include: { _count: { select: { transactions: true } } },
    });

    res.json(apiResponse.success('Bank statements retrieved', statements));
  } catch (error) {
    next(error);
  }
};

export const getUpload = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const user = req.user;
    if (!user) {
      res.status(401).json(apiResponse.error('Authentication required', 401));
      return;
    }

    const { id } = req.params as { id: string };
    const statement = await prisma.bankStatement.findUnique({
      where: { id },
      include: {
        transactions: {
          orderBy: { transactionDate: 'desc' },
          take: 100,
        },
      },
    });

    if (!statement) {
      throw new AppError('Bank statement not found', 404);
    }

    if (statement.userId !== user.id && user.role !== 'ADMIN' && user.role !== 'REVIEWER') {
      throw new AppError('Access denied', 403);
    }

    res.json(apiResponse.success('Bank statement retrieved', statement));
  } catch (error) {
    next(error);
  }
};
