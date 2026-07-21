import { prisma } from '@/config/database';
import { logger } from '@/config/logger';
import { readFileSync, existsSync } from 'fs';
import path from 'path';
import { documentExtractionService } from '@/services/documentExtractionService';
import { financialDocumentService } from '@/services/financialDocumentService';
import { callFinancialDocumentOcr } from '@/services/ocrService';

interface OcrResult {
  fullText: string;
  textLines: string[];
  confidence: number;
}

const activeJobs = new Set<string>();
const JOB_TIMEOUT_MS = 120000;

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

export async function processOcrJob(documentId: string): Promise<void> {
  if (activeJobs.has(documentId)) {
    logger.info({ documentId }, 'OCR job already running for this document');
    return;
  }

  activeJobs.add(documentId);

  try {
    await prisma.financialDocument.update({
      where: { id: documentId },
      data: { ocrStatus: 'PROCESSING' },
    });

    const doc = await prisma.financialDocument.findUnique({ where: { id: documentId } });
    if (!doc || doc.isDeleted) {
      logger.warn({ documentId }, 'Document not found or deleted, aborting OCR');
      activeJobs.delete(documentId);
      return;
    }

    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error('OCR processing timed out')), JOB_TIMEOUT_MS),
    );

    const ocrPromise = runOcrOnDocument(doc.filePath, doc.documentType);
    const ocrResult = await Promise.race([ocrPromise, timeoutPromise]).catch(async (err) => {
      logger.error({ err, documentId }, 'OCR processing failed');
      await prisma.financialDocument.update({
        where: { id: documentId },
        data: {
          ocrStatus: 'FAILED',
          ocrErrorMessage: err instanceof Error ? err.message : 'OCR processing failed',
        },
      });
      return null;
    });

    if (!ocrResult) {
      activeJobs.delete(documentId);
      return;
    }

    const normalized = documentExtractionService.normalizeOcrOutput(ocrResult, doc.documentType);

    const extracted = documentExtractionService.extractFinancialFields(normalized);

    const employment = await prisma.employmentInfo.findUnique({ where: { userId: doc.userId } });
    const comparison = documentExtractionService.compareWithDeclaration(extracted, employment);

    const flags = documentExtractionService.generateAnomalyFlags(comparison, extracted, ocrResult.confidence);

    const verificationStatus = flags.count > 0 ? 'FLAGGED_REVIEW' : 'PENDING';

    await prisma.financialDocument.update({
      where: { id: documentId },
      data: {
        ocrStatus: 'COMPLETED',
        ocrProcessedAt: new Date(),
        ocrRawText: ocrResult.fullText,
        ocrData: ocrResult.fullText ? { fullText: ocrResult.fullText, confidence: ocrResult.confidence } : undefined,
        ocrConfidence: ocrResult.confidence,
        extractedFields: extracted as unknown as Record<string, unknown>,
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
