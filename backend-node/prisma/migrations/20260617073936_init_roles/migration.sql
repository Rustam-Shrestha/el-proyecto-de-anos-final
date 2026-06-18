-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "auth";

-- CreateEnum
CREATE TYPE "auth"."DocumentType" AS ENUM ('CITIZENSHIP_FRONT', 'CITIZENSHIP_BACK', 'SELFIE', 'INCOME_PROOF', 'BANK_STATEMENT', 'EXISTING_LOAN', 'COLLATERAL');

-- CreateEnum
CREATE TYPE "auth"."DocumentVerificationStatus" AS ENUM ('PENDING', 'PROCESSING', 'VERIFIED', 'REJECTED', 'MANUAL_REVIEW');

-- CreateEnum
CREATE TYPE "auth"."LoanStatus" AS ENUM ('SUBMITTED', 'UNDER_REVIEW', 'APPROVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "auth"."LoanPurpose" AS ENUM ('HOME', 'EDUCATION', 'BUSINESS', 'PERSONAL');

-- CreateEnum
CREATE TYPE "auth"."RiskLevel" AS ENUM ('LOW', 'MEDIUM', 'HIGH');

-- CreateTable
CREATE TABLE "auth"."Role" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Role_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "auth"."users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "isVerified" BOOLEAN NOT NULL DEFAULT false,
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,
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
    "userId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "submittedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reviewedAt" TIMESTAMP(3),
    "reviewerId" TEXT,
    "rejectionReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "kyc_applications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "auth"."documents" (
    "id" TEXT NOT NULL,
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
CREATE TABLE "auth"."employment_info" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "jobTitle" TEXT NOT NULL,
    "employmentStartDate" TIMESTAMP(3) NOT NULL,
    "declaredAnnualIncome" DECIMAL(12,2) NOT NULL,
    "employmentTenureMonths" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "employment_info_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "auth"."borrower_features" (
    "id" TEXT NOT NULL,
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
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "loan_applications_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Role_name_key" ON "auth"."Role"("name");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "auth"."users"("email");

-- CreateIndex
CREATE INDEX "users_email_idx" ON "auth"."users"("email");

-- CreateIndex
CREATE INDEX "users_roleId_idx" ON "auth"."users"("roleId");

-- CreateIndex
CREATE UNIQUE INDEX "profiles_userId_key" ON "auth"."profiles"("userId");

-- CreateIndex
CREATE INDEX "profiles_userId_idx" ON "auth"."profiles"("userId");

-- CreateIndex
CREATE INDEX "sessions_userId_idx" ON "auth"."sessions"("userId");

-- CreateIndex
CREATE INDEX "sessions_expiresAt_idx" ON "auth"."sessions"("expiresAt");

-- CreateIndex
CREATE INDEX "audit_logs_userId_idx" ON "auth"."audit_logs"("userId");

-- CreateIndex
CREATE INDEX "audit_logs_action_idx" ON "auth"."audit_logs"("action");

-- CreateIndex
CREATE INDEX "audit_logs_createdAt_idx" ON "auth"."audit_logs"("createdAt");

-- CreateIndex
CREATE INDEX "kyc_applications_userId_idx" ON "auth"."kyc_applications"("userId");

-- CreateIndex
CREATE INDEX "kyc_applications_status_idx" ON "auth"."kyc_applications"("status");

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
CREATE UNIQUE INDEX "employment_info_userId_key" ON "auth"."employment_info"("userId");

-- CreateIndex
CREATE INDEX "employment_info_userId_idx" ON "auth"."employment_info"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "borrower_features_userId_key" ON "auth"."borrower_features"("userId");

-- CreateIndex
CREATE INDEX "borrower_features_userId_idx" ON "auth"."borrower_features"("userId");

-- CreateIndex
CREATE INDEX "loan_applications_userId_idx" ON "auth"."loan_applications"("userId");

-- CreateIndex
CREATE INDEX "loan_applications_status_idx" ON "auth"."loan_applications"("status");

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
ALTER TABLE "auth"."employment_info" ADD CONSTRAINT "employment_info_userId_fkey" FOREIGN KEY ("userId") REFERENCES "auth"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "auth"."borrower_features" ADD CONSTRAINT "borrower_features_userId_fkey" FOREIGN KEY ("userId") REFERENCES "auth"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "auth"."loan_applications" ADD CONSTRAINT "loan_applications_userId_fkey" FOREIGN KEY ("userId") REFERENCES "auth"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "auth"."loan_applications" ADD CONSTRAINT "loan_applications_reviewedBy_fkey" FOREIGN KEY ("reviewedBy") REFERENCES "auth"."users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
