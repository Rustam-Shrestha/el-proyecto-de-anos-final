import { prisma } from '@/config/database';
import { logger } from '@/config/logger';
import { readFileSync, existsSync } from 'fs';
import path from 'path';
import { documentExtractionService } from '@/services/documentExtractionService';
import { callFinancialDocumentOcr, callFinancialDocumentExtraction } from '@/services/ocrService';
import type { ExtractionResult as ApiExtractionResult } from '@/services/ocrService';

interface OcrResult {
  fullText: string;
  textLines: string[];
  confidence: number;
}

interface ProcessedExtraction {
  ocrResult: OcrResult;
  extractedFields: Record<string, unknown>;
  transactions?: Array<{
    date: string | null;
    description: string;
    type: 'debit' | 'credit';
    amount: number | null;
    balance: number | null;
    balanceMismatch: boolean;
  }>;
  bankMeta?: Record<string, unknown>;
}

const activeJobs = new Set<string>();
const JOB_TIMEOUT_MS = 120000;
const FINANCIAL_TEXT_EXTRACTION_ENABLED = process.env.FINANCIAL_TEXT_EXTRACTION_ENABLED === 'true';

function buildManualFinancialSummary(documentType: string): Record<string, unknown> {
  return {
    documentType,
    status: 'MANUAL_REVIEW_ONLY',
    summary: 'Text extraction and document parsing are disabled. Financial review is based on the submitted profile details and manual verification.',
    extractedData: {
      documentType,
      source: 'manual-entry',
      incomeSummary: null,
    },
    confidence: { overall: 0 },
  };
}

async function runLocalOcrFallback(filePath: string): Promise<OcrResult> {
  try {
    const tesseract = require('tesseract.js');
    const image = readFileSync(filePath);
    const { data } = await tesseract.recognize(image, 'eng+hin', {
      logger: () => {},
    });
    return {
      fullText: data.text || '',
      textLines: (data.text || '').split('\n').filter((l: string) => l.trim()),
      confidence: (data.confidence || 0) / 100,
    };
  } catch {
    return {
      fullText: '',
      textLines: [],
      confidence: 0,
    };
  }
}

async function runOcrOnDocument(filePath: string, documentType: string): Promise<OcrResult> {
  const absolutePath = path.resolve(filePath);
  if (!existsSync(absolutePath)) {
    throw new Error(`File not found at path: ${filePath}`);
  }

  try {
    const result = await callFinancialDocumentOcr(absolutePath, documentType);
    const textLines = result.textLines && result.textLines.length > 0
      ? result.textLines
      : (result.fullText || '').split('\n').filter((l: string) => l.trim());
    return {
      fullText: result.fullText || '',
      textLines,
      confidence: result.confidence || 0,
    };
  } catch {
    logger.warn({ filePath }, 'FastAPI OCR unavailable, falling back to tesseract.js');
    return runLocalOcrFallback(absolutePath);
  }
}

async function runDocumentExtraction(filePath: string, documentType: string): Promise<ProcessedExtraction> {
  const absolutePath = path.resolve(filePath);
  if (!existsSync(absolutePath)) {
    throw new Error(`File not found at path: ${filePath}`);
  }

  try {
    const result = await callFinancialDocumentExtraction(absolutePath, documentType);
    return {
      ocrResult: {
        fullText: result.rawExtractedText || '',
        textLines: (result.rawExtractedText || '').split('\n').filter((l: string) => l.trim()),
        confidence: result.parsingConfidence ?? 0.5,
      },
      extractedFields: result as unknown as Record<string, unknown>,
      transactions: result.transactions,
      bankMeta: result.bankMeta,
    };
  } catch {
    logger.warn({ filePath, documentType }, 'FastAPI extraction unavailable, falling back to OCR-only');
    const ocrResult = await runOcrOnDocument(filePath, documentType);
    return {
      ocrResult,
      extractedFields: {},
    };
  }
}

