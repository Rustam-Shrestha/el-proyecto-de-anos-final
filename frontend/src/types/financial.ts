export interface FinancialDocument {
  id: string;
  userId: string;
  documentType: string;
  filePath: string;
  fileMimeType: string | null;
  fileSize: number | null;
  originalName: string | null;
  ocrStatus: string;
  ocrData: Record<string, unknown> | null;
  ocrConfidence: number | null;
  ocrErrorMessage: string | null;
  ocrRawText: string | null;
  ocrProcessedAt: string | null;
  extractedFields: ExtractedFields | null;
  comparisonResult: ComparisonResult | null;
  anomalyFlags: string[];
  flagCount: number;
  verificationStatus: string;
  adminNotes: string | null;
  verifiedBy: string | null;
  verifiedAt: string | null;
  isExpired: boolean;
  expiryDate: string | null;
  isDeleted: boolean;
  createdAt: string;
  updatedAt: string;
  user?: {
    id: string;
    email: string;
    profile?: { fullName: string | null };
  };
}

export interface ExtractedFields {
  documentType: string;
  extractedData: Record<string, string | number | null>;
  confidence: Record<string, number>;
}

export interface ComparisonResult {
  salaryMatch?: ComparisonField;
  employerMatch?: ComparisonField;
  dateMatch?: ComparisonField;
  nameMatch?: ComparisonField;
  [key: string]: ComparisonField | undefined;
}

export interface ComparisonField {
  matched: boolean;
  declared: string | number | null;
  extracted: string | number | null;
  differencePercent?: number;
  isRecent?: boolean;
  similarity?: number;
  confidence: number;
}

export interface DocumentUploadResponse {
  id: string;
  documentType: string;
  ocrStatus: string;
  createdAt: string;
  message: string;
}

export const FINANCIAL_DOCUMENT_TYPES = [
  { value: 'SALARY_SLIP', label: 'Salary Slip' },
  { value: 'BANK_STATEMENT', label: 'Bank Statement' },
  { value: 'INCOME_CERT', label: 'Income Certificate' },
  { value: 'BUSINESS_REG', label: 'Business Registration' },
  { value: 'PENSION_LETTER', label: 'Pension Letter' },
  { value: 'PAN', label: 'PAN Card' },
  { value: 'OTHER', label: 'Other Document' },
] as const;
