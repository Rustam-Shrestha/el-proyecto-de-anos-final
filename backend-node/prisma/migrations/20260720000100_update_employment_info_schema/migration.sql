-- Migration: Update employment_info schema to match the new EmploymentInfo model
-- This migration renames old fields and adds the new fields required by the
-- Home Credit-aligned employment model.

-- Rename jobTitle → occupationJobTitle and make nullable
ALTER TABLE "auth"."employment_info" RENAME COLUMN "jobTitle" TO "occupationJobTitle";
ALTER TABLE "auth"."employment_info" ALTER COLUMN "occupationJobTitle" DROP NOT NULL;

-- Rename declaredAnnualIncome → annualIncome
ALTER TABLE "auth"."employment_info" RENAME COLUMN "declaredAnnualIncome" TO "annualIncome";

-- Make employmentStartDate nullable
ALTER TABLE "auth"."employment_info" ALTER COLUMN "employmentStartDate" DROP NOT NULL;

-- Add new columns required by the new model
ALTER TABLE "auth"."employment_info" ADD COLUMN "employmentStatus" TEXT NOT NULL DEFAULT 'UNEMPLOYED';
ALTER TABLE "auth"."employment_info" ADD COLUMN "employerName" TEXT;
ALTER TABLE "auth"."employment_info" ADD COLUMN "monthlyGrossIncome" DECIMAL(12,2) NOT NULL DEFAULT 0;
ALTER TABLE "auth"."employment_info" ADD COLUMN "dependentsCount" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "auth"."employment_info" ADD COLUMN "incomeSourceType" TEXT NOT NULL DEFAULT 'SALARY';
ALTER TABLE "auth"."employment_info" ADD COLUMN "businessName" TEXT;
ALTER TABLE "auth"."employment_info" ADD COLUMN "businessType" TEXT;
ALTER TABLE "auth"."employment_info" ADD COLUMN "institutionName" TEXT;
ALTER TABLE "auth"."employment_info" ADD COLUMN "educationLevel" TEXT;
ALTER TABLE "auth"."employment_info" ADD COLUMN "expectedGraduationDate" TIMESTAMP(3);
ALTER TABLE "auth"."employment_info" ADD COLUMN "employmentTenureDays" INTEGER;
ALTER TABLE "auth"."employment_info" ADD COLUMN "employmentStable" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "auth"."employment_info" ADD COLUMN "incomeStabilityScore" INTEGER NOT NULL DEFAULT 50;

-- Update existing rows: set employmentStatus based on whether they had job data
UPDATE "auth"."employment_info" SET "employmentStatus" = 'EMPLOYED' WHERE "occupationJobTitle" IS NOT NULL AND "occupationJobTitle" != '';
