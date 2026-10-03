-- AlterTable
ALTER TABLE "auth"."company_invites" ADD COLUMN     "code" VARCHAR(6);

-- AlterTable
ALTER TABLE "auth"."company_requests" ALTER COLUMN "panNumber" SET DATA TYPE VARCHAR(30);

-- AlterTable
ALTER TABLE "auth"."tenants" ADD COLUMN     "joinMode" VARCHAR(10) NOT NULL DEFAULT 'code',
ALTER COLUMN "panNumber" SET DATA TYPE VARCHAR(30);
