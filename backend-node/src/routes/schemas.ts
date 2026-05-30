import { z } from 'zod';

export const listUsersSchema = z.object({
  query: z.object({
    page: z.string().transform(Number).optional(),
    limit: z.string().transform(Number).optional(),
    search: z.string().optional(),
  }),
});

export const getUserByIdSchema = z.object({
  params: z.object({
    id: z.string().uuid('Invalid user ID format'),
  }),
});

export const updateUserSchema = z.object({
  body: z.object({
    email: z.string().email('Invalid email').optional(),
    fullName: z.string().min(2, 'Full name must be at least 2 characters').optional(),
    phone: z.string().optional(),
    address: z.string().optional(),
  }),
});

export const updateUserRoleSchema = z.object({
  params: z.object({
    id: z.string().uuid('Invalid user ID format'),
  }),
  body: z.object({
    role: z.enum(['USER', 'ADMIN', 'REVIEWER'], {
      errorMap: () => ({ message: 'Role must be USER, ADMIN, or REVIEWER' }),
    }),
  }),
});

export const deleteUserSchema = z.object({
  params: z.object({
    id: z.string().uuid('Invalid user ID format'),
  }),
});
