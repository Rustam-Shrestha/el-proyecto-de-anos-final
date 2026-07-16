import axios, { type AxiosResponse } from 'axios';
import { logger } from '@/config/logger';

const FASTAPI_URL = process.env.FASTAPI_URL || 'http://localhost:8000';
const FACE_MATCH_ENABLED = process.env.FACE_MATCH_ENABLED !== 'false';
const FACE_TIMEOUT_MS = parseInt(process.env.FACE_TIMEOUT_MS || '45000', 10);
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
  logger.warn('FastAPI models did not become ready in time — face matching will be degraded');
}

async function callFaceWithRetry(citizenshipPhotoPath: string, selfiePhotoPath: string, retryCount = 0): Promise<AxiosResponse<Record<string, unknown>>> {
  try {
    return await axios.post(`${FASTAPI_URL}/api/v1/kyc/face/verify`, {
      citizenship_photo: citizenshipPhotoPath,
      selfie_photo: selfiePhotoPath,
    }, { timeout: FACE_TIMEOUT_MS });
  } catch (error: unknown) {
    const apiError = error as { message?: string };
    if (retryCount < RETRY_MAX && isRetryable(error)) {
      logger.warn({ err: apiError.message, retryCount }, 'Face call failed, retrying with backoff');
      await delay(RETRY_DELAY_MS * (retryCount + 1));
      return callFaceWithRetry(citizenshipPhotoPath, selfiePhotoPath, retryCount + 1);
    }
    throw error;
  }
}

export const faceService = {
  async verifyFace(citizenshipPhotoPath: string, selfiePhotoPath: string): Promise<{
    similarityScore: number;
    status: string;
    recommendation: string;
    error?: string;
    retryable?: boolean;
    timestamp?: number;
  }> {
    if (!FACE_MATCH_ENABLED) {
      logger.info('Face matching is disabled (FACE_MATCH_ENABLED=false), returning skip result');
      return { similarityScore: 0, status: 'SKIPPED', recommendation: 'REVIEW', error: 'Face matching is disabled' };
    }

    await waitForFastAPIReady();

    try {
      const response = await callFaceWithRetry(citizenshipPhotoPath, selfiePhotoPath);

      return {
        similarityScore: (response.data.similarity_score as number) ?? 0,
        status: (response.data.status as string) || 'UNKNOWN',
        recommendation: (response.data.recommendation as string) || 'REVIEW',
      };
    } catch (error: unknown) {
      const apiError = error as { message?: string };
      logger.error({ err: apiError.message }, 'Face verification failed, returning review recommendation');
      return {
        similarityScore: 0,
        status: 'FAILED',
        recommendation: 'REVIEW',
        error: `Face verification failed: ${apiError.message || 'Unknown error'}`,
        retryable: isRetryable(error),
        timestamp: Date.now(),
      };
    }
  }
};
