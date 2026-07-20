-- Create financial_documents table for portfolio document verification
CREATE TABLE "auth"."financial_documents" (
    "id" TEXT NOT NULL,
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

-- Create portfolio_verifications table for admin review and risk scoring
CREATE TABLE "auth"."portfolio_verifications" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "verificationStatus" TEXT NOT NULL DEFAULT 'INCOMPLETE',
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

-- Create loan_accounts table for active/closed loan tracking
CREATE TABLE "auth"."loan_accounts" (
    "id" TEXT NOT NULL,
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

-- Create loan_features table for Home Credit-aligned feature computation
CREATE TABLE "auth"."loan_features" (
    "id" TEXT NOT NULL,
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

-- Indexes for financial_documents
CREATE INDEX "financial_documents_userId_idx" ON "auth"."financial_documents"("userId");
CREATE INDEX "financial_documents_verificationStatus_idx" ON "auth"."financial_documents"("verificationStatus");
CREATE INDEX "financial_documents_documentType_idx" ON "auth"."financial_documents"("documentType");

-- Indexes for portfolio_verifications
CREATE UNIQUE INDEX "portfolio_verifications_userId_key" ON "auth"."portfolio_verifications"("userId");
CREATE INDEX "portfolio_verifications_userId_idx" ON "auth"."portfolio_verifications"("userId");
CREATE INDEX "portfolio_verifications_verificationStatus_idx" ON "auth"."portfolio_verifications"("verificationStatus");

-- Indexes for loan_accounts
CREATE INDEX "loan_accounts_userId_idx" ON "auth"."loan_accounts"("userId");
CREATE INDEX "loan_accounts_status_idx" ON "auth"."loan_accounts"("status");
CREATE INDEX "loan_accounts_isActive_idx" ON "auth"."loan_accounts"("isActive");

-- Indexes for loan_features
CREATE UNIQUE INDEX "loan_features_userId_key" ON "auth"."loan_features"("userId");
CREATE INDEX "loan_features_userId_idx" ON "auth"."loan_features"("userId");

-- Foreign keys for financial_documents
ALTER TABLE "auth"."financial_documents" ADD CONSTRAINT "financial_documents_userId_fkey" FOREIGN KEY ("userId") REFERENCES "auth"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Foreign keys for portfolio_verifications
ALTER TABLE "auth"."portfolio_verifications" ADD CONSTRAINT "portfolio_verifications_userId_fkey" FOREIGN KEY ("userId") REFERENCES "auth"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Foreign keys for loan_accounts
ALTER TABLE "auth"."loan_accounts" ADD CONSTRAINT "loan_accounts_userId_fkey" FOREIGN KEY ("userId") REFERENCES "auth"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Foreign keys for loan_features
ALTER TABLE "auth"."loan_features" ADD CONSTRAINT "loan_features_userId_fkey" FOREIGN KEY ("userId") REFERENCES "auth"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "auth"."loan_features" ADD CONSTRAINT "loan_features_loanApplicationId_fkey" FOREIGN KEY ("loanApplicationId") REFERENCES "auth"."loan_applications"("id") ON DELETE SET NULL ON UPDATE CASCADE;