export async function processOcrJob(documentId: string): Promise<void> {
  if (activeJobs.has(documentId)) {
    logger.info({ documentId }, 'OCR job already running for this document');
    return;
  }

  activeJobs.add(documentId);

  try {
    const doc = await prisma.financialDocument.findUnique({ where: { id: documentId } });
    if (!doc || doc.isDeleted) {
      logger.warn({ documentId }, 'Document not found or deleted, aborting OCR');
      activeJobs.delete(documentId);
      return;
    }

    if (!FINANCIAL_TEXT_EXTRACTION_ENABLED) {
      const summary = buildManualFinancialSummary(doc.documentType);
      await prisma.financialDocument.update({
        where: { id: documentId },
        data: {
          ocrStatus: 'SKIPPED',
          verificationStatus: 'PENDING',
          ocrData: { status: 'manual-review-only' },
          extractedFields: summary,
          comparisonResult: { manualReview: true, summary: 'OCR disabled; manual verification only' },
          ocrErrorMessage: 'Financial text extraction disabled for this flow.',
        },
      });
      logger.info({ documentId, documentType: doc.documentType }, 'Financial document processing skipped: text extraction disabled');
      activeJobs.delete(documentId);
      return;
    }

    await prisma.financialDocument.update({
      where: { id: documentId },
      data: { ocrStatus: 'PROCESSING' },
    });

    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error('OCR processing timed out')), JOB_TIMEOUT_MS),
    );

    const isBankStatement = doc.documentType === 'BANK_STATEMENT';
    let extractionPromise: Promise<ProcessedExtraction>;

    if (isBankStatement) {
      extractionPromise = runDocumentExtraction(doc.filePath, doc.documentType);
    } else {
      extractionPromise = runOcrOnDocument(doc.filePath, doc.documentType).then((ocrResult) => ({
        ocrResult,
        extractedFields: {},
      }));
    }

    const processed = await Promise.race([extractionPromise, timeoutPromise]).catch(async (err) => {
      logger.error({ err, documentId }, 'Document processing failed');
      await prisma.financialDocument.update({
        where: { id: documentId },
        data: {
          ocrStatus: 'FAILED',
          ocrErrorMessage: err instanceof Error ? err.message : 'Processing failed',
        },
      });
      return null;
    });

    if (!processed) {
      activeJobs.delete(documentId);
      return;
    }

    const { ocrResult, extractedFields: apiExtractedFields, transactions, bankMeta } = processed;

    const normalized = documentExtractionService.normalizeOcrOutput(ocrResult, doc.documentType);

    const extracted = documentExtractionService.extractFinancialFields(normalized);

    if (isBankStatement && transactions && transactions.length > 0) {
      const totalCredits = transactions
        .filter((t) => t.type === 'credit' && t.amount)
        .reduce((s, t) => s + (t.amount || 0), 0);
      const totalDebits = transactions
        .filter((t) => t.type === 'debit' && t.amount)
        .reduce((s, t) => s + (t.amount || 0), 0);
      const salaryTxn = transactions.find(
        (t) => t.description && /salary|payroll|wages/i.test(t.description)
      );

      extracted.extractedData = {
        ...extracted.extractedData,
        transactionCount: transactions.length,
        totalCredits,
        totalDebits,
        netCashFlow: totalCredits - totalDebits,
        salaryDepositDetected: !!salaryTxn,
        salaryAmountDetected: salaryTxn?.amount || null,
        largestSingleDeposit: Math.max(
          ...transactions.filter((t) => t.type === 'credit' && t.amount).map((t) => t.amount || 0),
          0
        ) || null,
      };
      extracted.confidence = {
        ...extracted.confidence,
        transactionCount: transactions.length > 0 ? 0.95 : 0,
        salaryDepositDetected: salaryTxn ? 0.85 : 0,
        salaryAmountDetected: salaryTxn?.amount ? 0.85 : 0,
      };
    }

    const employment = await prisma.employmentInfo.findUnique({ where: { userId: doc.userId } });
    const comparison = documentExtractionService.compareWithDeclaration(extracted, employment);

    const flags = documentExtractionService.generateAnomalyFlags(comparison, extracted, ocrResult.confidence);

    if (isBankStatement && Boolean(apiExtractedFields?.needsManualMapping)) {
      flags.flagList.push('NEEDS_MANUAL_MAPPING');
      flags.count += 1;
      flags.details.push({
        type: 'NEEDS_MANUAL_MAPPING',
        severity: 'HIGH',
        message: 'Bank statement column headers could not be mapped automatically',
      });
    }

    const verificationStatus = flags.count > 0 ? 'FLAGGED_REVIEW' : 'PENDING';

    const storedExtractedFields = isBankStatement
      ? {
          ...apiExtractedFields,
          extractedData: extracted.extractedData,
          confidence: extracted.confidence,
        }
      : (extracted as unknown as Record<string, unknown>);

    await prisma.financialDocument.update({
      where: { id: documentId },
      data: {
        ocrStatus: 'COMPLETED',
        ocrProcessedAt: new Date(),
        ocrRawText: ocrResult.fullText,
        ocrData: ocrResult.fullText ? { fullText: ocrResult.fullText, confidence: ocrResult.confidence } : undefined,
        ocrConfidence: ocrResult.confidence,
        extractedFields: storedExtractedFields,
        comparisonResult: comparison as unknown as Record<string, unknown>,
        anomalyFlags: flags.flagList,
        flagCount: flags.count,
        verificationStatus,
      },
    });

    await updatePortfolioDocumentCounters(doc.userId);

    logger.info({
      documentId,
      userId: doc.userId,
      confidence: ocrResult.confidence,
      flags: flags.count,
      status: verificationStatus,
    }, 'OCR processing completed for financial document');

    activeJobs.delete(documentId);
  } catch (error) {
    logger.error({ err: error, documentId }, 'Unexpected OCR job error');
    try {
      await prisma.financialDocument.update({
        where: { id: documentId },
        data: {
          ocrStatus: 'FAILED',
          ocrErrorMessage: error instanceof Error ? error.message : 'Unexpected error',
        },
      });
    } catch {
      logger.error({ documentId }, 'Failed to update OCR error status');
    }
    activeJobs.delete(documentId);
  }
}

