import { prisma } from '@/config/database';
import { logger } from '@/config/logger';

export interface AuditLogInput {
  userId: string | null;
  tenantId?: number;
  action: string;
  metadata?: Record<string, unknown>;
  ip?: string;
  userAgent?: string;
}

function resolveTid(tenantId?: number): number {
  if (tenantId === undefined || tenantId === null) {
    logger.warn("auditService: tenantId not provided, falling back to 1");
    return 1;
  }
  return tenantId;
}
function isTenantSchemaError(e: unknown): boolean {
  const code = (e as { code?: string })?.code;
  const msg = String((e as { message?: string })?.message ?? (e as Error)?.message ?? "");
  return code === "P2021" || code === "P2022" || msg.includes("tenantId") || msg.includes("tenant_id") || msg.includes("does not exist");
}

export const auditService = {
  async log(input: AuditLogInput): Promise<void> {
    try {
      let tid = input.tenantId;
      if (tid === undefined && input.userId) {
        try {
          const u = await prisma.user.findUnique({ where: { id: input.userId }, select: { tenantId: true } }) as unknown as { tenantId?: number } | null;
          tid = u?.tenantId ?? 1;
        } catch {
          tid = 1;
        }
      }
      if (tid === undefined) tid = resolveTid(undefined);
      try {
        await prisma.auditLog.create({
          data: {
            tenantId: tid as number,
            userId: input.userId,
            action: input.action,
            metadata: input.metadata,
            ip: input.ip || 'unknown',
            userAgent: input.userAgent || 'unknown',
          },
        });
      } catch (e) {
        if (isTenantSchemaError(e)) {
          await prisma.auditLog.create({
            data: {
              userId: input.userId,
              action: input.action,
              metadata: input.metadata,
              ip: input.ip || 'unknown',
              userAgent: input.userAgent || 'unknown',
            },
          });
        } else throw e;
      }
    } catch (error) {
      logger.error({ err: error }, 'Failed to log audit event');
    }
  },

  async getByUser(userId: string, limit: number = 50, offset: number = 0, tenantId?: number) {
    const where: Record<string, unknown> = { userId, ...(tenantId !== undefined ? { tenantId } : {}) };
    if (tenantId === undefined) logger.warn("auditService.getByUser: tenantId not provided, querying without tenant filter");
    try {
      const [logs, total] = await Promise.all([
        prisma.auditLog.findMany({ where: where as never, orderBy: { createdAt: 'desc' }, take: limit, skip: offset }),
        prisma.auditLog.count({ where: where as never }),
      ]);
      return { logs, total };
    } catch (e) {
      if (isTenantSchemaError(e)) {
        const [logs, total] = await Promise.all([
          prisma.auditLog.findMany({ where: { userId } as never, orderBy: { createdAt: 'desc' }, take: limit, skip: offset }),
          prisma.auditLog.count({ where: { userId } as never }),
        ]);
        return { logs, total };
      }
      throw e;
    }
  },

  async getAll(limit: number = 50, offset: number = 0, tenantId?: number) {
    const where = tenantId !== undefined ? { tenantId } : {};
    if (tenantId === undefined) logger.warn("auditService.getAll: tenantId not provided, querying across tenants");
    try {
      const [logs, total] = await Promise.all([
        prisma.auditLog.findMany({ where: where as never, orderBy: { createdAt: 'desc' }, take: limit, skip: offset, include: { user: { select: { id: true, email: true } } } }),
        prisma.auditLog.count({ where: where as never }),
      ]);
      return { logs, total };
    } catch (e) {
      if (isTenantSchemaError(e)) {
        const [logs, total] = await Promise.all([
          prisma.auditLog.findMany({ orderBy: { createdAt: 'desc' }, take: limit, skip: offset, include: { user: { select: { id: true, email: true } } } }),
          prisma.auditLog.count(),
        ]);
        return { logs, total };
      }
      throw e;
    }
  },

  async getAllFiltered(where: Record<string, unknown>, limit: number = 50, offset: number = 0, tenantId?: number) {
    const finalWhere = { ...where, ...(tenantId !== undefined ? { tenantId } : {}) };
    try {
      const [logs, total] = await Promise.all([
        prisma.auditLog.findMany({ where: finalWhere as never, orderBy: { createdAt: 'desc' }, take: limit, skip: offset, include: { user: { select: { id: true, email: true } } } }),
        prisma.auditLog.count({ where: finalWhere as never }),
      ]);
      return { logs, total };
    } catch (e) {
      if (isTenantSchemaError(e)) {
        const [logs, total] = await Promise.all([
          prisma.auditLog.findMany({ where: where as never, orderBy: { createdAt: 'desc' }, take: limit, skip: offset, include: { user: { select: { id: true, email: true } } } }),
          prisma.auditLog.count({ where: where as never }),
        ]);
        return { logs, total };
      }
      throw e;
    }
  }
};
