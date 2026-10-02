import { z } from 'zod';

export const getNotificationsSchema = z.object({
  query: z.object({
    status: z.enum(['UNREAD', 'READ', 'ARCHIVED']).optional(),
    limit: z.coerce.number().int().min(1).max(100).optional(),
    offset: z.coerce.number().int().min(0).optional(),
  }),
});

export const notificationIdSchema = z.object({
  params: z.object({ notificationId: z.string().min(1) }),
});
