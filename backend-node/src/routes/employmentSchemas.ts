import { z } from 'zod';

export const employmentSchema = z.object({
  body: z.object({
    jobTitle: z.string().min(1, 'Job title is required'),
    employmentStartDate: z.string().min(1, 'Employment start date is required'),
    declaredAnnualIncome: z.number().positive('Annual income must be positive'),
  }),
});
