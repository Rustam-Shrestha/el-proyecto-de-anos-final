import { z } from "zod";

export const applicationSchema = z.object({
  loanAmount: z
    .number()
    .min(10000, "Minimum loan amount is ₹10,000")
    .max(1000000, "Maximum loan amount is ₹10,00,000"),
  tenure: z
    .number()
    .refine((val) => [6, 12, 24, 36, 48, 60].includes(val), "Invalid tenure"),
  purpose: z.string().min(1, "Loan purpose is required"),
  annualIncome: z.number().positive("Income must be positive"),
});

export type ApplicationInput = z.infer<typeof applicationSchema>;
