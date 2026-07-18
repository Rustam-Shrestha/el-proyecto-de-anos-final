import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().email("Enter a valid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

export const registerSchema = z
  .object({
    email: z.string().email("Enter a valid email address"),
    password: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .regex(/[a-z]/, "Password must include a lowercase letter")
      .regex(/[A-Z]/, "Password must include an uppercase letter")
      .regex(/[0-9]/, "Password must include a number"),
    confirmPassword: z.string().min(1, "Confirm your password"),
    fullName: z.string().min(1, "Full name is required").optional(),
  })
  .refine((value) => value.password === value.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export const profileUpdateSchema = z.object({
  fullName: z.string().min(1, "Full name is required").optional(),
  phone: z.string().optional(),
  address: z.string().optional(),
});

export const updateProfileSchema = profileUpdateSchema;

export const kycSubmitSchema = z.object({
  documents: z
    .array(
      z.object({
        type: z.enum([
          "CITIZENSHIP_FRONT",
          "CITIZENSHIP_BACK",
          "PASSPORT",
          "SELFIE",
          "OTHER",
        ]),
        filePath: z.string(),
        mimeType: z.string(),
        sizeBytes: z.number().positive(),
      })
    )
    .min(1, "At least one document is required"),
});

export const kycApproveSchema = z.object({
  notes: z.string().optional(),
});

export const kycRejectSchema = z.object({
  reason: z.string().min(10, "Rejection reason must be at least 10 characters"),
});

export const loanApplicationSchema = z.object({
  amount: z
    .number()
    .min(10000, "Minimum loan amount is NPR 10,000")
    .max(2000000, "Maximum loan amount is NPR 2,000,000"),
  purpose: z.enum([
    "PERSONAL",
    "BUSINESS",
    "EDUCATION",
    "HOME",
  ]),
  termMonths: z
    .number()
    .int()
    .refine((v) => [6, 12, 18, 24, 36, 48, 60].includes(v), {
      message: "Tenure must be one of: 6, 12, 18, 24, 36, 48, 60 months",
    }),
  income: z.number().positive().optional(),
  employmentYears: z.number().min(0).optional(),
});

export const loanReviewSchema = z.object({
  status: z.enum(["APPROVED", "REJECTED"]),
  notes: z.string().optional(),
  rejectionReason: z.string().min(10).optional(),
  interestRate: z.number().min(0).max(100).optional(),
});

export const userCreateSchema = z.object({
  email: z.string().email("Enter a valid email address"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .regex(/[a-z]/, "Password must include a lowercase letter")
    .regex(/[A-Z]/, "Password must include an uppercase letter")
    .regex(/[0-9]/, "Password must include a number"),
  role: z.enum(["USER", "ADMIN", "REVIEWER"]),
  fullName: z.string().optional(),
});

export const userUpdateSchema = z.object({
  email: z.string().email("Enter a valid email address").optional(),
  role: z.enum(["USER", "ADMIN", "REVIEWER"]).optional(),
  fullName: z.string().optional(),
  phone: z.string().optional(),
  address: z.string().optional(),
});

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
export type ProfileUpdateInput = z.infer<typeof profileUpdateSchema>;
export type KYCSubmitInput = z.infer<typeof kycSubmitSchema>;
export type KYCApproveInput = z.infer<typeof kycApproveSchema>;
export type KYCRejectInput = z.infer<typeof kycRejectSchema>;
export type LoanApplicationInput = z.infer<typeof loanApplicationSchema>;
export type LoanReviewInput = z.infer<typeof loanReviewSchema>;
export type UserCreateInput = z.infer<typeof userCreateSchema>;
export type UserUpdateInput = z.infer<typeof userUpdateSchema>;
