-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateTable
CREATE TABLE IF NOT EXISTS "public"."supercontroller" (
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
CREATE TABLE IF NOT EXISTS "public"."feature_toggles" (
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
CREATE TABLE IF NOT EXISTS "public"."supercontroller_audit_logs" (
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
CREATE TABLE IF NOT EXISTS "public"."tenant_metrics" (
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

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "supercontroller_email_key" ON "public"."supercontroller"("email");

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "feature_toggles_tenantId_featureName_key" ON "public"."feature_toggles"("tenantId", "featureName");

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "tenant_metrics_tenantId_metricDate_key" ON "public"."tenant_metrics"("tenantId", "metricDate");
