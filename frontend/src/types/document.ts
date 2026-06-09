export interface DocumentItem {
  id: string;
  kycId: string;
  type: 'CITIZENSHIP_FRONT' | 'CITIZENSHIP_BACK' | 'PASSPORT' | 'SELFIE' | 'OTHER';
  filePath: string;
  version: number;
  sizeBytes: number;
  mimeType: string;
  createdAt: string;
}

export interface DocumentResponse {
  success: boolean;
  data: DocumentItem;
}
