export enum DocumentType {
  CITIZENSHIP_FRONT = "CITIZENSHIP_FRONT",
  CITIZENSHIP_BACK = "CITIZENSHIP_BACK",
  PASSPORT = "PASSPORT",
  SELFIE = "SELFIE",
  OTHER = "OTHER",
}

export enum KYCStatus {
  PENDING = "PENDING",
  UNDER_REVIEW = "UNDER_REVIEW",
  APPROVED = "APPROVED",
  REJECTED = "REJECTED",
  RESUBMIT_REQUIRED = "RESUBMIT_REQUIRED",
}

export enum LoanStatus {
  PENDING = "PENDING",
  UNDER_REVIEW = "UNDER_REVIEW",
  APPROVED = "APPROVED",
  REJECTED = "REJECTED",
  DISBURSED = "DISBURSED",
  ACTIVE = "ACTIVE",
  CLOSED = "CLOSED",
  DEFAULTED = "DEFAULTED",
}

export enum RiskLevel {
  LOW = "LOW",
  MEDIUM = "MEDIUM",
  HIGH = "HIGH",
  VERY_HIGH = "VERY_HIGH",
}

export enum LoanPurpose {
  PERSONAL = "PERSONAL",
  BUSINESS = "BUSINESS",
  EDUCATION = "EDUCATION",
  HOME = "HOME",
  VEHICLE = "VEHICLE",
  AGRICULTURE = "AGRICULTURE",
  OTHER = "OTHER",
}

export enum DocumentVerificationStatus {
  PENDING = "PENDING",
  VERIFIED = "VERIFIED",
  FAILED = "FAILED",
  NOT_REQUIRED = "NOT_REQUIRED",
  MANUAL_REVIEW = "MANUAL_REVIEW",
  PROCESSING = "PROCESSING",
}

export const FILE_VALIDATION = {
  MAX_SIZE_BYTES: 5 * 1024 * 1024,
  MAX_SIZE_MB: 5,
  ALLOWED_MIME_TYPES: ["image/jpeg", "image/png", "application/pdf"] as const,
  ALLOWED_EXTENSIONS: [".jpg", ".jpeg", ".png", ".pdf"] as const,
} as const;

export type UserRole = "USER" | "ADMIN" | "REVIEWER";

export type User = {
  id: string;
  email: string;
  fullName?: string;
  phone?: string | null;
  address?: string | null;
  role: UserRole;
  isVerified: boolean;
  avatar?: string | null;
  createdAt: string;
  updatedAt?: string;
};

export type Profile = {
  id: string;
  email: string;
  fullName?: string;
  phone?: string | null;
  address?: string | null;
  avatar?: string | null;
  role: UserRole;
  isVerified: boolean;
};

export type KYCApplication = {
  id: string;
  userId: string;
  userEmail?: string;
  applicantEmail?: string;
  status: KYCStatus;
  documents: KYCDocument[];
  notes?: string | null;
  rejectionReason?: string | null;
  resubmitNote?: string | null;
  submittedAt: string;
  reviewedAt?: string | null;
  reviewedBy?: string | null;
  appliedAt?: string;
  approvedAt?: string | null;
  rejectedAt?: string | null;
  approvalMessage?: string | null;
};

export type KYCDocument = {
  id: string;
  kycId: string;
  type: DocumentType;
  filePath: string;
  version: number;
  mimeType: string;
  sizeBytes: number;
  verificationStatus?: DocumentVerificationStatus;
  createdAt: string;
};

export type LoanApplication = {
  id: string;
  userId: string;
  amount: number;
  purpose: LoanPurpose;
  status: LoanStatus;
  riskLevel?: RiskLevel;
  termMonths: number;
  interestRate?: number;
  monthlyPayment?: number;
  totalRepayment?: number;
  notes?: string | null;
  rejectionReason?: string | null;
  appliedAt: string;
  reviewedAt?: string | null;
  reviewedBy?: string | null;
  disbursedAt?: string | null;
  closedAt?: string | null;
  createdAt: string;
  updatedAt: string;
};

export type BorrowerFeatures = {
  age: number;
  income: number;
  employmentYears: number;
  creditScore: number;
  existingLoans: number;
  debtToIncomeRatio: number;
  loanAmount: number;
  loanTerm: number;
};

export type AuditLog = {
  id: string;
  actorUserId: string | null;
  userEmail?: string | null;
  action: string;
  metadata?: Record<string, unknown>;
  ip?: string;
  userAgent?: string;
  createdAt: string;
};

export type PaginationMeta = {
  page: number;
  limit: number;
  total: number;
  pages?: number;
};

export type ApiResponse<T> = {
  success: boolean;
  message?: string;
  data: T;
  meta?: PaginationMeta;
};

export type PaginatedResponse<T> = {
  success: boolean;
  data: T[];
  meta: PaginationMeta;
};
