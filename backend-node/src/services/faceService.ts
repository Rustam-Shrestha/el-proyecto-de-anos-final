import axios from 'axios';
import { AppError } from '@/utils/AppError';
import { logger } from '@/config/logger';

const FASTAPI_URL = process.env.FASTAPI_URL || 'http://localhost:8000';
const FACE_MATCH_ENABLED = process.env.FACE_MATCH_ENABLED !== 'false';
const FACE_TIMEOUT_MS = 30000;
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
  logger.warn('FastAPI models did not become ready in time — face matching will be degraded');
}

export const faceService = {
  async verifyFace(citizenshipPhotoPath: string, selfiePhotoPath: string): Promise<{
    similarityScore: number;
    status: string;
    recommendation: string;
  }> {
    if (!FACE_MATCH_ENABLED) {
      logger.info('Face matching is disabled (FACE_MATCH_ENABLED=false), returning skip result');
      return { similarityScore: 0, status: 'SKIPPED', recommendation: 'REVIEW' };
    }

    await waitForFastAPIReady();

    try {
      const response = await axios.post(`${FASTAPI_URL}/api/v1/kyc/face/verify`, {
        citizenship_photo: citizenshipPhotoPath,
        selfie_photo: selfiePhotoPath,
      }, {
        timeout: FACE_TIMEOUT_MS,
      });

      return {
        similarityScore: response.data.similarity_score ?? 0,
        status: response.data.status || 'UNKNOWN',
        recommendation: response.data.recommendation || 'REVIEW',
      };
    } catch (error: any) {
      logger.error({ err: error?.message }, 'Face verification failed, returning review recommendation');
      return { similarityScore: 0, status: 'FAILED', recommendation: 'REVIEW' };
    }
  }
};
