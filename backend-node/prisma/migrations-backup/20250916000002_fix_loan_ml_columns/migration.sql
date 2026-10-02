-- Fix missing ML audit columns on loan_applications (schema.prisma has them but init migration did not)
ALTER TABLE "auth"."loan_applications" ADD COLUMN IF NOT EXISTS "defaultProbability" DOUBLE PRECISION;
ALTER TABLE "auth"."loan_applications" ADD COLUMN IF NOT EXISTS "modelVersion" TEXT;
ALTER TABLE "auth"."loan_applications" ADD COLUMN IF NOT EXISTS "shapValues" JSONB;
ALTER TABLE "auth"."loan_applications" ADD COLUMN IF NOT EXISTS "featureSnapshot" JSONB;
ALTER TABLE "auth"."loan_applications" ADD COLUMN IF NOT EXISTS "mlDecision" TEXT;
ALTER TABLE "auth"."loan_applications" ADD COLUMN IF NOT EXISTS "creditScore" INTEGER;

-- Also ensure tenantId index exists (already added by previous migration but ensure)
CREATE INDEX IF NOT EXISTS "loan_applications_tenantId_idx" ON "auth"."loan_applications"("tenantId");
