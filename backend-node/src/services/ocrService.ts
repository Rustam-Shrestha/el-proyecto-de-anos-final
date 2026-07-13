import axios from 'axios';
import { AppError } from '@/utils/AppError';
import { logger } from '@/config/logger';

const FASTAPI_URL = process.env.FASTAPI_URL || 'http://localhost:8000';
const OCR_ENABLED = process.env.OCR_ENABLED !== 'false';
const OCR_TIMEOUT_MS = 30000;
const READY_CHECK_INTERVAL_MS = 2000;
const READY_MAX_WAIT_MS = 15000;

let _readyChecked = false;

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
    } catch (err: any) {
      if (err.response?.status === 503) {
        logger.info('FastAPI not ready yet (503), waiting...', { models: err.response?.data?.detail?.models });
      } else {
        logger.warn('FastAPI ready check failed, retrying', { error: err.message });
      }
    }
    await new Promise((r) => setTimeout(r, READY_CHECK_INTERVAL_MS));
  }
  logger.warn('FastAPI models did not become ready in time — OCR will be degraded');
}

export const ocrService = {
  async extractCitizenshipData(imagePath: string, documentType: string): Promise<{
    extractedData: Record<string, any>;
    overallConfidence: number;
    rawText: string;
  }> {
    if (!OCR_ENABLED) {
      logger.info('OCR is disabled (OCR_ENABLED=false), returning empty result');
      return { extractedData: {}, overallConfidence: 0, rawText: '' };
    }

    await waitForFastAPIReady();

    try {
      const response = await axios.post(`${FASTAPI_URL}/api/v1/kyc/ocr/citizenship`, {
        image_path: imagePath,
        document_type: documentType,
      }, {
        timeout: OCR_TIMEOUT_MS,
      });

      return {
        extractedData: response.data.extracted_data || {},
        overallConfidence: response.data.overall_confidence || 0,
        rawText: response.data.raw_text || '',
      };
    } catch (error: any) {
      logger.error({ err: error?.message, imagePath }, 'OCR extraction failed, returning empty result');
      return { extractedData: {}, overallConfidence: 0, rawText: '' };
    }
  }
};
