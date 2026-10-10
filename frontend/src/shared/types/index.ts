export * from './common';

// Re-export model aliases and types specified in FinGuard Frontend Master Prompt
export type {
  User,
  Profile,
  KYCApplication,
  KYCDocument,
  LoanApplication,
  AuditLog,
  BorrowerFeatures,
  PaginationMeta,
  ApiResponse,
  PaginatedResponse,
} from './common';

export type UserRole = 'CUSTOMER' | 'LOAN_OFFICER' | 'ADMIN' | 'SUPERADMIN' | 'USER' | 'REVIEWER';
export type LoanStatus = 'SUBMITTED' | 'UNDER_REVIEW' | 'APPROVED' | 'REJECTED' | 'PENDING' | 'DISBURSED' | 'ACTIVE' | 'CLOSED' | 'DEFAULTED';
export type KYCStatus = 'PENDING' | 'UNDER_REVIEW' | 'VERIFIED' | 'APPROVED' | 'REJECTED' | 'RESUBMIT_REQUIRED';

export interface Loan {
  id: number | string;
  customerId?: number | string;
  userId?: string;
  amount: number;
  tenure?: number;
  termMonths?: number;
  status: LoanStatus;
  riskScore?: number;
  createdAt: string;
}

export interface KYC {
  id: number | string;
  userId: number | string;
  status: KYCStatus;
  identityDocUrl?: string;
  faceSelfieUrl?: string;
  verifiedAt?: string;
}

export interface ButtonProps {
  variant?: 'primary' | 'secondary' | 'danger' | 'success';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  loading?: boolean;
  onClick?: (e?: React.MouseEvent) => void;
  children: React.ReactNode;
  className?: string;
  type?: 'button' | 'submit' | 'reset';
  icon?: React.ReactNode;
}

export interface InputFieldProps {
  label?: string;
  value: string | number;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  error?: string | false;
  type?: string;
  placeholder?: string;
  required?: boolean;
  className?: string;
  disabled?: boolean;
  onBlur?: (e: React.FocusEvent<HTMLInputElement>) => void;
}
