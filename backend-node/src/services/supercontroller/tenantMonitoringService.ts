import { prisma } from '@/config/database';

export class TenantMonitoringService {
  async getTenantOverview(tenantId: number) {
    const tenant = await prisma.tenant.findUnique({ where: { id: tenantId } });
    if (!tenant) throw new Error('Tenant not found');
    const featureToggles = await (prisma as unknown as { featureToggle: { findMany: (a: unknown) => Promise<unknown> } }).featureToggle.findMany({ where: { tenantId } }).catch(() => []) as Array<{ featureName: string; isEnabled: boolean }>;
    const metrics = await (prisma as unknown as { tenantMetrics: { findMany: (a: unknown) => Promise<unknown> } }).tenantMetrics.findMany({ where: { tenantId }, orderBy: { metricDate: 'desc' }, take: 30 }).catch(() => []) as unknown[];
    // usage percentages
    const usagePercentage = {
      users: tenant.maxUsers ? (tenant.usageUsers / tenant.maxUsers) * 100 : 0,
      loans: tenant.maxLoans ? (tenant.usageLoans / tenant.maxLoans) * 100 : 0,
    };
    // live counts
    const liveUsers = await prisma.user.count({ where: { tenantId, isDeleted: false } }).catch(() => tenant.usageUsers);
    const liveLoans = await prisma.loanApplication.count({ where: { tenantId } }).catch(() => tenant.usageLoans);
    return {
      tenant,
      features: Object.fromEntries(featureToggles.map((f) => [f.featureName, f.isEnabled])),
      toggles: featureToggles,
      metrics,
      usagePercentage,
      live: { users: liveUsers, loans: liveLoans },
    };
  }

  async recordDailyMetrics(tenantId: number, metrics: { totalUsers: number; totalLoans: number; totalRevenue: number; apiCalls: number; errorRate: number; avgResponseTime: number }) {
    const today = new Date(); today.setHours(0,0,0,0);
    const record = await (prisma as unknown as { tenantMetrics: { upsert: (a: unknown) => Promise<unknown> } }).tenantMetrics.upsert({
      where: { tenantId_metricDate: { tenantId, metricDate: today } },
      update: { totalUsers: metrics.totalUsers, totalLoans: metrics.totalLoans, totalRevenue: metrics.totalRevenue, apiCalls: metrics.apiCalls, errorRate: metrics.errorRate, avgResponseTimeMs: metrics.avgResponseTime },
      create: { tenantId, metricDate: today, totalUsers: metrics.totalUsers, totalLoans: metrics.totalLoans, totalRevenue: metrics.totalRevenue, apiCalls: metrics.apiCalls, errorRate: metrics.errorRate, avgResponseTimeMs: metrics.avgResponseTime },
    } as never);
    return record;
  }

  async checkUsageAlerts(tenantId: number) {
    const tenant = await prisma.tenant.findUnique({ where: { id: tenantId } });
    if (!tenant) return null;
    const alerts: Array<{ type: string; message: string; severity: string }> = [];
    if (tenant.usageUsers >= tenant.maxUsers * 0.9) alerts.push({ type: 'users', message: `User limit ${tenant.usageUsers}/${tenant.maxUsers}`, severity: 'warning' });
    if (tenant.usageLoans >= tenant.maxLoans * 0.9) alerts.push({ type: 'loans', message: `Loan limit ${tenant.usageLoans}/${tenant.maxLoans}`, severity: 'warning' });
    if (tenant.usageUsers >= tenant.maxUsers) alerts.push({ type: 'users', message: `User limit exceeded`, severity: 'critical' });
    if (tenant.usageLoans >= tenant.maxLoans) alerts.push({ type: 'loans', message: `Loan limit exceeded`, severity: 'critical' });
    return alerts.length > 0 ? alerts : null;
  }

  async getTimeSeries(tenantId: number | null, days = 30) {
    const since = new Date(); since.setDate(since.getDate() - days); since.setHours(0,0,0,0);
    let rows: Array<{ metricDate: Date; totalUsers: number; totalLoans: number; totalRevenue: number }>;
    try {
      if (tenantId) {
        rows = await prisma.$queryRawUnsafe(`SELECT "metricDate", "totalUsers", "totalLoans", "totalRevenue" FROM "public"."tenant_metrics" WHERE "tenantId"=$1 AND "metricDate" >= $2 ORDER BY "metricDate" ASC`, tenantId, since) as never;
      } else {
        rows = await prisma.$queryRawUnsafe(`SELECT "metricDate", SUM("totalUsers")::int as "totalUsers", SUM("totalLoans")::int as "totalLoans", SUM("totalRevenue")::float as "totalRevenue" FROM "public"."tenant_metrics" WHERE "metricDate" >= $1 GROUP BY "metricDate" ORDER BY "metricDate" ASC`, since) as never;
      }
    } catch { rows = []; }
    return rows;
  }
}

export const tenantMonitoringService = new TenantMonitoringService();