async function updatePortfolioDocumentCounters(userId: string): Promise<void> {
  try {
    const docs = await prisma.financialDocument.findMany({
      where: { userId, isDeleted: false },
    });

    const uploaded = docs.length;
    const verified = docs.filter((d) => d.verificationStatus === 'VERIFIED').length;
    const flagged = docs.filter((d) => d.anomalyFlags.length > 0 || d.verificationStatus === 'FLAGGED_REVIEW').length;
    const allVerified = uploaded > 0 && verified === uploaded;

    await prisma.portfolioVerification.upsert({
      where: { userId },
      create: {
        userId,
        documentsUploaded: uploaded,
        documentsVerified: verified,
        documentsFlagged: flagged,
        allDocumentsVerified: allVerified,
        canProceedToLoan: allVerified,
        verificationStatus: allVerified ? 'VERIFIED' : uploaded > 0 ? 'PENDING_VERIFICATION' : 'INCOMPLETE',
      },
      update: {
        documentsUploaded: uploaded,
        documentsVerified: verified,
        documentsFlagged: flagged,
        allDocumentsVerified: allVerified,
        canProceedToLoan: allVerified,
        verificationStatus: allVerified ? 'VERIFIED' : uploaded > 0 ? 'PENDING_VERIFICATION' : 'INCOMPLETE',
      },
    });
  } catch (error) {
    logger.error({ err: error, userId }, 'Failed to update portfolio document counters');
  }
}

export function queueOcrJob(documentId: string): void {
  setImmediate(() => {
    processOcrJob(documentId).catch((err) => {
      logger.error({ err, documentId }, 'OCR job queue error');
    });
  });
  logger.info({ documentId }, 'OCR job queued');
}
