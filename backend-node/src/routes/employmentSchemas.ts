import { z } from 'zod';

export const employmentSchema = z.object({
  body: z.object({
    employmentStatus: z.enum([
      'EMPLOYED', 'SELF_EMPLOYED', 'BUSINESS', 'STUDENT',
      'UNEMPLOYED', 'RETIRED', 'OTHER',
    ]),
    occupationJobTitle: z.string().optional(),
    employerName: z.string().optional(),
    employmentStartDate: z.string().optional(),
    monthlyGrossIncome: z.number().min(0).optional(),
    annualIncome: z.number().min(0).optional(),
    dependentsCount: z.number().int().min(0).max(20).optional(),
    incomeSourceType: z.enum(['SALARY', 'BUSINESS', 'PENSION', 'STIPEND', 'OTHER']).optional(),
    businessName: z.string().optional(),
    businessType: z.string().optional(),
    institutionName: z.string().optional(),
    educationLevel: z.string().optional(),
    expectedGraduationDate: z.string().optional(),
  }),
});
