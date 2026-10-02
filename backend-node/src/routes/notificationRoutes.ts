import { Router } from 'express';
import { authenticate } from '@/middleware/auth';
import { validate } from '@/middleware/requestValidation';
import {
  getNotifications,
  markAsRead,
  markAllAsRead,
  archiveNotification,
  deleteNotification,
} from '@/controllers/notificationController';
import { getNotificationsSchema, notificationIdSchema } from '@/routes/notificationSchemas';

const notificationRouter = Router();

notificationRouter.get(
  '/',
  authenticate,
  validate(getNotificationsSchema),
  getNotifications
);

notificationRouter.patch(
  '/read-all',
  authenticate,
  markAllAsRead
);

notificationRouter.patch(
  '/:notificationId/read',
  authenticate,
  validate(notificationIdSchema),
  markAsRead
);

notificationRouter.patch(
  '/:notificationId/archive',
  authenticate,
  validate(notificationIdSchema),
  archiveNotification
);

notificationRouter.delete(
  '/:notificationId',
  authenticate,
  validate(notificationIdSchema),
  deleteNotification
);

export default notificationRouter;