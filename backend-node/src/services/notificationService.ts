import { prisma } from '@/config/database';
import { logger } from '@/config/logger';
import type { NotificationStatus, NotificationType } from '@prisma/client';

export interface CreateNotificationInput {
  userId: string;
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

export const notificationService = {
  /**
   * Create an in-app notification. Fire-and-forget — never throws to the caller.
   */
  async create(input: CreateNotificationInput): Promise<void> {
    try {
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
    } catch (error) {
      logger.error({ err: error }, 'Failed to create notification');
    }
  },

  async getByUser(
    userId: string,
    status?: NotificationStatus,
    limit: number = 20,
    offset: number = 0
  ) {
    const where = {
      userId,
      ...(status ? { status } : {}),
    };
    const [notifications, total, unreadCount] = await Promise.all([
      prisma.notification.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
      }),
      prisma.notification.count({ where }),
      prisma.notification.count({ where: { userId, status: 'UNREAD' } }),
    ]);

    return { notifications, total, unreadCount };
  },

  async markAsRead(notificationId: string) {
    return prisma.notification.update({
      where: { id: notificationId },
      data: { status: 'READ', readAt: new Date() },
    });
  },

  async markAllAsRead(userId: string) {
    return prisma.notification.updateMany({
      where: { userId, status: 'UNREAD' },
      data: { status: 'READ', readAt: new Date() },
    });
  },

  async archive(notificationId: string) {
    return prisma.notification.update({
      where: { id: notificationId },
      data: { status: 'ARCHIVED', archivedAt: new Date() },
    });
  },

  async getUnreadCount(userId: string) {
    return prisma.notification.count({
      where: { userId, status: 'UNREAD' },
    });
  },

  async delete(notificationId: string) {
    return prisma.notification.delete({ where: { id: notificationId } });
  },
};