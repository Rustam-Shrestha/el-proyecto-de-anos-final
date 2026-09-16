import { prisma } from '@/config/database';
import { logger } from '@/config/logger';
import bcryptjs from 'bcryptjs';
import { AppError } from '@/utils/AppError';

type TenantMetricsRow = { metricDate: Date; totalUsers: number | null; totalLoans: number | null };

export class SupercontrollerService {
  async authenticate(email: string, password: string) {
    const sc = await (prisma as unknown as { supercontroller: { findUnique: (a: unknown) => Promise<unknown> } }).supercontroller.findUnique({ where: { email } }) as unknown as { id: number; email: string; passwordHash: string; status: string } | null;
    if (!sc || !(await bcryptjs.compare(password, sc.passwordHash))) throw new AppError('Invalid credentials', 401);
    if (sc.status !== 'active') throw new AppError('Account locked', 403);
    await (prisma as unknown as { supercontroller: { update: (a: unknown) => Promise<unknown> } }).supercontroller.update({ where: { id: sc.id }, data: { lastLogin: new Date() } }).catch(() => {});
    return sc;
  }

  async getAllTenants(page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    const [tenants, total] = await Promise.all([
      prisma.tenant.findMany({ skip, take: limit, orderBy: { createdAt: 'desc' } }),
      prisma.tenant.count(),
    ]);
    // attach latest metric per tenant via public.tenant_metrics
    const tenantIds = tenants.map((t) => t.id);
    let metricsByTenant = new Map<number, TenantMetricsRow>();
    try {
      const rows = (await prisma.$queryRawUnsafe(
        `SELECT DISTINCT ON ("tenantId") "tenantId", "metricDate", "totalUsers", "totalLoans" FROM "public"."tenant_metrics" WHERE "tenantId" = ANY($1) ORDER BY "tenantId", "metricDate" DESC`,
        tenantIds,
      )) as Array<{ tenantId: number; metricDate: Date; totalUsers: number; totalLoans: number }>;
      for (const r of rows) metricsByTenant.set(r.tenantId, r);
    } catch {}
    const data = tenants.map((t) => ({ ...t, latestMetric: metricsByTenant.get(t.id) ?? null }));
    return { data, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } };
  }

  async createTenant(
    data: { slug: string; name: string; companyType?: string; subscriptionTier?: string; domain?: string; maxUsers?: number; maxLoans?: number },
    supercontrollerId: number,
  ) {
    const slug = data.slug.toLowerCase().trim();
    const existing = await prisma.tenant.findUnique({ where: { slug } });
    if (existing) throw new AppError('Tenant slug already exists', 409);
    const tenant = await prisma.tenant.create({
      data: {
        slug,
        name: data.name,
        companyType: data.companyType ?? 'fintech',
        subscriptionTier: data.subscriptionTier ?? 'basic',
        domain: data.domain,
        maxUsers: data.maxUsers ?? 100,
        maxLoans: data.maxLoans ?? 1000,
        status: 'active',
        createdBy: supercontrollerId,
      },
    });
    await (prisma as unknown as { supercontrollerAuditLog: { create: (a: unknown) => Promise<unknown> } }).supercontrollerAuditLog.create({
      data: { supercontrollerId, action: 'tenant.create', targetType: 'tenant', targetId: tenant.id.toString(), changesJson: JSON.stringify({ slug, name: data.name }) } as never,
    }).catch(() => {});
    logger.info({ tenantId: tenant.id, slug }, 'Tenant created by supercontroller');
    return tenant;
  }

  async updateTenantStatus(tenantId: number, status: 'active' | 'suspended' | 'deleted', supercontrollerId: number) {
    const tenant = await prisma.tenant.update({ where: { id: tenantId }, data: { status } });
    await (prisma as unknown as { supercontrollerAuditLog: { create: (a: unknown) => Promise<unknown> } }).supercontrollerAuditLog.create({
      data: { supercontrollerId, action: `tenant.${status}`, targetType: 'tenant', targetId: tenantId.toString(), changesJson: JSON.stringify({ status }) } as never,
    }).catch(() => {});
    return tenant;
  }

  async toggleFeature(tenantId: number, featureName: string, isEnabled: boolean, supercontrollerId: number) {
    const toggle = await (prisma as unknown as { featureToggle: { upsert: (a: unknown) => Promise<unknown> } }).featureToggle.upsert({
      where: { tenantId_featureName: { tenantId, featureName } },
      update: { isEnabled, enabledAt: new Date(), enabledBy: supercontrollerId },
      create: { tenantId, featureName, isEnabled, enabledBy: supercontrollerId, enabledAt: new Date() },
    } as never);
    // mirror to auth.tenants feature columns
    const fieldMap: Record<string, string> = {
      feature_ml_scoring: 'featureMlScoring',
      feature_audit_logs: 'featureAuditLogs',
      feature_api_access: 'featureApiAccess',
      feature_custom_workflows: 'featureCustomWorkflows',
    };
    const prismaField = fieldMap[featureName];
    if (prismaField) {
      await prisma.tenant.update({ where: { id: tenantId }, data: { [prismaField]: isEnabled } as never }).catch(() => {});
    }
    await (prisma as unknown as { supercontrollerAuditLog: { create: (a: unknown) => Promise<unknown> } }).supercontrollerAuditLog.create({
      data: { supercontrollerId, action: 'feature.toggle', targetType: 'feature', targetId: `${tenantId}:${featureName}`, changesJson: JSON.stringify({ featureName, isEnabled }) } as never,
    }).catch(() => {});
    return toggle;
  }

  async getDashboardMetrics() {
    const [totalTenants, activeTenants] = await Promise.all([
      prisma.tenant.count(),
      prisma.tenant.count({ where: { status: 'active' } }),
    ]);
    // aggregate from public.tenant_metrics for today + sum from auth.users/loans as fallback
    let totalUsers = 0;
    let totalLoans = 0;
    try {
      const today = new Date(); today.setHours(0,0,0,0);
      const rows = (await prisma.$queryRawUnsafe(`SELECT COALESCE(SUM("totalUsers"),0)::int as su, COALESCE(SUM("totalLoans"),0)::int as sl FROM "public"."tenant_metrics" WHERE "metricDate" = $1`, today)) as Array<{ su: number; sl: number }>;
      totalUsers = rows[0]?.su ?? 0;
      totalLoans = rows[0]?.sl ?? 0;
    } catch {}
    if (totalUsers === 0) totalUsers = await prisma.user.count({ where: { isDeleted: false } }).catch(() => 0) as number;
    if (totalLoans === 0) totalLoans = await prisma.loanApplication.count().catch(() => 0) as number;
    // also compute revenue-ish
    return { totalTenants, activeTenants, totalUsers, totalLoans };
  }

  async getAuditLogs(page = 1, limit = 50, filters?: { action?: string; targetType?: string }) {
    const skip = (page - 1) * limit;
    const where: Record<string, unknown> = {};
    if (filters?.action) where.action = filters.action;
    if (filters?.targetType) where.targetType = filters.targetType;
    const [logs, total] = await Promise.all([
      (prisma as unknown as { supercontrollerAuditLog: { findMany: (a: unknown) => Promise<unknown> } }).supercontrollerAuditLog.findMany({ skip, take: limit, where, orderBy: { createdAt: 'desc' } }),
      (prisma as unknown as { supercontrollerAuditLog: { count: (a: unknown) => Promise<number> } }).supercontrollerAuditLog.count({ where }),
    ]);
    return { data: logs as unknown[], pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } };
  }

  async getTenantFeatures(tenantId: number) {
    const toggles = (await (prisma as unknown as { featureToggle: { findMany: (a: unknown) => Promise<unknown> } }).featureToggle.findMany({ where: { tenantId } }).catch(() => []) as Array<{ featureName: string; isEnabled: boolean }>);
    return toggles;
  }
}

export const supercontrollerService = new SupercontrollerService();
