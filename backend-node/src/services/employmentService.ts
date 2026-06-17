import { prisma } from '@/config/database';
import { logger } from '@/config/logger';
import { AppError } from '@/utils/AppError';

export interface EmploymentInput {
  jobTitle: string;
  employmentStartDate: string;
  declaredAnnualIncome: number;
}

export const employmentService = {
  async saveEmploymentInfo(userId: string, data: EmploymentInput) {
    try {
      const startDate = new Date(data.employmentStartDate);

      if (isNaN(startDate.getTime())) {
        throw new AppError('Invalid employment start date', 400);
      }

      const employment = await prisma.employmentInfo.upsert({
        where: { userId },
        create: {
          userId,
          jobTitle: data.jobTitle,
          employmentStartDate: startDate,
          declaredAnnualIncome: data.declaredAnnualIncome,
        },
        update: {
          jobTitle: data.jobTitle,
          employmentStartDate: startDate,
          declaredAnnualIncome: data.declaredAnnualIncome,
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
