import type { Request, Response, NextFunction } from 'express';
import { apiResponse } from '@/utils/apiResponse';
import { notificationService } from '@/services/notificationService';
import type { NotificationStatus } from '@prisma/client';

const userIdOf = (req: Request, res: Response): string | null => {
  if (!req.user) {
    res.status(401).json(apiResponse.error('Authentication required', 401));
    return null;
  }
  return req.user.id;
};

export const getNotifications = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = userIdOf(req, res);
    if (!userId) return;

    const { status, limit = '20', offset = '0' } = req.query as Record<string, string>;
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));
    const offsetNum = Math.max(0, parseInt(offset, 10) || 0);

    const result = await notificationService.getByUser(
      userId,
      (status as NotificationStatus) || undefined,
      limitNum,
      offsetNum
    );

    res.json(
      apiResponse.success('Notifications fetched', {
        notifications: result.notifications,
        unreadCount: result.unreadCount,
        total: result.total,
      })
    );
  } catch (error) {
    next(error);
  }
};

export const markAsRead = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { notificationId } = req.params;
    await notificationService.markAsRead(notificationId);
    res.json(apiResponse.success('Notification marked as read'));
  } catch (error) {
    next(error);
  }
};

export const markAllAsRead = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = userIdOf(req, res);
    if (!userId) return;

    await notificationService.markAllAsRead(userId);
    res.json(apiResponse.success('All notifications marked as read'));
  } catch (error) {
    next(error);
  }
};

export const archiveNotification = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { notificationId } = req.params;
    await notificationService.archive(notificationId);
    res.json(apiResponse.success('Notification archived'));
  } catch (error) {
    next(error);
  }
};

export const deleteNotification = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { notificationId } = req.params;
    await notificationService.delete(notificationId);
    res.json(apiResponse.success('Notification deleted'));
  } catch (error) {
    next(error);
  }
};
