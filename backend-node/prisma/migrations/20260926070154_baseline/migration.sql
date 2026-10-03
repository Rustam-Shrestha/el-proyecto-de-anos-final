-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "auth";

-- CreateEnum
CREATE TYPE "auth"."DocumentType" AS ENUM ('CITIZENSHIP_FRONT', 'CITIZENSHIP_BACK', 'SELFIE', 'INCOME_PROOF', 'BANK_STATEMENT', 'EXISTING_LOAN', 'COLLATERAL', 'SALARY_SLIP', 'BUSINESS_REG', 'INCOME_CERT', 'PAN', 'PENSION_LETTER');

-- CreateEnum
CREATE TYPE "auth"."DocumentVerificationStatus" AS ENUM ('PENDING', 'PROCESSING', 'VERIFIED', 'REJECTED', 'MANUAL_REVIEW');

-- CreateEnum
CREATE TYPE "auth"."LoanStatus" AS ENUM ('SUBMITTED', 'UNDER_REVIEW', 'APPROVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "auth"."LoanPurpose" AS ENUM ('HOME', 'EDUCATION', 'BUSINESS', 'PERSONAL');

-- CreateEnum
CREATE TYPE "auth"."RiskLevel" AS ENUM ('LOW', 'MEDIUM', 'HIGH');

-- CreateEnum
CREATE TYPE "auth"."NotificationType" AS ENUM ('KYC_SUBMITTED', 'KYC_APPROVED', 'KYC_REJECTED', 'KYC_PENDING_REVIEW', 'PORTFOLIO_SUBMITTED', 'PORTFOLIO_APPROVED', 'PORTFOLIO_REJECTED', 'DOCUMENT_UPLOADED', 'DOCUMENT_FLAGGED', 'DOCUMENT_VERIFIED', 'LOAN_APPLICATION_SUBMITTED', 'LOAN_APPROVED', 'LOAN_REJECTED', 'LOAN_UNDER_REVIEW', 'LOAN_DISBURSED', 'LOAN_REPAYMENT_DUE', 'LOAN_REPAYMENT_OVERDUE', 'LOAN_REPAYMENT_REMINDER', 'SYSTEM_ALERT', 'ADMIN_ACTION_REQUIRED', 'DOCUMENT_EXPIRING_SOON');

-- CreateEnum
CREATE TYPE "auth"."NotificationStatus" AS ENUM ('UNREAD', 'READ', 'ARCHIVED');

-- CreateTable
CREATE TABLE "auth"."Role" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Role_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "auth"."tenants" (
    "id" SERIAL NOT NULL,
    "slug" VARCHAR(50) NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "domain" TEXT,
    "companyType" VARCHAR(50),
    "panNumber" VARCHAR(10),
    "logoUrl" VARCHAR(500),
    "status" VARCHAR(20) NOT NULL DEFAULT 'active',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdBy" INTEGER,
    "subscriptionTier" VARCHAR(50),
    "maxUsers" INTEGER NOT NULL DEFAULT 100,
    "maxLoans" INTEGER NOT NULL DEFAULT 1000,
    "usageLoans" INTEGER NOT NULL DEFAULT 0,
    "usageUsers" INTEGER NOT NULL DEFAULT 0,
    "lastActivity" TIMESTAMP(3),
    "featureMlScoring" BOOLEAN NOT NULL DEFAULT true,
    "featureAuditLogs" BOOLEAN NOT NULL DEFAULT true,
    "featureApiAccess" BOOLEAN NOT NULL DEFAULT true,
    "featureCustomWorkflows" BOOLEAN NOT NULL DEFAULT false,
    "dataResidency" VARCHAR(50),
    "encryptionEnabled" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "tenants_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "auth"."tenant_admins" (
    "id" SERIAL NOT NULL,
    "tenantId" INTEGER NOT NULL,
    "userId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "tenant_admins_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "auth"."company_requests" (
    "id" TEXT NOT NULL,
    "requestedBy" TEXT NOT NULL,
    "companyName" VARCHAR(255) NOT NULL,
    "slug" VARCHAR(50) NOT NULL,
    "panNumber" VARCHAR(10) NOT NULL,
    "gstin" VARCHAR(15),
    "companyType" VARCHAR(50),
    "domain" VARCHAR(255),
    "address" TEXT,
    "documentUrls" JSONB,
    "status" VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    "rejectionReason" TEXT,
    "reviewedBy" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "tenantId" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "company_requests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "auth"."company_invites" (
    "id" TEXT NOT NULL,
    "tenantId" INTEGER NOT NULL,
    "email" VARCHAR(255) NOT NULL,
    "role" VARCHAR(50) NOT NULL DEFAULT 'USER',
    "token" VARCHAR(255) NOT NULL,
    "status" VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    "invitedBy" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "acceptedAt" TIMESTAMP(3),

    CONSTRAINT "company_invites_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "auth"."role_definitions" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "description" TEXT,
    "hierarchyLevel" INTEGER NOT NULL,
    "isSystem" BOOLEAN NOT NULL DEFAULT true,
    "colorCode" VARCHAR(7),
    "icon" VARCHAR(50),

    CONSTRAINT "role_definitions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "auth"."permission_definitions" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "description" TEXT,
    "resource" VARCHAR(100),
    "action" VARCHAR(50),
    "isSystem" BOOLEAN NOT NULL DEFAULT true,
    "category" VARCHAR(50),
    "hierarchyLevel" INTEGER,

    CONSTRAINT "permission_definitions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "auth"."role_permissions" (
    "id" SERIAL NOT NULL,
    "roleId" INTEGER NOT NULL,
    "permissionId" INTEGER NOT NULL,

    CONSTRAINT "role_permissions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "supercontroller" (
    "id" SERIAL NOT NULL,
    "email" VARCHAR(255) NOT NULL,
    "passwordHash" VARCHAR(255) NOT NULL,
    "fullName" VARCHAR(255),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastLogin" TIMESTAMP(3),
    "status" VARCHAR(20) NOT NULL DEFAULT 'active',

    CONSTRAINT "supercontroller_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "feature_toggles" (
    "id" SERIAL NOT NULL,
    "tenantId" INTEGER NOT NULL,
    "featureName" VARCHAR(100) NOT NULL,
    "isEnabled" BOOLEAN NOT NULL DEFAULT false,
    "enabledBy" INTEGER,
    "enabledAt" TIMESTAMP(3),
    "metadataJson" TEXT,

    CONSTRAINT "feature_toggles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "supercontroller_audit_logs" (
    "id" SERIAL NOT NULL,
    "supercontrollerId" INTEGER,
    "action" VARCHAR(100) NOT NULL,
    "targetType" VARCHAR(50),
    "targetId" VARCHAR(255),
    "changesJson" TEXT,
    "ipAddress" VARCHAR(45),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "supercontroller_audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tenant_metrics" (
    "id" SERIAL NOT NULL,
    "tenantId" INTEGER NOT NULL,
    "metricDate" DATE NOT NULL,
    "totalUsers" INTEGER,
    "totalLoans" INTEGER,
    "totalRevenue" DECIMAL(12,2),
    "apiCalls" INTEGER,
    "errorRate" DECIMAL(5,2),
    "avgResponseTimeMs" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "tenant_metrics_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "auth"."users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "isVerified" BOOLEAN NOT NULL DEFAULT false,
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,
    "tenantId" INTEGER NOT NULL DEFAULT 1,
    "roleId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "auth"."profiles" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "fullName" TEXT,
    "phone" TEXT,
    "address" TEXT,
    "dateOfBirth" TIMESTAMP(3),
    "avatarUrl" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "auth"."sessions" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "refreshTokenHash" TEXT NOT NULL,
    "isRevoked" BOOLEAN NOT NULL DEFAULT false,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "auth"."audit_logs" (
    "id" TEXT NOT NULL,
    "tenantId" INTEGER NOT NULL DEFAULT 1,
    "userId" TEXT,
    "action" TEXT NOT NULL,
    "metadata" JSONB,
    "ip" TEXT NOT NULL DEFAULT 'unknown',
    "userAgent" TEXT NOT NULL DEFAULT 'unknown',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "auth"."kyc_applications" (
    "id" TEXT NOT NULL,
    "tenantId" INTEGER NOT NULL DEFAULT 1,
    "userId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "submittedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reviewedAt" TIMESTAMP(3),
    "reviewerId" TEXT,
    "rejectionReason" TEXT,
    "ocrCitizenshipNumber" TEXT,
    "ocrFullName" TEXT,
    "ocrDateOfBirth" TEXT,
    "ocrGender" TEXT,
    "ocrAddress" TEXT,
    "processingStatus" TEXT NOT NULL DEFAULT 'PENDING',
    "ocrFrontStatus" TEXT NOT NULL DEFAULT 'PENDING',
    "ocrBackStatus" TEXT NOT NULL DEFAULT 'PENDING',
    "faceStatus" TEXT NOT NULL DEFAULT 'PENDING',
    "ocrProcessingError" TEXT,
    "faceProcessingError" TEXT,
    "workflowStage" TEXT NOT NULL DEFAULT 'VALIDATING_FACE',
    "faceVerificationStatus" TEXT NOT NULL DEFAULT 'PENDING',
    "ocrProcessingStatus" TEXT NOT NULL DEFAULT 'PENDING',
    "queuedForManualReview" BOOLEAN NOT NULL DEFAULT false,
    "confirmedCitizenshipNumber" TEXT,
    "confirmedFullName" TEXT,
    "confirmedDateOfBirth" TEXT,
    "confirmedGender" TEXT,
    "confirmedAddress" TEXT,
    "confirmedPhoneNumber" TEXT,
    "confirmedEmail" TEXT,
    "confirmedOccupation" TEXT,
    "confirmedEmployer" TEXT,
    "confirmedMonthlyIncome" DECIMAL(12,2),
    "confirmedMaritalStatus" TEXT,
    "confirmedEducationLevel" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "kyc_applications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "auth"."ocr_results" (
    "id" TEXT NOT NULL,
    "kycApplicationId" TEXT NOT NULL,
    "documentType" TEXT NOT NULL,
    "rawOcrText" TEXT NOT NULL,
    "extractedData" JSONB NOT NULL,
    "overallConfidence" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ocr_results_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "auth"."face_verifications" (
    "id" TEXT NOT NULL,
    "kycApplicationId" TEXT NOT NULL,
    "citizenshipPhotoPath" TEXT NOT NULL,
    "selfiePhotoPath" TEXT NOT NULL,
    "similarityScore" DOUBLE PRECISION NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "recommendation" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "face_verifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "auth"."verification_reports" (
    "id" TEXT NOT NULL,
    "kycApplicationId" TEXT NOT NULL,
    "faceSimilarity" DOUBLE PRECISION,
    "ocrConfidence" DOUBLE PRECISION,
    "fieldsCorrected" INTEGER NOT NULL DEFAULT 0,
    "possibleMismatches" JSONB,
    "manualReviewSuggested" BOOLEAN NOT NULL DEFAULT false,
    "report" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "verification_reports_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "auth"."ocr_extractions" (
    "id" TEXT NOT NULL,
    "kycApplicationId" TEXT NOT NULL,
    "documentType" TEXT NOT NULL,
    "rawText" TEXT NOT NULL,
    "extractedFields" JSONB NOT NULL,
    "overallConfidence" DOUBLE PRECISION NOT NULL,
    "fieldConfidence" JSONB,
    "comparisonResults" JSONB,
    "matchScore" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ocr_extractions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "auth"."extraction_verifications" (
    "id" TEXT NOT NULL,
    "kycApplicationId" TEXT NOT NULL,
    "decision" TEXT NOT NULL,
    "ocrConfidence" DOUBLE PRECISION NOT NULL,
    "matchScore" DOUBLE PRECISION,
    "autoVerified" BOOLEAN NOT NULL DEFAULT false,
    "manualReviewAdded" BOOLEAN NOT NULL DEFAULT false,
    "decisionDetails" JSONB,
    "verifiedAt" TIMESTAMP(3),
    "verifiedBy" TEXT,
    "locked" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "extraction_verifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "auth"."kyc_submission_files" (
    "id" TEXT NOT NULL,
    "kycApplicationId" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "snapshotData" JSONB,
    "faceSimilarity" DOUBLE PRECISION,
    "faceStatusAtCreation" TEXT,
    "ocrStatusAtCreation" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "kyc_submission_files_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "auth"."manual_review_queue" (
    "id" TEXT NOT NULL,
    "kycApplicationId" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "details" TEXT,
    "priority" TEXT NOT NULL DEFAULT 'NORMAL',
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "reviewedBy" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "resolution" TEXT,
    "resolutionNotes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "manual_review_queue_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "auth"."documents" (
    "id" TEXT NOT NULL,
    "tenantId" INTEGER NOT NULL DEFAULT 1,
    "userId" TEXT NOT NULL,
    "kycId" TEXT NOT NULL,
    "documentType" "auth"."DocumentType" NOT NULL,
    "filePath" TEXT NOT NULL,
    "fileMimeType" TEXT,
    "fileSize" INTEGER,
    "ocrStatus" "auth"."DocumentVerificationStatus" NOT NULL DEFAULT 'PENDING',
    "ocrConfidence" DOUBLE PRECISION,
    "extractedData" JSONB,
    "ocrErrorMessage" TEXT,
    "ocrProcessedAt" TIMESTAMP(3),
    "verificationStatus" "auth"."DocumentVerificationStatus" NOT NULL DEFAULT 'PENDING',
    "verificationNotes" TEXT,
    "verifiedBy" TEXT,
    "verifiedAt" TIMESTAMP(3),
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,
    "version" INTEGER NOT NULL DEFAULT 1,
    "replacedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "documents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "auth"."document_versions" (
    "id" TEXT NOT NULL,
    "documentId" TEXT NOT NULL,
    "filePath" TEXT NOT NULL,
    "version" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "document_versions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "auth"."financial_documents" (
    "id" TEXT NOT NULL,
    "tenantId" INTEGER NOT NULL DEFAULT 1,
    "userId" TEXT NOT NULL,
    "documentType" TEXT NOT NULL,
    "filePath" TEXT NOT NULL,
    "fileMimeType" TEXT,
    "fileSize" INTEGER,
    "originalName" TEXT,
    "ocrStatus" TEXT NOT NULL DEFAULT 'PENDING',
    "ocrData" JSONB,
    "ocrConfidence" DOUBLE PRECISION,
    "ocrErrorMessage" TEXT,
    "ocrRawText" TEXT,
    "ocrProcessedAt" TIMESTAMP(3),
    "extractedFields" JSONB,
    "comparisonResult" JSONB,
    "anomalyFlags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "flagCount" INTEGER NOT NULL DEFAULT 0,
    "verificationStatus" TEXT NOT NULL DEFAULT 'PENDING',
    "adminNotes" TEXT,
    "verifiedBy" TEXT,
    "verifiedAt" TIMESTAMP(3),
    "isExpired" BOOLEAN NOT NULL DEFAULT false,
    "expiryDate" TIMESTAMP(3),
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "financial_documents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "auth"."portfolio_verifications" (
    "id" TEXT NOT NULL,
    "tenantId" INTEGER NOT NULL DEFAULT 1,
    "userId" TEXT NOT NULL,
    "verificationStatus" TEXT NOT NULL DEFAULT 'INCOMPLETE',
    "documentsUploaded" INTEGER NOT NULL DEFAULT 0,
    "documentsVerified" INTEGER NOT NULL DEFAULT 0,
    "documentsFlagged" INTEGER NOT NULL DEFAULT 0,
    "allDocumentsVerified" BOOLEAN NOT NULL DEFAULT false,
    "canProceedToLoan" BOOLEAN NOT NULL DEFAULT false,
    "loanToIncomeRatio" DECIMAL(5,2),
    "emiToIncomeRatio" DECIMAL(5,2),
    "incomePerDependent" DECIMAL(12,2),
    "employmentStabilityScore" INTEGER,
    "ageCategory" TEXT,
    "overallRiskScore" INTEGER,
    "riskLevel" TEXT,
    "flagsCount" INTEGER NOT NULL DEFAULT 0,
    "flagDetails" JSONB,
    "adminNotes" TEXT,
    "reviewedBy" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "lastUpdated" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "portfolio_verifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "auth"."loan_accounts" (
    "id" TEXT NOT NULL,
    "tenantId" INTEGER NOT NULL DEFAULT 1,
    "userId" TEXT NOT NULL,
    "loanId" TEXT,
    "principalAmount" DECIMAL(12,2) NOT NULL,
    "outstandingBalance" DECIMAL(12,2) NOT NULL,
    "monthlyEMI" DECIMAL(10,2) NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "startDate" TIMESTAMP(3) NOT NULL,
    "expectedEndDate" TIMESTAMP(3),
    "closedAt" TIMESTAMP(3),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "loan_accounts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "auth"."employment_info" (
    "id" TEXT NOT NULL,
    "tenantId" INTEGER NOT NULL DEFAULT 1,
    "userId" TEXT NOT NULL,
    "employmentStatus" TEXT NOT NULL DEFAULT 'UNEMPLOYED',
    "occupationJobTitle" TEXT,
    "employerName" TEXT,
    "employmentStartDate" TIMESTAMP(3),
    "monthlyGrossIncome" DECIMAL(12,2) NOT NULL,
    "annualIncome" DECIMAL(12,2) NOT NULL,
    "dependentsCount" INTEGER NOT NULL DEFAULT 0,
    "businessName" TEXT,
    "businessType" TEXT,
    "institutionName" TEXT,
    "educationLevel" TEXT,
    "expectedGraduationDate" TIMESTAMP(3),
    "employmentTenureMonths" INTEGER,
    "employmentTenureDays" INTEGER,
    "employmentStable" BOOLEAN NOT NULL DEFAULT false,
    "incomeSourceType" TEXT NOT NULL DEFAULT 'SALARY',
    "incomeStabilityScore" INTEGER NOT NULL DEFAULT 50,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "employment_info_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "auth"."loan_features" (
    "id" TEXT NOT NULL,
    "tenantId" INTEGER NOT NULL DEFAULT 1,
    "userId" TEXT NOT NULL,
    "loanApplicationId" TEXT,
    "requestedLoanAmount" DECIMAL(12,2) NOT NULL,
    "loanTenureMonths" INTEGER NOT NULL,
    "calculatedEMI" DECIMAL(10,2) NOT NULL,
    "daysBirth" INTEGER,
    "daysEmployed" INTEGER,
    "occupationType" TEXT,
    "cntChildren" INTEGER,
    "creditIncomePercent" DECIMAL(5,2) NOT NULL,
    "annuityIncomePercent" DECIMAL(5,2) NOT NULL,
    "incomePerPerson" DECIMAL(12,2) NOT NULL,
    "daysEmployedPercent" DECIMAL(5,2),
    "employmentStability" BOOLEAN NOT NULL DEFAULT false,
    "ageCategory" INTEGER NOT NULL DEFAULT 0,
    "totalDebtObligations" DECIMAL(12,2) NOT NULL,
    "debtToIncomeRatio" DECIMAL(5,2) NOT NULL,
    "availableMonthlyCapacity" DECIMAL(10,2) NOT NULL,
    "riskScore" INTEGER NOT NULL DEFAULT 50,
    "riskLevel" TEXT NOT NULL DEFAULT 'MEDIUM',
    "defaultProbability" DOUBLE PRECISION,
    "lastCalculated" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "loan_features_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "auth"."borrower_features" (
    "id" TEXT NOT NULL,
    "tenantId" INTEGER NOT NULL DEFAULT 1,
    "userId" TEXT NOT NULL,
    "amtIncomeTotal" DECIMAL(12,2),
    "amtCredit" DECIMAL(12,2),
    "daysBirth" INTEGER,
    "daysEmployed" INTEGER,
    "debtToIncomeRatio" DECIMAL(5,2),
    "paymentConsistencyScore" DECIMAL(5,2),
    "cntInstalment" INTEGER DEFAULT 0,
    "amtAnnuity" DECIMAL(12,2),
    "computedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "borrower_features_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "auth"."loan_applications" (
    "id" TEXT NOT NULL,
    "tenantId" INTEGER NOT NULL DEFAULT 1,
    "userId" TEXT NOT NULL,
    "requestedAmount" DECIMAL(12,2) NOT NULL,
    "tenureMonths" INTEGER NOT NULL,
    "purpose" "auth"."LoanPurpose" NOT NULL,
    "calculatedEmi" DECIMAL(10,2),
    "status" "auth"."LoanStatus" NOT NULL DEFAULT 'SUBMITTED',
    "riskScore" INTEGER,
    "riskLevel" "auth"."RiskLevel",
    "loanOfficerNotes" TEXT,
    "reviewedBy" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "defaultProbability" DOUBLE PRECISION,
    "modelVersion" TEXT,
    "shapValues" JSONB,
    "featureSnapshot" JSONB,
    "mlDecision" TEXT,
    "creditScore" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "loan_applications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "auth"."bank_statements" (
    "id" TEXT NOT NULL,
    "tenantId" INTEGER NOT NULL DEFAULT 1,
    "userId" TEXT NOT NULL,
    "bankName" TEXT,
    "accountNumber" TEXT,
    "accountHolderName" TEXT,
    "statementFromDate" TIMESTAMP(3),
    "statementToDate" TIMESTAMP(3),
    "openingBalance" DECIMAL(15,2),
    "closingBalance" DECIMAL(15,2),
    "filePath" TEXT,
    "fileChecksum" TEXT,
    "parsingStatus" TEXT NOT NULL DEFAULT 'PENDING',
    "errorMessage" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "bank_statements_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "auth"."transactions" (
    "id" TEXT NOT NULL,
    "tenantId" INTEGER NOT NULL DEFAULT 1,
    "bankStatementId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "transactionDate" TIMESTAMP(3) NOT NULL,
    "description" TEXT,
    "debit" DECIMAL(15,2),
    "credit" DECIMAL(15,2),
    "balance" DECIMAL(15,2),
    "transactionType" TEXT,
    "category" TEXT,
    "confidenceScore" DOUBLE PRECISION NOT NULL DEFAULT 1.0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "transactions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "auth"."financial_profiles" (
    "id" TEXT NOT NULL,
    "tenantId" INTEGER NOT NULL DEFAULT 1,
    "userId" TEXT NOT NULL,
    "totalStatements" INTEGER NOT NULL DEFAULT 0,
    "dateRangeStart" TIMESTAMP(3),
    "dateRangeEnd" TIMESTAMP(3),
    "avgMonthlyIncome" DECIMAL(15,2),
    "avgMonthlyExpense" DECIMAL(15,2),
    "totalIncome" DECIMAL(15,2),
    "totalExpense" DECIMAL(15,2),
    "totalSavings" DECIMAL(15,2),
    "savingsRate" DOUBLE PRECISION,
    "debtToIncomeRatio" DOUBLE PRECISION,
    "incomeStabilityScore" DOUBLE PRECISION,
    "creditScoreEstimate" INTEGER,
    "lastUpdated" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "financial_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "auth"."loan_assessments" (
    "id" TEXT NOT NULL,
    "tenantId" INTEGER NOT NULL DEFAULT 1,
    "userId" TEXT NOT NULL,
    "requestedAmount" DECIMAL(15,2) NOT NULL,
    "loanTenureMonths" INTEGER,
    "interestRateAssumed" DOUBLE PRECISION NOT NULL DEFAULT 10.5,
    "eligibleAmount" DECIMAL(15,2),
    "maxMonthlyEmi" DECIMAL(15,2),
    "recommendedTenure" INTEGER,
    "eligibilityScore" DOUBLE PRECISION,
    "riskLevel" TEXT,
    "recommendation" TEXT,
    "assessmentDetails" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "loan_assessments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "auth"."nlu_queries" (
    "id" TEXT NOT NULL,
    "tenantId" INTEGER NOT NULL DEFAULT 1,
    "userId" TEXT,
    "rawQuestion" TEXT NOT NULL,
    "intent" TEXT,
    "extractedEntities" JSONB,
    "generatedSql" TEXT,
    "queryResult" JSONB,
    "response" TEXT,
    "processingTimeMs" INTEGER,
    "errorMessage" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "nlu_queries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "auth"."chat_conversations" (
    "id" TEXT NOT NULL,
    "tenantId" INTEGER NOT NULL DEFAULT 1,
    "userId" TEXT NOT NULL,
    "sessionId" TEXT,
    "messages" JSONB,
    "context" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "chat_conversations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "auth"."notifications" (
    "id" TEXT NOT NULL,
    "tenantId" INTEGER NOT NULL DEFAULT 1,
    "userId" TEXT NOT NULL,
    "type" "auth"."NotificationType" NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "description" TEXT,
    "relatedEntityType" TEXT,
    "relatedEntityId" TEXT,
    "actionUrl" TEXT,
    "status" "auth"."NotificationStatus" NOT NULL DEFAULT 'UNREAD',
    "priority" TEXT NOT NULL DEFAULT 'NORMAL',
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "readAt" TIMESTAMP(3),
    "archivedAt" TIMESTAMP(3),
    "expiresAt" TIMESTAMP(3),
    "emailSent" BOOLEAN NOT NULL DEFAULT false,
    "smsSent" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "auth"."notification_preferences" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "emailNotificationsEnabled" BOOLEAN NOT NULL DEFAULT true,
    "smsNotificationsEnabled" BOOLEAN NOT NULL DEFAULT false,
    "inAppNotificationsEnabled" BOOLEAN NOT NULL DEFAULT true,
    "kycNotifications" BOOLEAN NOT NULL DEFAULT true,
    "portfolioNotifications" BOOLEAN NOT NULL DEFAULT true,
    "loanNotifications" BOOLEAN NOT NULL DEFAULT true,
    "documentNotifications" BOOLEAN NOT NULL DEFAULT true,
    "systemNotifications" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "notification_preferences_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Role_name_key" ON "auth"."Role"("name");

-- CreateIndex
CREATE UNIQUE INDEX "tenants_slug_key" ON "auth"."tenants"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "tenants_panNumber_key" ON "auth"."tenants"("panNumber");

-- CreateIndex
CREATE UNIQUE INDEX "company_requests_slug_key" ON "auth"."company_requests"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "company_requests_panNumber_key" ON "auth"."company_requests"("panNumber");

-- CreateIndex
CREATE INDEX "company_requests_requestedBy_idx" ON "auth"."company_requests"("requestedBy");

-- CreateIndex
CREATE INDEX "company_requests_status_idx" ON "auth"."company_requests"("status");

-- CreateIndex
CREATE INDEX "company_requests_panNumber_idx" ON "auth"."company_requests"("panNumber");

-- CreateIndex
CREATE UNIQUE INDEX "company_invites_token_key" ON "auth"."company_invites"("token");

-- CreateIndex
CREATE INDEX "company_invites_tenantId_idx" ON "auth"."company_invites"("tenantId");

-- CreateIndex
CREATE INDEX "company_invites_email_idx" ON "auth"."company_invites"("email");

-- CreateIndex
CREATE INDEX "company_invites_token_idx" ON "auth"."company_invites"("token");

-- CreateIndex
CREATE UNIQUE INDEX "permission_definitions_name_key" ON "auth"."permission_definitions"("name");

-- CreateIndex
CREATE UNIQUE INDEX "role_permissions_roleId_permissionId_key" ON "auth"."role_permissions"("roleId", "permissionId");

-- CreateIndex
CREATE UNIQUE INDEX "supercontroller_email_key" ON "supercontroller"("email");

-- CreateIndex
CREATE UNIQUE INDEX "feature_toggles_tenantId_featureName_key" ON "feature_toggles"("tenantId", "featureName");

-- CreateIndex
CREATE UNIQUE INDEX "tenant_metrics_tenantId_metricDate_key" ON "tenant_metrics"("tenantId", "metricDate");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "auth"."users"("email");

-- CreateIndex
CREATE INDEX "users_email_idx" ON "auth"."users"("email");

-- CreateIndex
CREATE INDEX "users_roleId_idx" ON "auth"."users"("roleId");

-- CreateIndex
CREATE INDEX "users_tenantId_idx" ON "auth"."users"("tenantId");

-- CreateIndex
CREATE UNIQUE INDEX "profiles_userId_key" ON "auth"."profiles"("userId");

-- CreateIndex
CREATE INDEX "profiles_userId_idx" ON "auth"."profiles"("userId");

-- CreateIndex
CREATE INDEX "sessions_userId_idx" ON "auth"."sessions"("userId");

-- CreateIndex
CREATE INDEX "sessions_expiresAt_idx" ON "auth"."sessions"("expiresAt");

-- CreateIndex
CREATE INDEX "audit_logs_tenantId_idx" ON "auth"."audit_logs"("tenantId");

-- CreateIndex
CREATE INDEX "audit_logs_userId_idx" ON "auth"."audit_logs"("userId");

-- CreateIndex
CREATE INDEX "audit_logs_action_idx" ON "auth"."audit_logs"("action");

-- CreateIndex
CREATE INDEX "audit_logs_createdAt_idx" ON "auth"."audit_logs"("createdAt");

-- CreateIndex
CREATE INDEX "kyc_applications_tenantId_idx" ON "auth"."kyc_applications"("tenantId");

-- CreateIndex
CREATE INDEX "kyc_applications_userId_idx" ON "auth"."kyc_applications"("userId");

-- CreateIndex
CREATE INDEX "kyc_applications_status_idx" ON "auth"."kyc_applications"("status");

-- CreateIndex
CREATE INDEX "ocr_results_kycApplicationId_idx" ON "auth"."ocr_results"("kycApplicationId");

-- CreateIndex
CREATE UNIQUE INDEX "face_verifications_kycApplicationId_key" ON "auth"."face_verifications"("kycApplicationId");

-- CreateIndex
CREATE INDEX "face_verifications_kycApplicationId_idx" ON "auth"."face_verifications"("kycApplicationId");

-- CreateIndex
CREATE UNIQUE INDEX "verification_reports_kycApplicationId_key" ON "auth"."verification_reports"("kycApplicationId");

-- CreateIndex
CREATE INDEX "verification_reports_kycApplicationId_idx" ON "auth"."verification_reports"("kycApplicationId");

-- CreateIndex
CREATE INDEX "ocr_extractions_kycApplicationId_idx" ON "auth"."ocr_extractions"("kycApplicationId");

-- CreateIndex
CREATE UNIQUE INDEX "extraction_verifications_kycApplicationId_key" ON "auth"."extraction_verifications"("kycApplicationId");

-- CreateIndex
CREATE INDEX "extraction_verifications_kycApplicationId_idx" ON "auth"."extraction_verifications"("kycApplicationId");

-- CreateIndex
CREATE UNIQUE INDEX "kyc_submission_files_kycApplicationId_key" ON "auth"."kyc_submission_files"("kycApplicationId");

-- CreateIndex
CREATE INDEX "kyc_submission_files_kycApplicationId_idx" ON "auth"."kyc_submission_files"("kycApplicationId");

-- CreateIndex
CREATE INDEX "manual_review_queue_kycApplicationId_idx" ON "auth"."manual_review_queue"("kycApplicationId");

-- CreateIndex
CREATE INDEX "manual_review_queue_status_idx" ON "auth"."manual_review_queue"("status");

-- CreateIndex
CREATE INDEX "manual_review_queue_priority_idx" ON "auth"."manual_review_queue"("priority");

-- CreateIndex
CREATE INDEX "documents_tenantId_idx" ON "auth"."documents"("tenantId");

-- CreateIndex
CREATE INDEX "documents_userId_idx" ON "auth"."documents"("userId");

-- CreateIndex
CREATE INDEX "documents_kycId_idx" ON "auth"."documents"("kycId");

-- CreateIndex
CREATE INDEX "documents_documentType_idx" ON "auth"."documents"("documentType");

-- CreateIndex
CREATE INDEX "documents_verificationStatus_idx" ON "auth"."documents"("verificationStatus");

-- CreateIndex
CREATE INDEX "documents_isDeleted_idx" ON "auth"."documents"("isDeleted");

-- CreateIndex
CREATE INDEX "document_versions_documentId_idx" ON "auth"."document_versions"("documentId");

-- CreateIndex
CREATE INDEX "financial_documents_tenantId_idx" ON "auth"."financial_documents"("tenantId");

-- CreateIndex
CREATE INDEX "financial_documents_userId_idx" ON "auth"."financial_documents"("userId");

-- CreateIndex
CREATE INDEX "financial_documents_verificationStatus_idx" ON "auth"."financial_documents"("verificationStatus");

-- CreateIndex
CREATE INDEX "financial_documents_documentType_idx" ON "auth"."financial_documents"("documentType");

-- CreateIndex
CREATE UNIQUE INDEX "portfolio_verifications_userId_key" ON "auth"."portfolio_verifications"("userId");

-- CreateIndex
CREATE INDEX "portfolio_verifications_tenantId_idx" ON "auth"."portfolio_verifications"("tenantId");

-- CreateIndex
CREATE INDEX "portfolio_verifications_userId_idx" ON "auth"."portfolio_verifications"("userId");

-- CreateIndex
CREATE INDEX "portfolio_verifications_verificationStatus_idx" ON "auth"."portfolio_verifications"("verificationStatus");

-- CreateIndex
CREATE INDEX "loan_accounts_tenantId_idx" ON "auth"."loan_accounts"("tenantId");

-- CreateIndex
CREATE INDEX "loan_accounts_userId_idx" ON "auth"."loan_accounts"("userId");

-- CreateIndex
CREATE INDEX "loan_accounts_status_idx" ON "auth"."loan_accounts"("status");

-- CreateIndex
CREATE INDEX "loan_accounts_isActive_idx" ON "auth"."loan_accounts"("isActive");

-- CreateIndex
CREATE UNIQUE INDEX "employment_info_userId_key" ON "auth"."employment_info"("userId");

-- CreateIndex
CREATE INDEX "employment_info_tenantId_idx" ON "auth"."employment_info"("tenantId");

-- CreateIndex
CREATE INDEX "employment_info_userId_idx" ON "auth"."employment_info"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "loan_features_userId_key" ON "auth"."loan_features"("userId");

-- CreateIndex
CREATE INDEX "loan_features_tenantId_idx" ON "auth"."loan_features"("tenantId");

-- CreateIndex
CREATE INDEX "loan_features_userId_idx" ON "auth"."loan_features"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "borrower_features_userId_key" ON "auth"."borrower_features"("userId");

-- CreateIndex
CREATE INDEX "borrower_features_tenantId_idx" ON "auth"."borrower_features"("tenantId");

-- CreateIndex
CREATE INDEX "borrower_features_userId_idx" ON "auth"."borrower_features"("userId");

-- CreateIndex
CREATE INDEX "loan_applications_tenantId_idx" ON "auth"."loan_applications"("tenantId");

-- CreateIndex
CREATE INDEX "loan_applications_userId_idx" ON "auth"."loan_applications"("userId");

-- CreateIndex
CREATE INDEX "loan_applications_status_idx" ON "auth"."loan_applications"("status");

-- CreateIndex
CREATE UNIQUE INDEX "bank_statements_fileChecksum_key" ON "auth"."bank_statements"("fileChecksum");

-- CreateIndex
CREATE INDEX "bank_statements_tenantId_idx" ON "auth"."bank_statements"("tenantId");

-- CreateIndex
CREATE INDEX "bank_statements_userId_idx" ON "auth"."bank_statements"("userId");

-- CreateIndex
CREATE INDEX "bank_statements_parsingStatus_idx" ON "auth"."bank_statements"("parsingStatus");

-- CreateIndex
CREATE INDEX "transactions_tenantId_idx" ON "auth"."transactions"("tenantId");

-- CreateIndex
CREATE INDEX "transactions_userId_idx" ON "auth"."transactions"("userId");

-- CreateIndex
CREATE INDEX "transactions_bankStatementId_idx" ON "auth"."transactions"("bankStatementId");

-- CreateIndex
CREATE INDEX "transactions_transactionDate_idx" ON "auth"."transactions"("transactionDate");

-- CreateIndex
CREATE INDEX "transactions_category_idx" ON "auth"."transactions"("category");

-- CreateIndex
CREATE UNIQUE INDEX "financial_profiles_userId_key" ON "auth"."financial_profiles"("userId");

-- CreateIndex
CREATE INDEX "financial_profiles_tenantId_idx" ON "auth"."financial_profiles"("tenantId");

-- CreateIndex
CREATE INDEX "financial_profiles_userId_idx" ON "auth"."financial_profiles"("userId");

-- CreateIndex
CREATE INDEX "loan_assessments_tenantId_idx" ON "auth"."loan_assessments"("tenantId");

-- CreateIndex
CREATE INDEX "loan_assessments_userId_idx" ON "auth"."loan_assessments"("userId");

-- CreateIndex
CREATE INDEX "nlu_queries_tenantId_idx" ON "auth"."nlu_queries"("tenantId");

-- CreateIndex
CREATE INDEX "nlu_queries_userId_idx" ON "auth"."nlu_queries"("userId");

-- CreateIndex
CREATE INDEX "chat_conversations_tenantId_idx" ON "auth"."chat_conversations"("tenantId");

-- CreateIndex
CREATE INDEX "chat_conversations_userId_idx" ON "auth"."chat_conversations"("userId");

-- CreateIndex
CREATE INDEX "chat_conversations_sessionId_idx" ON "auth"."chat_conversations"("sessionId");

-- CreateIndex
CREATE INDEX "notifications_tenantId_idx" ON "auth"."notifications"("tenantId");

-- CreateIndex
CREATE INDEX "notifications_userId_status_createdAt_idx" ON "auth"."notifications"("userId", "status", "createdAt");

-- CreateIndex
CREATE INDEX "notifications_type_createdAt_idx" ON "auth"."notifications"("type", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "notification_preferences_userId_key" ON "auth"."notification_preferences"("userId");

-- AddForeignKey
ALTER TABLE "auth"."tenant_admins" ADD CONSTRAINT "tenant_admins_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "auth"."tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "auth"."role_permissions" ADD CONSTRAINT "role_permissions_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "auth"."role_definitions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "auth"."role_permissions" ADD CONSTRAINT "role_permissions_permissionId_fkey" FOREIGN KEY ("permissionId") REFERENCES "auth"."permission_definitions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "auth"."users" ADD CONSTRAINT "users_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "auth"."Role"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "auth"."profiles" ADD CONSTRAINT "profiles_userId_fkey" FOREIGN KEY ("userId") REFERENCES "auth"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "auth"."sessions" ADD CONSTRAINT "sessions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "auth"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "auth"."audit_logs" ADD CONSTRAINT "audit_logs_userId_fkey" FOREIGN KEY ("userId") REFERENCES "auth"."users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "auth"."kyc_applications" ADD CONSTRAINT "kyc_applications_userId_fkey" FOREIGN KEY ("userId") REFERENCES "auth"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "auth"."ocr_results" ADD CONSTRAINT "ocr_results_kycApplicationId_fkey" FOREIGN KEY ("kycApplicationId") REFERENCES "auth"."kyc_applications"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "auth"."face_verifications" ADD CONSTRAINT "face_verifications_kycApplicationId_fkey" FOREIGN KEY ("kycApplicationId") REFERENCES "auth"."kyc_applications"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "auth"."verification_reports" ADD CONSTRAINT "verification_reports_kycApplicationId_fkey" FOREIGN KEY ("kycApplicationId") REFERENCES "auth"."kyc_applications"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "auth"."ocr_extractions" ADD CONSTRAINT "ocr_extractions_kycApplicationId_fkey" FOREIGN KEY ("kycApplicationId") REFERENCES "auth"."kyc_applications"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "auth"."extraction_verifications" ADD CONSTRAINT "extraction_verifications_kycApplicationId_fkey" FOREIGN KEY ("kycApplicationId") REFERENCES "auth"."kyc_applications"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "auth"."kyc_submission_files" ADD CONSTRAINT "kyc_submission_files_kycApplicationId_fkey" FOREIGN KEY ("kycApplicationId") REFERENCES "auth"."kyc_applications"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "auth"."manual_review_queue" ADD CONSTRAINT "manual_review_queue_kycApplicationId_fkey" FOREIGN KEY ("kycApplicationId") REFERENCES "auth"."kyc_applications"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "auth"."documents" ADD CONSTRAINT "documents_userId_fkey" FOREIGN KEY ("userId") REFERENCES "auth"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "auth"."documents" ADD CONSTRAINT "documents_kycId_fkey" FOREIGN KEY ("kycId") REFERENCES "auth"."kyc_applications"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "auth"."documents" ADD CONSTRAINT "documents_verifiedBy_fkey" FOREIGN KEY ("verifiedBy") REFERENCES "auth"."users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "auth"."documents" ADD CONSTRAINT "documents_replacedById_fkey" FOREIGN KEY ("replacedById") REFERENCES "auth"."documents"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "auth"."document_versions" ADD CONSTRAINT "document_versions_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "auth"."documents"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "auth"."financial_documents" ADD CONSTRAINT "financial_documents_userId_fkey" FOREIGN KEY ("userId") REFERENCES "auth"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "auth"."portfolio_verifications" ADD CONSTRAINT "portfolio_verifications_userId_fkey" FOREIGN KEY ("userId") REFERENCES "auth"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "auth"."loan_accounts" ADD CONSTRAINT "loan_accounts_userId_fkey" FOREIGN KEY ("userId") REFERENCES "auth"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "auth"."employment_info" ADD CONSTRAINT "employment_info_userId_fkey" FOREIGN KEY ("userId") REFERENCES "auth"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "auth"."loan_features" ADD CONSTRAINT "loan_features_userId_fkey" FOREIGN KEY ("userId") REFERENCES "auth"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "auth"."borrower_features" ADD CONSTRAINT "borrower_features_userId_fkey" FOREIGN KEY ("userId") REFERENCES "auth"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "auth"."loan_applications" ADD CONSTRAINT "loan_applications_userId_fkey" FOREIGN KEY ("userId") REFERENCES "auth"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "auth"."loan_applications" ADD CONSTRAINT "loan_applications_reviewedBy_fkey" FOREIGN KEY ("reviewedBy") REFERENCES "auth"."users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "auth"."bank_statements" ADD CONSTRAINT "bank_statements_userId_fkey" FOREIGN KEY ("userId") REFERENCES "auth"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "auth"."transactions" ADD CONSTRAINT "transactions_bankStatementId_fkey" FOREIGN KEY ("bankStatementId") REFERENCES "auth"."bank_statements"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "auth"."transactions" ADD CONSTRAINT "transactions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "auth"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "auth"."financial_profiles" ADD CONSTRAINT "financial_profiles_userId_fkey" FOREIGN KEY ("userId") REFERENCES "auth"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "auth"."loan_assessments" ADD CONSTRAINT "loan_assessments_userId_fkey" FOREIGN KEY ("userId") REFERENCES "auth"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "auth"."nlu_queries" ADD CONSTRAINT "nlu_queries_userId_fkey" FOREIGN KEY ("userId") REFERENCES "auth"."users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "auth"."chat_conversations" ADD CONSTRAINT "chat_conversations_userId_fkey" FOREIGN KEY ("userId") REFERENCES "auth"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "auth"."notifications" ADD CONSTRAINT "notifications_userId_fkey" FOREIGN KEY ("userId") REFERENCES "auth"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "auth"."notification_preferences" ADD CONSTRAINT "notification_preferences_userId_fkey" FOREIGN KEY ("userId") REFERENCES "auth"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
