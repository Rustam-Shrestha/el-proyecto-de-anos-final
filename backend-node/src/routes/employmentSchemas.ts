import { z } from 'zod';

export const employmentSchema = z.object({
  body: z.object({
    occupationJobTitle: z.string().min(1, 'Job title is required'),
    employmentStartDate: z.string().min(1, 'Employment start date is required'),
    annualIncome: z.number().positive('Annual income must be positive'),
    employerName: z.string().optional(),
    dependentsCount: z.number().int().min(0).max(20).optional(),
  }),
});
