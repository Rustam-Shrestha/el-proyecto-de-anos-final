-- CreateTable tenants
CREATE TABLE IF NOT EXISTS "auth"."tenants" (
    "id" SERIAL PRIMARY KEY,
    "slug" VARCHAR(50) NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "domain" TEXT,
    "status" VARCHAR(20) NOT NULL DEFAULT 'active',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE UNIQUE INDEX IF NOT EXISTS "tenants_slug_key" ON "auth"."tenants"("slug");
INSERT INTO "auth"."tenants" ("slug","name","status") VALUES ('default','Default Tenant','active') ON CONFLICT ("slug") DO NOTHING;

-- CreateTable tenant_admins
CREATE TABLE IF NOT EXISTS "auth"."tenant_admins" (
    "id" SERIAL PRIMARY KEY,
    "tenantId" INTEGER NOT NULL,
    "userId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "tenant_admins_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "auth"."tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable role_definitions
CREATE TABLE IF NOT EXISTS "auth"."role_definitions" (
    "id" SERIAL PRIMARY KEY,
    "name" VARCHAR(100) NOT NULL,
    "description" TEXT,
    "hierarchyLevel" INTEGER NOT NULL,
    "isSystem" BOOLEAN NOT NULL DEFAULT true
);

-- CreateTable permission_definitions
CREATE TABLE IF NOT EXISTS "auth"."permission_definitions" (
    "id" SERIAL PRIMARY KEY,
    "name" VARCHAR(100) NOT NULL,
    "description" TEXT,
    "resource" VARCHAR(100),
    "action" VARCHAR(50),
    "isSystem" BOOLEAN NOT NULL DEFAULT true
);
CREATE UNIQUE INDEX IF NOT EXISTS "permission_definitions_name_key" ON "auth"."permission_definitions"("name");

-- CreateTable role_permissions
CREATE TABLE IF NOT EXISTS "auth"."role_permissions" (
    "id" SERIAL PRIMARY KEY,
    "roleId" INTEGER NOT NULL,
    "permissionId" INTEGER NOT NULL,
    CONSTRAINT "role_permissions_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "auth"."role_definitions"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "role_permissions_permissionId_fkey" FOREIGN KEY ("permissionId") REFERENCES "auth"."permission_definitions"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE UNIQUE INDEX IF NOT EXISTS "role_permissions_roleId_permissionId_key" ON "auth"."role_permissions"("roleId","permissionId");

-- Seed role_definitions + permissions (idempotent)
INSERT INTO "auth"."role_definitions" ("name","description","hierarchyLevel") VALUES ('Admin','System admin',0),('LoanApprover','Loan approver',1),('Validator','KYC/Documents validator',2),('Customer','End customer',3) ON CONFLICT DO NOTHING;
INSERT INTO "auth"."permission_definitions" ("name","resource","action") VALUES ('loans.read','loans','read'),('loans.write','loans','write'),('loans.approve','loans','approve'),('loans.reject','loans','reject'),('users.read','users','read'),('users.write','users','write'),('admin.access','admin','access') ON CONFLICT ("name") DO NOTHING;

-- Add tenantId columns (safe if not exists)
ALTER TABLE "auth"."users" ADD COLUMN IF NOT EXISTS "tenantId" INTEGER NOT NULL DEFAULT 1;
CREATE INDEX IF NOT EXISTS "users_tenantId_idx" ON "auth"."users"("tenantId");

ALTER TABLE "auth"."audit_logs" ADD COLUMN IF NOT EXISTS "tenantId" INTEGER NOT NULL DEFAULT 1;
CREATE INDEX IF NOT EXISTS "audit_logs_tenantId_idx" ON "auth"."audit_logs"("tenantId");

ALTER TABLE "auth"."kyc_applications" ADD COLUMN IF NOT EXISTS "tenantId" INTEGER NOT NULL DEFAULT 1;
CREATE INDEX IF NOT EXISTS "kyc_applications_tenantId_idx" ON "auth"."kyc_applications"("tenantId");

ALTER TABLE "auth"."loan_applications" ADD COLUMN IF NOT EXISTS "tenantId" INTEGER NOT NULL DEFAULT 1;
CREATE INDEX IF NOT EXISTS "loan_applications_tenantId_idx" ON "auth"."loan_applications"("tenantId");

ALTER TABLE "auth"."documents" ADD COLUMN IF NOT EXISTS "tenantId" INTEGER NOT NULL DEFAULT 1;
CREATE INDEX IF NOT EXISTS "documents_tenantId_idx" ON "auth"."documents"("tenantId");

ALTER TABLE "auth"."financial_documents" ADD COLUMN IF NOT EXISTS "tenantId" INTEGER NOT NULL DEFAULT 1;
CREATE INDEX IF NOT EXISTS "financial_documents_tenantId_idx" ON "auth"."financial_documents"("tenantId");

ALTER TABLE "auth"."portfolio_verifications" ADD COLUMN IF NOT EXISTS "tenantId" INTEGER NOT NULL DEFAULT 1;
CREATE INDEX IF NOT EXISTS "portfolio_verifications_tenantId_idx" ON "auth"."portfolio_verifications"("tenantId");

ALTER TABLE "auth"."loan_accounts" ADD COLUMN IF NOT EXISTS "tenantId" INTEGER NOT NULL DEFAULT 1;
CREATE INDEX IF NOT EXISTS "loan_accounts_tenantId_idx" ON "auth"."loan_accounts"("tenantId");

ALTER TABLE "auth"."employment_info" ADD COLUMN IF NOT EXISTS "tenantId" INTEGER NOT NULL DEFAULT 1;
CREATE INDEX IF NOT EXISTS "employment_info_tenantId_idx" ON "auth"."employment_info"("tenantId");

ALTER TABLE "auth"."loan_features" ADD COLUMN IF NOT EXISTS "tenantId" INTEGER NOT NULL DEFAULT 1;
CREATE INDEX IF NOT EXISTS "loan_features_tenantId_idx" ON "auth"."loan_features"("tenantId");

ALTER TABLE "auth"."borrower_features" ADD COLUMN IF NOT EXISTS "tenantId" INTEGER NOT NULL DEFAULT 1;
CREATE INDEX IF NOT EXISTS "borrower_features_tenantId_idx" ON "auth"."borrower_features"("tenantId");

ALTER TABLE "auth"."bank_statements" ADD COLUMN IF NOT EXISTS "tenantId" INTEGER NOT NULL DEFAULT 1;
CREATE INDEX IF NOT EXISTS "bank_statements_tenantId_idx" ON "auth"."bank_statements"("tenantId");

ALTER TABLE "auth"."transactions" ADD COLUMN IF NOT EXISTS "tenantId" INTEGER NOT NULL DEFAULT 1;
CREATE INDEX IF NOT EXISTS "transactions_tenantId_idx" ON "auth"."transactions"("tenantId");

ALTER TABLE "auth"."financial_profiles" ADD COLUMN IF NOT EXISTS "tenantId" INTEGER NOT NULL DEFAULT 1;
CREATE INDEX IF NOT EXISTS "financial_profiles_tenantId_idx" ON "auth"."financial_profiles"("tenantId");

ALTER TABLE "auth"."loan_assessments" ADD COLUMN IF NOT EXISTS "tenantId" INTEGER NOT NULL DEFAULT 1;
CREATE INDEX IF NOT EXISTS "loan_assessments_tenantId_idx" ON "auth"."loan_assessments"("tenantId");

ALTER TABLE "auth"."nlu_queries" ADD COLUMN IF NOT EXISTS "tenantId" INTEGER NOT NULL DEFAULT 1;
CREATE INDEX IF NOT EXISTS "nlu_queries_tenantId_idx" ON "auth"."nlu_queries"("tenantId");

ALTER TABLE "auth"."chat_conversations" ADD COLUMN IF NOT EXISTS "tenantId" INTEGER NOT NULL DEFAULT 1;
CREATE INDEX IF NOT EXISTS "chat_conversations_tenantId_idx" ON "auth"."chat_conversations"("tenantId");

ALTER TABLE "auth"."notifications" ADD COLUMN IF NOT EXISTS "tenantId" INTEGER NOT NULL DEFAULT 1;
CREATE INDEX IF NOT EXISTS "notifications_tenantId_idx" ON "auth"."notifications"("tenantId");
