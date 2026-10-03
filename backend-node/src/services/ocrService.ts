import axios, { type AxiosResponse } from 'axios';
import { logger } from '@/config/logger';

const FASTAPI_URL = process.env.FASTAPI_URL || 'http://localhost:8000';
const OCR_ENABLED = process.env.OCR_ENABLED !== 'false';
const OCR_TIMEOUT_MS = parseInt(process.env.OCR_TIMEOUT_MS || '60000', 10);
const READY_CHECK_INTERVAL_MS = 2000;
const READY_MAX_WAIT_MS = parseInt(process.env.READY_MAX_WAIT_MS || '120000', 10);
const RETRY_MAX = 2;
const RETRY_DELAY_MS = 5000;

let _readyChecked = false;

function delay(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

function isRetryable(err: unknown): boolean {
  const e = err as { code?: string; response?: { status?: number }; message?: string };
  if (e.code === 'ECONNREFUSED' || e.code === 'ECONNRESET') return true;
  if (e.response?.status && e.response.status >= 500) return true;
  if (e.code === 'ETIMEDOUT' || e.message?.includes('timeout')) return true;
  return false;
}

async function waitForFastAPIReady(): Promise<void> {
  if (_readyChecked) return;
  const startTime = Date.now();
  while (Date.now() - startTime < READY_MAX_WAIT_MS) {
    try {
      const res = await axios.get(`${FASTAPI_URL}/ready`, { timeout: 5000 });
      if (res.data?.ready === true) {
        logger.info('FastAPI models ready');
        _readyChecked = true;
        return;
      }
      logger.info('FastAPI models still loading, waiting...', { models: res.data?.models });
    } catch (err: unknown) {
      const apiError = err as { response?: { status?: number; data?: { detail?: { models?: unknown } } }; message?: string };
      if (apiError.response?.status === 503) {
        logger.info('FastAPI not ready yet (503), waiting...', { models: apiError.response?.data?.detail?.models });
      } else {
        logger.warn('FastAPI ready check failed, retrying', { error: apiError.message });
      }
    }
    await delay(READY_CHECK_INTERVAL_MS);
  }
  logger.warn('FastAPI models did not become ready in time — OCR will be degraded');
}

async function callOcrWithRetry(imagePath: string, documentType: string, retryCount = 0): Promise<AxiosResponse<Record<string, unknown>>> {
  try {
    return await axios.post(`${FASTAPI_URL}/api/v1/kyc/ocr/citizenship`, {
      image_path: imagePath,
      document_type: documentType,
    }, { timeout: OCR_TIMEOUT_MS });
  } catch (error: unknown) {
    const apiError = error as { message?: string };
    if (retryCount < RETRY_MAX && isRetryable(error)) {
      logger.warn({ err: apiError.message, retryCount }, 'OCR call failed, retrying with backoff');
      await delay(RETRY_DELAY_MS * (retryCount + 1));
      return callOcrWithRetry(imagePath, documentType, retryCount + 1);
    }
    throw error;
  }
}

export const ocrService = {
  async extractCitizenshipData(imagePath: string, documentType: string): Promise<{
    extractedData: Record<string, unknown>;
    overallConfidence: number;
    rawText: string;
    error?: string;
    retryable?: boolean;
    timestamp?: number;
  }> {
    if (!OCR_ENABLED) {
      logger.info('OCR is disabled (OCR_ENABLED=false), returning empty result');
      return { extractedData: {}, overallConfidence: 0, rawText: '', error: 'OCR is disabled' };
    }

    await waitForFastAPIReady();

    try {
      const response = await callOcrWithRetry(imagePath, documentType);

      return {
        extractedData: (response.data.extracted_data as Record<string, unknown>) || ({} as Record<string, unknown>),
        overallConfidence: (response.data.overall_confidence as number) || 0,
        rawText: (response.data.raw_text as string) || '',
      };
    } catch (error: unknown) {
      const apiError = error as { message?: string };
      logger.error({ err: apiError.message, imagePath }, 'OCR extraction failed, returning empty result');
      return {
        extractedData: {},
        overallConfidence: 0,
        rawText: '',
        error: `OCR processing failed: ${apiError.message || 'Unknown error'}`,
        retryable: isRetryable(error),
        timestamp: Date.now(),
      };
    }
  }
};

export async function callFinancialDocumentOcr(
  imagePath: string,
  documentType: string,
): Promise<{ fullText: string; confidence: number; textLines: string[] }> {
  if (!OCR_ENABLED) {
    throw new Error('OCR is disabled');
  }

  await waitForFastAPIReady();

  try {
    const response = await axios.post(`${FASTAPI_URL}/api/v1/financial/ocr`, {
      image_path: imagePath,
      document_type: documentType,
    }, { timeout: OCR_TIMEOUT_MS });

    return {
      fullText: (response.data.full_text as string) || '',
      confidence: (response.data.confidence as number) || 0,
      textLines: (response.data.text_lines as string[]) || [],
    };
  } catch (error: unknown) {
    const apiError = error as { response?: { status?: number }; message?: string };
    if (apiError.response?.status === 404) {
      throw new Error('Financial OCR endpoint not available on FastAPI');
    }
    throw error;
  }
}

export interface ExtractionResult {
  sourceType: string;
  extractionMethod: string;
  bankMeta: {
    bankName?: string;
    accountHolder?: string;
    accountNumber?: string;
    fromDate?: string;
    toDate?: string;
    openingBalance?: number;
    closingBalance?: number;
    currency?: string;
    [key: string]: unknown;
  };
  transactions: Array<{
    date: string | null;
    description: string;
    type: 'debit' | 'credit';
    amount: number | null;
    balance: number | null;
    balanceMismatch: boolean;
  }>;
  parsingConfidence: number;
  needsManualMapping: boolean;
  rawExtractedText: string;
  rawTableData: unknown[][];
  [key: string]: unknown;
}

export async function callFinancialDocumentExtraction(
  filePath: string,
  documentType: string,
): Promise<ExtractionResult> {
  if (!OCR_ENABLED) {
    throw new Error('OCR is disabled');
  }

  await waitForFastAPIReady();

  try {
    const response = await axios.post(`${FASTAPI_URL}/api/v1/financial/ocr/extract-document`, {
      file_path: filePath,
      document_type: documentType,
    }, { timeout: OCR_TIMEOUT_MS });

    return response.data as ExtractionResult;
  } catch (error: unknown) {
    const apiError = error as { response?: { status?: number }; message?: string };
    if (apiError.response?.status === 404) {
      throw new Error('Financial document extraction endpoint not available on FastAPI');
    }
    throw error;
  }
}
