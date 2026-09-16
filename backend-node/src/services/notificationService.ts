import { prisma } from '@/config/database';
import { logger } from '@/config/logger';
import type { NotificationStatus, NotificationType } from '@prisma/client';

export interface CreateNotificationInput {
  userId: string;
  tenantId?: number;
  type: NotificationType;
  title: string;
  message: string;
  description?: string;
  relatedEntityType?: string;
  relatedEntityId?: string;
  actionUrl?: string;
  metadata?: Record<string, unknown>;
  priority?: 'LOW' | 'NORMAL' | 'HIGH' | 'CRITICAL';
}

function resolveTid(tenantId?: number): number {
  if (tenantId === undefined || tenantId === null) {
    logger.warn("notificationService: tenantId not provided, falling back to 1");
    return 1;
  }
  return tenantId;
}
function isTenantSchemaError(e: unknown): boolean {
  const code = (e as { code?: string })?.code;
  const msg = String((e as { message?: string })?.message ?? (e as Error)?.message ?? "");
  return code === "P2021" || code === "P2022" || msg.includes("tenantId") || msg.includes("tenant_id") || msg.includes("does not exist");
}

export const notificationService = {
  /**
   * Create an in-app notification. Fire-and-forget — never throws to the caller.
   */
  async create(input: CreateNotificationInput): Promise<void> {
    try {
      const tid = input.tenantId ?? resolveTid(undefined);
      // try to resolve tenantId from user if not provided: fallback to 1 already handled via resolveTid warning
      // if input tenantId undefined, try lookup user's tenantId
      let finalTid = input.tenantId;
      if (finalTid === undefined) {
        try {
          const u = await prisma.user.findUnique({ where: { id: input.userId }, select: { tenantId: true } }) as unknown as { tenantId?: number } | null;
          finalTid = u?.tenantId ?? 1;
        } catch {
          finalTid = 1;
        }
      }
      try {
        await prisma.notification.create({
          data: {
            tenantId: finalTid as number,
            userId: input.userId,
            type: input.type,
            title: input.title,
            message: input.message,
            description: input.description,
            relatedEntityType: input.relatedEntityType,
            relatedEntityId: input.relatedEntityId,
            actionUrl: input.actionUrl,
            metadata: (input.metadata as object) || {},
            priority: input.priority || 'NORMAL',
          },
        });
      } catch (e) {
        if (isTenantSchemaError(e)) {
          await prisma.notification.create({
            data: {
              userId: input.userId,
              type: input.type,
              title: input.title,
              message: input.message,
              description: input.description,
              relatedEntityType: input.relatedEntityType,
              relatedEntityId: input.relatedEntityId,
              actionUrl: input.actionUrl,
              metadata: (input.metadata as object) || {},
              priority: input.priority || 'NORMAL',
            },
          });
        } else throw e;
      }
    } catch (error) {
      logger.error({ err: error }, 'Failed to create notification');
    }
  },

  async getByUser(
    userId: string,
    status?: NotificationStatus,
    limit: number = 20,
    offset: number = 0,
    tenantId?: number
  ) {
    const tid = tenantId;
    let where: Record<string, unknown> = {
      userId,
      ...(status ? { status } : {}),
      ...(tid !== undefined ? { tenantId: tid } : {}),
    };
    if (tid === undefined) logger.warn("notificationService.getByUser: tenantId not provided, querying without tenant filter");
    try {
      const [notifications, total, unreadCount] = await Promise.all([
        prisma.notification.findMany({ where: where as never, orderBy: { createdAt: 'desc' }, take: limit, skip: offset }),
        prisma.notification.count({ where: where as never }),
        prisma.notification.count({ where: { userId, status: 'UNREAD', ...(tid !== undefined ? { tenantId: tid } : {}) } as never }),
      ]);
      return { notifications, total, unreadCount };
    } catch (e) {
      if (isTenantSchemaError(e)) {
        const fallbackWhere = { userId, ...(status ? { status } : {}) } as never;
        const [notifications, total, unreadCount] = await Promise.all([
          prisma.notification.findMany({ where: fallbackWhere, orderBy: { createdAt: 'desc' }, take: limit, skip: offset }),
          prisma.notification.count({ where: fallbackWhere }),
          prisma.notification.count({ where: { userId, status: 'UNREAD' } as never }),
        ]);
        return { notifications, total, unreadCount };
      }
      throw e;
    }
  },

  async markAsRead(notificationId: string, tenantId?: number) {
    if (tenantId !== undefined) {
      const existing = await prisma.notification.findFirst({ where: { id: notificationId, tenantId } });
      if (!existing) throw new Error('Notification not found');
    }
    return prisma.notification.update({
      where: { id: notificationId },
      data: { status: 'READ', readAt: new Date() },
    });
  },

  async markAllAsRead(userId: string, tenantId?: number) {
    const where = { userId, status: 'UNREAD', ...(tenantId !== undefined ? { tenantId } : {}) } as never;
    try {
      return await prisma.notification.updateMany({ where, data: { status: 'READ', readAt: new Date() } });
    } catch (e) {
      if (isTenantSchemaError(e)) return prisma.notification.updateMany({ where: { userId, status: 'UNREAD' } as never, data: { status: 'READ', readAt: new Date() } });
      throw e;
    }
  },

  async archive(notificationId: string, tenantId?: number) {
    if (tenantId !== undefined) {
      const existing = await prisma.notification.findFirst({ where: { id: notificationId, tenantId } });
      if (!existing) throw new Error('Notification not found');
    }
    return prisma.notification.update({
      where: { id: notificationId },
      data: { status: 'ARCHIVED', archivedAt: new Date() },
    });
  },

  async getUnreadCount(userId: string, tenantId?: number) {
    const where = { userId, status: 'UNREAD', ...(tenantId !== undefined ? { tenantId } : {}) } as never;
    try {
      return await prisma.notification.count({ where });
    } catch (e) {
      if (isTenantSchemaError(e)) return prisma.notification.count({ where: { userId, status: 'UNREAD' } as never });
      throw e;
    }
  },

  async delete(notificationId: string, tenantId?: number) {
    if (tenantId !== undefined) {
      const existing = await prisma.notification.findFirst({ where: { id: notificationId, tenantId } });
      if (!existing) throw new Error('Notification not found');
    }
    return prisma.notification.delete({ where: { id: notificationId } });
  },
};
