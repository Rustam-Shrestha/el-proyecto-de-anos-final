/* eslint-disable no-unused-vars */
/* global FormData */
// KYC API Service - Frontend integration with FastAPI backend.

// Provides methods for:
// - Uploading documents
// - Verifying faces
// - Retrieving KYC status and results

import axios from "axios";
import type { AxiosProgressEvent } from "axios";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8080";

export interface KYCStatus {
  kyc_application_id: string;
  status: "PENDING" | "APPROVED" | "REJECTED";
  confidence_score: number;
  document_count: number;
  documents: Document[];
  ocr_results: OCRResult[];
  face_verifications: FaceVerification[];
  created_at: string;
  updated_at: string;
}

export interface Document {
  id: string;
  type: string;
  uploaded_at: string;
}

export interface OCRResult {
  id: string;
  document_type: string;
  language_detected: string;
  confidence_score: number;
  structured_data: Record<string, unknown>;
}

export interface FaceVerification {
  id: string;
  is_match: boolean;
  distance: number;
  verified_at: string;
}

export interface UploadResponse {
  document_id: string;
  kyc_application_id: string;
  status: string;
  message: string;
}

export interface VerifyResponse {
  verification_id: string;
  is_match: boolean;
  distance: number;
  status: string;
  message: string;
}

class KycApiService {
  private baseURL = API_BASE_URL;

  /**
   * Upload a document for KYC processing.
   *
   * Triggers OCR processing asynchronously for citizenship documents.
   */
  async uploadDocument(
    userId: string,
    documentType: string,
    file: unknown,
    onProgress?: (...args: [number]) => void
  ): Promise<UploadResponse> {
    const formData = new FormData();
    formData.append("user_id", userId);
    formData.append("document_type", documentType);
    formData.append("file", file as string);

    try {
      const response = await axios.post(
        `${this.baseURL}/kyc/upload`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
          onUploadProgress: (progressEvent: AxiosProgressEvent) => {
            if (onProgress && progressEvent.total) {
              onProgress((progressEvent.loaded / progressEvent.total) * 100);
            }
          },
        }
      );

      return response.data;
    } catch (error) {
      throw new Error(`Document upload failed: ${error}`);
    }
  }

  /**
   * Verify face match between selfie and ID document.
   *
   * Returns match verdict and confidence distance.
   */
  async verifyFace(
    kycApplicationId: string,
    selfiePath: string,
    idDocumentPath: string
  ): Promise<VerifyResponse> {
    try {
      const response = await axios.post(
        `${this.baseURL}/kyc/verify`,
        {
          kyc_application_id: kycApplicationId,
          selfie_path: selfiePath,
          id_document_path: idDocumentPath,
        }
      );

      return response.data;
    } catch (error) {
      throw new Error(`Face verification failed: ${error}`);
    }
  }

  /**
   * Retrieve KYC application status and results.
   *
   * Includes OCR results, face verification results, and documents.
   */
  async getKYCStatus(kycApplicationId: string): Promise<KYCStatus> {
    try {
      const response = await axios.get(
        `${this.baseURL}/kyc/status/${kycApplicationId}`
      );

      return response.data;
    } catch (error) {
      throw new Error(`Failed to retrieve KYC status: ${error}`);
    }
  }
}

export const kycApiService = new KycApiService();
