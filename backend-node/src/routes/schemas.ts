import { z } from "zod";

export const loginSchema = z.object({
  body: z.object({
    email: z.string().email(),
    password: z.string().min(8)
  }),
  query: z.object({}).optional(),
  params: z.object({}).optional()
});

export const createUserSchema = z.object({
  body: z.object({
    email: z.string().email(),
    role: z.enum(["admin", "manager", "staff"])
  }),
  query: z.object({}).optional(),
  params: z.object({}).optional()
});

export const paginationSchema = z.object({
  query: z.object({
    page: z.coerce.number().int().positive().optional(),
    limit: z.coerce.number().int().positive().optional()
  }),
  body: z.object({}).optional(),
  params: z.object({}).optional()
});
