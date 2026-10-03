-- Supercontroller SaaS hierarchy — Hybrid: keep auth.tenants, add public registry mirror
-- Creates public.supercontroller, public.feature_toggles, public.supercontroller_audit_logs, public.tenant_metrics
-- Extends auth.tenants with companyType, subscriptionTier, quotas, feature flags, etc.
-- Extends auth.role_definitions / permission_definitions with UI fields

-- Ensure public schema exists
CREATE SCHEMA IF NOT EXISTS "public";

-- Supercontroller table (public)
CREATE TABLE IF NOT EXISTS "public"."supercontroller" (
  "id" SERIAL PRIMARY KEY,
  "email" VARCHAR(255) UNIQUE NOT NULL,
  "passwordHash" VARCHAR(255) NOT NULL,
  "fullName" VARCHAR(255),
  "createdAt" TIMESTAMP DEFAULT NOW(),
  "lastLogin" TIMESTAMP,
  "status" VARCHAR(20) DEFAULT 'active'
);

-- Extend auth.tenants with Supercontroller fields (idempotent)
ALTER TABLE "auth"."tenants" ADD COLUMN IF NOT EXISTS "companyType" VARCHAR(50);
ALTER TABLE "auth"."tenants" ADD COLUMN IF NOT EXISTS "createdBy" INT;
ALTER TABLE "auth"."tenants" ADD COLUMN IF NOT EXISTS "subscriptionTier" VARCHAR(50);
ALTER TABLE "auth"."tenants" ADD COLUMN IF NOT EXISTS "maxUsers" INT DEFAULT 100;
ALTER TABLE "auth"."tenants" ADD COLUMN IF NOT EXISTS "maxLoans" INT DEFAULT 1000;
ALTER TABLE "auth"."tenants" ADD COLUMN IF NOT EXISTS "usageLoans" INT DEFAULT 0;
ALTER TABLE "auth"."tenants" ADD COLUMN IF NOT EXISTS "usageUsers" INT DEFAULT 0;
ALTER TABLE "auth"."tenants" ADD COLUMN IF NOT EXISTS "lastActivity" TIMESTAMP;
ALTER TABLE "auth"."tenants" ADD COLUMN IF NOT EXISTS "featureMlScoring" BOOLEAN DEFAULT TRUE;
ALTER TABLE "auth"."tenants" ADD COLUMN IF NOT EXISTS "featureAuditLogs" BOOLEAN DEFAULT TRUE;
ALTER TABLE "auth"."tenants" ADD COLUMN IF NOT EXISTS "featureApiAccess" BOOLEAN DEFAULT TRUE;
ALTER TABLE "auth"."tenants" ADD COLUMN IF NOT EXISTS "featureCustomWorkflows" BOOLEAN DEFAULT FALSE;
ALTER TABLE "auth"."tenants" ADD COLUMN IF NOT EXISTS "dataResidency" VARCHAR(50);
ALTER TABLE "auth"."tenants" ADD COLUMN IF NOT EXISTS "encryptionEnabled" BOOLEAN DEFAULT TRUE;
ALTER TABLE "auth"."tenants" ADD COLUMN IF NOT EXISTS "domain" VARCHAR(255);

-- Backfill nulls to defaults where needed
UPDATE "auth"."tenants" SET "maxUsers"=100 WHERE "maxUsers" IS NULL;
UPDATE "auth"."tenants" SET "maxLoans"=1000 WHERE "maxLoans" IS NULL;
UPDATE "auth"."tenants" SET "usageLoans"=0 WHERE "usageLoans" IS NULL;
UPDATE "auth"."tenants" SET "usageUsers"=0 WHERE "usageUsers" IS NULL;

-- Role definitions UI fields
ALTER TABLE "auth"."role_definitions" ADD COLUMN IF NOT EXISTS "colorCode" VARCHAR(7);
ALTER TABLE "auth"."role_definitions" ADD COLUMN IF NOT EXISTS "icon" VARCHAR(50);

-- Permission definitions category/hierarchy
ALTER TABLE "auth"."permission_definitions" ADD COLUMN IF NOT EXISTS "category" VARCHAR(50);
ALTER TABLE "auth"."permission_definitions" ADD COLUMN IF NOT EXISTS "hierarchyLevel" INT;

-- Feature toggles (public)
CREATE TABLE IF NOT EXISTS "public"."feature_toggles" (
  "id" SERIAL PRIMARY KEY,
  "tenantId" INT NOT NULL,
  "featureName" VARCHAR(100) NOT NULL,
  "isEnabled" BOOLEAN DEFAULT FALSE,
  "enabledBy" INT,
  "enabledAt" TIMESTAMP,
  "metadataJson" TEXT,
  UNIQUE("tenantId","featureName"),
  FOREIGN KEY ("tenantId") REFERENCES "auth"."tenants"("id") ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS "feature_toggles_tenant_idx" ON "public"."feature_toggles"("tenantId");

-- Supercontroller audit logs (public)
CREATE TABLE IF NOT EXISTS "public"."supercontroller_audit_logs" (
  "id" SERIAL PRIMARY KEY,
  "supercontrollerId" INT,
  "action" VARCHAR(100) NOT NULL,
  "targetType" VARCHAR(50),
  "targetId" VARCHAR(255),
  "changesJson" TEXT,
  "ipAddress" VARCHAR(45),
  "createdAt" TIMESTAMP DEFAULT NOW(),
  FOREIGN KEY ("supercontrollerId") REFERENCES "public"."supercontroller"("id") ON DELETE SET NULL
);
CREATE INDEX IF NOT EXISTS "scal_created_idx" ON "public"."supercontroller_audit_logs"("createdAt" DESC);

-- Tenant metrics (public)
CREATE TABLE IF NOT EXISTS "public"."tenant_metrics" (
  "id" SERIAL PRIMARY KEY,
  "tenantId" INT NOT NULL REFERENCES "auth"."tenants"("id") ON DELETE CASCADE,
  "metricDate" DATE NOT NULL,
  "totalUsers" INT,
  "totalLoans" INT,
  "totalRevenue" DECIMAL(12,2),
  "apiCalls" INT,
  "errorRate" DECIMAL(5,2),
  "avgResponseTimeMs" INT,
  "createdAt" TIMESTAMP DEFAULT NOW(),
  UNIQUE("tenantId","metricDate")
);
CREATE INDEX IF NOT EXISTS "tenant_metrics_date_idx" ON "public"."tenant_metrics"("metricDate" DESC);
CREATE INDEX IF NOT EXISTS "tenant_metrics_tenant_idx" ON "public"."tenant_metrics"("tenantId");
