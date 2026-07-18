import { prisma } from '@/config/database';
import { logger } from '@/config/logger';
import { AppError } from '@/utils/AppError';
import { Prisma } from '@prisma/client';

export interface EmploymentInput {
  occupationJobTitle: string;
  employmentStartDate: string;
  annualIncome: number;
  employerName?: string;
  dependentsCount?: number;
}

export const employmentService = {
  async saveEmploymentInfo(userId: string, data: EmploymentInput) {
    try {
      const startDate = data.employmentStartDate ? new Date(data.employmentStartDate) : null;

      if (data.employmentStartDate && isNaN(startDate!.getTime())) {
        throw new AppError('Invalid employment start date', 400);
      }

      const employment = await prisma.employmentInfo.upsert({
        where: { userId },
        create: {
          userId,
          occupationJobTitle: data.occupationJobTitle,
          employmentStatus: 'EMPLOYED',
          employmentStartDate: startDate,
          monthlyGrossIncome: new Prisma.Decimal(data.annualIncome / 12),
          annualIncome: new Prisma.Decimal(data.annualIncome),
          dependentsCount: data.dependentsCount ?? 0,
          employerName: data.employerName ?? null,
        },
        update: {
          occupationJobTitle: data.occupationJobTitle,
          employmentStatus: 'EMPLOYED',
          employmentStartDate: startDate,
          monthlyGrossIncome: new Prisma.Decimal(data.annualIncome / 12),
          annualIncome: new Prisma.Decimal(data.annualIncome),
          dependentsCount: data.dependentsCount ?? 0,
          employerName: data.employerName ?? null,
        },
      });

      logger.info({ userId, employmentId: employment.id }, 'Employment info saved');

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
};
