import { prisma } from '@/config/database';
import { logger } from '@/config/logger';

export interface AuditLogInput {
  userId: string | null;
  action: string;
  metadata?: Record<string, unknown>;
  ip?: string;
  userAgent?: string;
}

export const auditService = {
  async log(input: AuditLogInput): Promise<void> {
    try {
      await prisma.auditLog.create({
        data: {
          userId: input.userId,
          action: input.action,
          metadata: input.metadata,
          ip: input.ip || 'unknown',
          userAgent: input.userAgent || 'unknown',
        },
      });
    } catch (error) {
      logger.error({ err: error }, 'Failed to log audit event');
    }
  },

  async getByUser(userId: string, limit: number = 50, offset: number = 0) {
    const [logs, total] = await Promise.all([
      prisma.auditLog.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
      }),
      prisma.auditLog.count({ where: { userId } }),
    ]);

    return { logs, total };
  },

  async getAll(limit: number = 50, offset: number = 0) {
    const [logs, total] = await Promise.all([
      prisma.auditLog.findMany({
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
        include: { user: { select: { id: true, email: true } } },
      }),
      prisma.auditLog.count(),
    ]);

    return { logs, total };
  },
};
