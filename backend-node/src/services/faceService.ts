import axios from 'axios';
import { AppError } from '@/utils/AppError';
import { logger } from '@/config/logger';

const FASTAPI_URL = process.env.FASTAPI_URL || 'http://localhost:8000';
const FACE_TIMEOUT_MS = 180000;

export const faceService = {
  async verifyFace(citizenshipPhotoPath: string, selfiePhotoPath: string): Promise<{
    similarityScore: number,
    status: string,
    recommendation: string
  }> {
    try {
      const response = await axios.post(`${FASTAPI_URL}/api/v1/kyc/face/verify`, {
        citizenship_photo: citizenshipPhotoPath,
        selfie_photo: selfiePhotoPath
      }, {
        timeout: FACE_TIMEOUT_MS,
      });

      return {
        similarityScore: response.data.similarity_score,
        status: response.data.status,
        recommendation: response.data.recommendation
      };
    } catch (error) {
      logger.error({ err: error }, 'Face verification failed');
      throw new AppError('Failed to verify face', 500);
    }
  }
};
