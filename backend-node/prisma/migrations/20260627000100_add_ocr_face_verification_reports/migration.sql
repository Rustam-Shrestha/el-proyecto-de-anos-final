-- AlterTable: Add OCR and confirmed data fields to kyc_applications
ALTER TABLE "auth"."kyc_applications"
  ADD COLUMN "ocrCitizenshipNumber" TEXT,
  ADD COLUMN "ocrFullName" TEXT,
  ADD COLUMN "ocrDateOfBirth" TEXT,
  ADD COLUMN "ocrGender" TEXT,
  ADD COLUMN "ocrAddress" TEXT,
  ADD COLUMN "confirmedCitizenshipNumber" TEXT,
  ADD COLUMN "confirmedFullName" TEXT,
  ADD COLUMN "confirmedDateOfBirth" TEXT,
  ADD COLUMN "confirmedGender" TEXT,
  ADD COLUMN "confirmedAddress" TEXT,
  ADD COLUMN "confirmedPhoneNumber" TEXT,
  ADD COLUMN "confirmedEmail" TEXT,
  ADD COLUMN "confirmedOccupation" TEXT,
  ADD COLUMN "confirmedEmployer" TEXT,
  ADD COLUMN "confirmedMonthlyIncome" DECIMAL(12,2),
  ADD COLUMN "confirmedMaritalStatus" TEXT,
  ADD COLUMN "confirmedEducationLevel" TEXT;

-- CreateTable ocr_results
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

-- CreateTable face_verifications
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

-- CreateTable verification_reports
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

-- CreateIndexes
CREATE INDEX "ocr_results_kycApplicationId_idx" ON "auth"."ocr_results"("kycApplicationId");

CREATE UNIQUE INDEX "face_verifications_kycApplicationId_key" ON "auth"."face_verifications"("kycApplicationId");
CREATE INDEX "face_verifications_kycApplicationId_idx" ON "auth"."face_verifications"("kycApplicationId");

CREATE UNIQUE INDEX "verification_reports_kycApplicationId_key" ON "auth"."verification_reports"("kycApplicationId");
CREATE INDEX "verification_reports_kycApplicationId_idx" ON "auth"."verification_reports"("kycApplicationId");

-- AddForeignKeys
ALTER TABLE "auth"."ocr_results" ADD CONSTRAINT "ocr_results_kycApplicationId_fkey" FOREIGN KEY ("kycApplicationId") REFERENCES "auth"."kyc_applications"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "auth"."face_verifications" ADD CONSTRAINT "face_verifications_kycApplicationId_fkey" FOREIGN KEY ("kycApplicationId") REFERENCES "auth"."kyc_applications"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "auth"."verification_reports" ADD CONSTRAINT "verification_reports_kycApplicationId_fkey" FOREIGN KEY ("kycApplicationId") REFERENCES "auth"."kyc_applications"("id") ON DELETE CASCADE ON UPDATE CASCADE;
