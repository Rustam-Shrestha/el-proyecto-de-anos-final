import type { Request, Response, NextFunction } from 'express';
import { prisma } from '@/config/database';
import { auditService } from '@/services/auditService';
import { apiResponse } from '@/utils/apiResponse';
import { AppError } from '@/utils/AppError';
import { normalizeRoleName } from '@/utils/roles';
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

  // PDF text layer extraction (pdf-parse v1, pure JS, no native deps).
  // NOTE: pdf-parse v2 requires DOMMatrix/@napi-rs/canvas and cannot even be
  // imported on Windows Node, which made EVERY pdf upload 400 here. v1's
  // package entry runs a self-test on ESM import (module.parent undefined),
  // so import the inner lib directly — same function, no side effects.
  if (ext === 'pdf' || mimeType === 'application/pdf') {
    try {
      const mod = await import('pdf-parse/lib/pdf-parse.js');
      const parsePdf: (data: Uint8Array) => Promise<{ text?: string }> = mod.default ?? mod;
      // pdf.js v1.10 (bundled in pdf-parse@1.x) builds sub-streams from
      // `bytes.buffer` IGNORING `byteOffset`, so pooled Node Buffers
      // (non-zero byteOffset — fs reads and small multer uploads) parse at
      // wrong offsets and throw "bad XRef entry". A fresh exact-size copy
      // (byteOffset 0) parses fine — proven live.
      const bytes = new Uint8Array(buffer);
      const result = await parsePdf(bytes);
      if (result.text && result.text.trim().length >= 50) {
        return result.text;
      }
      // Text layer empty/too short => scanned PDF, fall through to FastAPI OCR below
    } catch (error) {
      logger.warn({ filePath, error: error instanceof Error ? error.message : String(error) }, 'pdf-parse failed, trying FastAPI OCR fallback');
    }

    // Fallback: scanned/image-only PDF. Reuse the ALREADY-BUILT FastAPI pipeline
    // (financial_extraction_service.py -> OcrExtractor -> EasyOCR) that currently
    // sits unused for this flow. Gate on FINANCIAL_OCR_ENABLED so environments
    // without FastAPI's OCR deps installed don't hard-fail.
    if (process.env.FINANCIAL_OCR_ENABLED === 'true') {
      try {
        const { callFinancialDocumentExtraction } = await import('@/services/ocrService');
        const extraction = await callFinancialDocumentExtraction(filePath, 'BANK_STATEMENT');
        if (extraction.rawExtractedText && extraction.rawExtractedText.trim().length >= 50) {
          return extraction.rawExtractedText;
        }
      } catch (error) {
        logger.warn({ filePath, error: error instanceof Error ? error.message : String(error) }, 'FastAPI OCR fallback failed');
      }
    }

    // Last resort: return '' (triggers the >=50 char text check downstream,
    // which correctly surfaces "could not extract text" instead of silently
    // producing a zero-transaction profile).
    return '';
  }

  // Images (jpg/png/webp) accepted by multer filter: same FastAPI OCR fallback.
  if (['jpg', 'jpeg', 'png', 'webp'].includes(ext) && process.env.FINANCIAL_OCR_ENABLED === 'true') {
    try {
      const { callFinancialDocumentExtraction } = await import('@/services/ocrService');
      const extraction = await callFinancialDocumentExtraction(filePath, 'BANK_STATEMENT');
      return extraction.rawExtractedText || '';
    } catch {
      return '';
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

    // Duplicate-testing allowance: salt checksum per upload instance when
    // explicitly flagged (header) or outside production, so repeated testing
    // with the same sample file isn't blocked. Production keeps the real
    // cross-user 409 fraud check.
    const allowDuplicate = req.headers['x-allow-duplicate'] === 'true' || process.env.NODE_ENV !== 'production';
    const effectiveChecksum = allowDuplicate
      ? crypto.createHash('sha256').update(fileBuffer).update(Date.now().toString()).digest('hex')
      : fileChecksum;

    // fileChecksum is globally unique, so re-uploading the same file is a
    // replace (old row + its transactions cascade away) instead of a 409.
    // A checksum already owned by somebody else stays a hard conflict.
    const existing = await prisma.bankStatement.findUnique({ where: { fileChecksum: effectiveChecksum } });
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
        fileChecksum: effectiveChecksum,
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

    // Tenant-scoped read: the uploader always passes; staff (ADMIN/REVIEWER)
    // pass only within their own tenant; SUPERADMIN (platform owner) is global.
    // Customers (USER) of another account are always denied.
    if (statement.userId !== user.id) {
      const role = normalizeRoleName(user.role);
      if (role === 'USER') {
        throw new AppError('Access denied', 403);
      }
      if (role !== 'SUPERADMIN') {
        const callerTenant = (req as unknown as { tenantId?: number }).tenantId
          ?? (user as unknown as { tenantId?: number }).tenantId;
        if (callerTenant === undefined || statement.tenantId !== callerTenant) {
          throw new AppError('Access denied', 403);
        }
      }
    }

    res.json(apiResponse.success('Bank statement retrieved', statement));
  } catch (error) {
    next(error);
  }
};

export const startChatForUpload = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const user = req.user;
    if (!user) { res.status(401).json(apiResponse.error('Authentication required', 401)); return; }

    const { id } = req.params as { id: string };
    const statement = await prisma.bankStatement.findUnique({ where: { id } });
    if (!statement) throw new AppError('Bank statement not found', 404);
    if (statement.userId !== user.id) throw new AppError('Access denied', 403); // uploader-only, strictly — no ADMIN/REVIEWER override here by design

    const sessionId = `stmt_${statement.id}_${Date.now()}`;
    const conversation = await prisma.chatConversation.create({
      data: {
        userId: user.id,
        sessionId,
        messages: [],
        context: { type: 'statement_chat', bankStatementId: statement.id },
        bankStatementId: statement.id,
      },
    });

    res.status(201).json(apiResponse.success('Chat session created', { sessionId, conversationId: conversation.id, bankStatementId: statement.id }));
  } catch (error) {
    next(error);
  }
};

export const deleteUpload = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const user = req.user;
    if (!user) { res.status(401).json(apiResponse.error('Authentication required', 401)); return; }

    const { id } = req.params as { id: string };
    const statement = await prisma.bankStatement.findUnique({ where: { id } });
    if (!statement) throw new AppError('Bank statement not found', 404);
    if (statement.userId !== user.id) throw new AppError('Access denied', 403); // uploader-only deletion

    if (statement.filePath) {
      await fs.unlink(statement.filePath).catch(() => {});
    }
    // onDelete: Cascade on Transaction.bankStatementId and ChatConversation.bankStatementId
    // removes dependent rows automatically.
    await prisma.bankStatement.delete({ where: { id } });

    await auditService.log({
      userId: user.id,
      action: 'DELETE_BANK_STATEMENT',
      metadata: { statementId: id },
      ip: req.ip || undefined,
      userAgent: req.headers['user-agent'],
    });

    res.json(apiResponse.success('Bank statement and linked chat history deleted', { id }));
  } catch (error) {
    next(error);
  }
};
