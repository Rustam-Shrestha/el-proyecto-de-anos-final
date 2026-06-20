// Frontend KYC Module - Exports for cleaner imports.

export { default as KYCForm } from './components/KYCForm';
export { useKYC } from './hooks/useKYC';
export { kycApiService } from './api/kycApi';

export type {
  KYCStatus,
  Document,
  OCRResult,
  FaceVerification,
  UploadResponse,
  VerifyResponse
} from './api/kycApi';
