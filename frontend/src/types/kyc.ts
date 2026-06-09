export type KycStatus =
  | 'PENDING'
  | 'UNDER_REVIEW'
  | 'APPROVED'
  | 'REJECTED'
  | 'RESUBMIT_REQUIRED';

export interface KycDocument {
  id: string;
  type: 'CITIZENSHIP_FRONT' | 'CITIZENSHIP_BACK' | 'PASSPORT' | 'SELFIE' | 'OTHER';
  filePath: string;
  version: number;
  mimeType: string;
  sizeBytes: number;
  createdAt: string;
}

export interface KycApplication {
  id: string;
  userId: string;
  status: KycStatus;
  documents: KycDocument[];
  rejectionReason?: string | null;
  resubmitNote?: string | null;
  submittedAt: string;
  reviewedAt?: string | null;
  reviewedBy?: string | null;
}

export interface KycResponse {
  success: boolean;
  data: KycApplication | KycApplication[];
  meta?: { page?: number; limit?: number; total?: number; pages?: number };
}
