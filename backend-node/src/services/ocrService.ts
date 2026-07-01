import axios from 'axios';
import { AppError } from '@/utils/AppError';
import { logger } from '@/config/logger';

const FASTAPI_URL = process.env.FASTAPI_URL || 'http://localhost:8000';

export const ocrService = {
  async extractCitizenshipData(imagePath: string, documentType: string): Promise<{
    extractedData: Record<string, any>,
    overallConfidence: number,
    rawText: string
  }> {
    try {
      const response = await axios.post(`${FASTAPI_URL}/api/v1/kyc/ocr/citizenship`, {
        image_path: imagePath,
        document_type: documentType
      });

      return {
        extractedData: response.data.extracted_data,
        overallConfidence: response.data.overall_confidence,
        rawText: response.data.raw_text
      };
    } catch (error) {
      logger.error({ err: error, imagePath }, 'OCR extraction failed');
      throw new AppError('Failed to extract document data', 500);
    }
  }
};
