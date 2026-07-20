import { prisma } from '@/config/database';
import { logger } from '@/config/logger';
import { AppError } from '@/utils/AppError';
import { Prisma } from '@prisma/client';

export interface EmploymentInput {
  employmentStatus: string; // EMPLOYED, SELF_EMPLOYED, BUSINESS, STUDENT, UNEMPLOYED, RETIRED, OTHER
  occupationJobTitle?: string;
  employerName?: string;
  employmentStartDate?: string;
  monthlyGrossIncome?: number;
  annualIncome?: number;
  dependentsCount?: number;
  incomeSourceType?: string;

  // Self-Employed / Business
  businessName?: string;
  businessType?: string;

  // Student
  institutionName?: string;
  educationLevel?: string;
  expectedGraduationDate?: string;
}

export const employmentService = {
  async saveEmploymentInfo(userId: string, data: EmploymentInput) {
    try {
      const startDate = data.employmentStartDate ? new Date(data.employmentStartDate) : null;
      if (data.employmentStartDate && startDate && isNaN(startDate.getTime())) {
        throw new AppError('Invalid employment start date', 400);
      }

      const graduationDate = data.expectedGraduationDate ? new Date(data.expectedGraduationDate) : null;
      if (data.expectedGraduationDate && graduationDate && isNaN(graduationDate.getTime())) {
        throw new AppError('Invalid expected graduation date', 400);
      }

      const monthlyIncome = data.monthlyGrossIncome
        ? new Prisma.Decimal(data.monthlyGrossIncome)
        : null;
      const annualIncome = data.annualIncome
        ? new Prisma.Decimal(data.annualIncome)
        : (monthlyIncome ? monthlyIncome.mul(12) : new Prisma.Decimal(0));

      const employment = await prisma.employmentInfo.upsert({
        where: { userId },
        create: {
          userId,
          employmentStatus: data.employmentStatus,
          occupationJobTitle: data.occupationJobTitle ?? null,
          employerName: data.employerName ?? null,
          employmentStartDate: startDate,
          monthlyGrossIncome: monthlyIncome ?? new Prisma.Decimal(0),
          annualIncome,
          dependentsCount: data.dependentsCount ?? 0,
          incomeSourceType: data.incomeSourceType ?? 'SALARY',
          businessName: data.businessName ?? null,
          businessType: data.businessType ?? null,
          institutionName: data.institutionName ?? null,
          educationLevel: data.educationLevel ?? null,
          expectedGraduationDate: graduationDate,
        },
        update: {
          employmentStatus: data.employmentStatus,
          occupationJobTitle: data.occupationJobTitle ?? null,
          employerName: data.employerName ?? null,
          employmentStartDate: startDate,
          monthlyGrossIncome: monthlyIncome ?? new Prisma.Decimal(0),
          annualIncome,
          dependentsCount: data.dependentsCount ?? 0,
          incomeSourceType: data.incomeSourceType ?? 'SALARY',
          businessName: data.businessName ?? null,
          businessType: data.businessType ?? null,
          institutionName: data.institutionName ?? null,
          educationLevel: data.educationLevel ?? null,
          expectedGraduationDate: graduationDate,
        },
      });

      logger.info({ userId, employmentId: employment.id, status: data.employmentStatus }, 'Employment info saved');

      return employment;
    } catch (error) {
      if (error instanceof AppError) throw error;
      logger.error({ err: error, userId }, 'Failed to save employment info');
      throw new AppError('Failed to save employment information', 500);
    }
  },

  async getEmploymentInfo(userId: string) {
    try {
      const employment = await prisma.employmentInfo.findUnique({
        where: { userId },
      });

      return employment;
    } catch (error) {
      if (error instanceof AppError) throw error;
      logger.error({ err: error, userId }, 'Failed to fetch employment info');
      throw new AppError('Failed to fetch employment information', 500);
    }
  },

  async calculateTenure(userId: string) {
    try {
      const employment = await prisma.employmentInfo.findUnique({
        where: { userId },
      });

      if (!employment || !employment.employmentStartDate) {
        return { tenureMonths: 0, tenureDays: 0, isStable: false };
      }

      const today = new Date();
      const startDate = employment.employmentStartDate;
      const diffMs = today.getTime() - startDate.getTime();
      const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
      const diffMonths = Math.floor(diffDays / 30);

      const isStable = diffDays > 5 * 365;

      await prisma.employmentInfo.update({
        where: { userId },
        data: {
          employmentTenureMonths: diffMonths,
          employmentTenureDays: diffDays,
          employmentStable: isStable,
        },
      });

      return { tenureMonths: diffMonths, tenureDays: diffDays, isStable };
    } catch (error) {
      if (error instanceof AppError) throw error;
      logger.error({ err: error, userId }, 'Failed to calculate tenure');
      throw new AppError('Failed to calculate employment tenure', 500);
    }
  },

  async updateIncomeStabilityScore(userId: string, score: number) {
    try {
      await prisma.employmentInfo.update({
        where: { userId },
        data: { incomeStabilityScore: score },
      });
    } catch (error) {
      if (error instanceof AppError) throw error;
      logger.error({ err: error, userId }, 'Failed to update income stability score');
      throw new AppError('Failed to update income stability score', 500);
    }
  },
};
