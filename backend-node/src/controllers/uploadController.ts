import type { Request, Response, NextFunction } from 'express';
import { prisma } from '@/config/database';
import { auditService } from '@/services/auditService';
import { apiResponse } from '@/utils/apiResponse';
import { AppError } from '@/utils/AppError';
import { statementParserService } from '@/services/statementParserService';
import { logger } from '@/config/logger';
import fs from 'fs/promises';
import crypto from 'crypto';

const readStatementTextFast = async (filePath: string, mimeType: string): Promise<string> => {
  const buffer = await fs.readFile(filePath);
  const ext = filePath.split('.').pop()?.toLowerCase() || '';
  const isTextLike = ['txt', 'csv', 'tsv', 'dat', 'log'].includes(ext) || ['text/plain', 'text/csv', 'application/csv', 'application/vnd.ms-excel'].includes(mimeType);

  if (isTextLike) {
    return buffer.toString('utf-8');
  }

  if (['xls', 'xlsx', 'ods'].includes(ext)) {
    try {
      const xlsx = await import('xlsx');
      const workbook = xlsx.read(buffer, { type: 'buffer', cellDates: true, raw: false, dense: false });
      const rows: string[] = [];
      for (const sheetName of workbook.SheetNames) {
        const sheet = workbook.Sheets[sheetName];
        const sheetText = xlsx.utils.sheet_to_csv(sheet, { blankrows: false, FS: ',', RS: '\n' });
        if (sheetText?.trim()) rows.push(sheetText);
      }
      return rows.join('\n');
    } catch (error) {
      logger.warn({ filePath, error: error instanceof Error ? error.message : String(error) }, 'Excel parsing fallback to raw text');
      return buffer.toString('utf-8');
    }
  }

  return buffer.toString('utf-8');
};

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
    const text = await readStatementTextFast(req.file.path, req.file.mimetype);

    // fileChecksum is globally unique, so re-uploading the same file is a
    // replace (old row + its transactions cascade away) instead of a 409.
    // A checksum already owned by somebody else stays a hard conflict.
    const existing = await prisma.bankStatement.findUnique({ where: { fileChecksum } });
    let replacedStatementId: string | null = null;
    if (existing) {
      if (existing.userId !== user.id) {
        await fs.unlink(req.file.path).catch(() => {});
        res.status(409).json(apiResponse.error('This statement has already been uploaded by another account', 409));
        return;
      }
      if (existing.filePath) {
        await fs.unlink(existing.filePath).catch(() => {});
      }
      await prisma.bankStatement.delete({ where: { id: existing.id } });
      replacedStatementId = existing.id;
    }

    if (!text || text.trim().length < 50) {
      await fs.unlink(req.file.path).catch(() => {});
      res.status(400).json(apiResponse.error('Could not extract text from the file. Ensure it is a valid PDF/Excel with text layer.', 400));
      return;
    }

    const parsed = await statementParserService.parseStatementText(text);

    const created = await prisma.bankStatement.create({
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

    // Reuse the row created above (it carries filePath/fileChecksum) instead of
    // writing a second statement record for the same upload.
    const statementId = await statementParserService.saveParsedStatement(user.id, parsed, created.id);

    await statementParserService.recalculateFinancialProfile(user.id);

    await auditService.log({
      userId: user.id,
      action: 'UPLOAD_BANK_STATEMENT',
      metadata: {
        statementId,
        replacedStatementId,
        bankName: parsed.bankName,
        txCount: parsed.transactions.length,
        dateRange: `${parsed.statementFromDate.toISOString()} - ${parsed.statementToDate.toISOString()}`,
      },
      ip: req.ip || undefined,
      userAgent: req.headers['user-agent'],
    });

    res.status(201).json(apiResponse.success(
      replacedStatementId ? 'Bank statement replaced and processed' : 'Bank statement uploaded and processed',
      {
      id: statementId,
      replacedStatementId,
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
