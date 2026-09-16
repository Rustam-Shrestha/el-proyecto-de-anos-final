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

function resolveTid(tenantId?: number): number {
  if (tenantId === undefined || tenantId === null) {
    logger.warn("employmentService: tenantId not provided, falling back to 1");
    return 1;
  }
  return tenantId;
}
function isTenantSchemaError(e: unknown): boolean {
  const code = (e as { code?: string })?.code;
  const msg = String((e as { message?: string })?.message ?? (e as Error)?.message ?? "");
  return code === "P2021" || code === "P2022" || msg.includes("tenantId") || msg.includes("tenant_id") || msg.includes("does not exist");
}

export const employmentService = {
  async saveEmploymentInfo(userId: string, data: EmploymentInput, tenantId?: number) {
    try {
      const tid = resolveTid(tenantId);
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

      // tenant-aware upsert: use findFirst + update/create to enforce tenantId
      let existing: Awaited<ReturnType<typeof prisma.employmentInfo.findFirst>>;
      try {
        existing = await prisma.employmentInfo.findFirst({ where: { userId, tenantId: tid } });
      } catch (e) {
        if (isTenantSchemaError(e)) existing = await prisma.employmentInfo.findUnique({ where: { userId } }) as never;
        else throw e;
      }
      let employment: Awaited<ReturnType<typeof prisma.employmentInfo.findFirst>>;
      if (existing) {
        try {
          employment = await prisma.employmentInfo.update({
            where: { id: existing.id },
            data: {
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
          }) as never;
        } catch (e) {
          if (isTenantSchemaError(e)) {
            employment = await prisma.employmentInfo.update({ where: { userId }, data: { employmentStatus: data.employmentStatus, occupationJobTitle: data.occupationJobTitle ?? null, employerName: data.employerName ?? null, employmentStartDate: startDate, monthlyGrossIncome: monthlyIncome ?? new Prisma.Decimal(0), annualIncome, dependentsCount: data.dependentsCount ?? 0, incomeSourceType: data.incomeSourceType ?? 'SALARY', businessName: data.businessName ?? null, businessType: data.businessType ?? null, institutionName: data.institutionName ?? null, educationLevel: data.educationLevel ?? null, expectedGraduationDate: graduationDate } }) as never;
          } else throw e;
        }
      } else {
        try {
          employment = await prisma.employmentInfo.create({
            data: {
              tenantId: tid,
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
          }) as never;
        } catch (e) {
          if (isTenantSchemaError(e)) {
            employment = await prisma.employmentInfo.upsert({
              where: { userId },
              create: { userId, employmentStatus: data.employmentStatus, occupationJobTitle: data.occupationJobTitle ?? null, employerName: data.employerName ?? null, employmentStartDate: startDate, monthlyGrossIncome: monthlyIncome ?? new Prisma.Decimal(0), annualIncome, dependentsCount: data.dependentsCount ?? 0, incomeSourceType: data.incomeSourceType ?? 'SALARY', businessName: data.businessName ?? null, businessType: data.businessType ?? null, institutionName: data.institutionName ?? null, educationLevel: data.educationLevel ?? null, expectedGraduationDate: graduationDate },
              update: { employmentStatus: data.employmentStatus, occupationJobTitle: data.occupationJobTitle ?? null, employerName: data.employerName ?? null, employmentStartDate: startDate, monthlyGrossIncome: monthlyIncome ?? new Prisma.Decimal(0), annualIncome, dependentsCount: data.dependentsCount ?? 0, incomeSourceType: data.incomeSourceType ?? 'SALARY', businessName: data.businessName ?? null, businessType: data.businessType ?? null, institutionName: data.institutionName ?? null, educationLevel: data.educationLevel ?? null, expectedGraduationDate: graduationDate },
            }) as never;
          } else throw e;
        }
      }

      logger.info({ userId, tenantId: tid, employmentId: employment!.id, status: data.employmentStatus }, 'Employment info saved');

      return employment!;
    } catch (error) {
      if (error instanceof AppError) throw error;
      const cause = error instanceof Error ? error.message : 'Unknown error';
      logger.error({ err: error, userId }, `Failed to save employment info: ${cause}`);
      throw new AppError(`Failed to save employment information for user ${userId}. Root cause: ${cause}`, 500, { cause });
    }
  },

  async getEmploymentInfo(userId: string, tenantId?: number) {
    try {
      const tid = resolveTid(tenantId);
      try {
        const employment = await prisma.employmentInfo.findFirst({ where: { userId, tenantId: tid } });
        return employment;
      } catch (e) {
        if (isTenantSchemaError(e)) return prisma.employmentInfo.findUnique({ where: { userId } });
        throw e;
      }
    } catch (error) {
      if (error instanceof AppError) throw error;
      const cause = error instanceof Error ? error.message : 'Unknown error';
      logger.error({ err: error, userId }, `Failed to fetch employment info: ${cause}`);
      throw new AppError(`Failed to fetch employment information for user ${userId}. Root cause: ${cause}`, 500, { cause });
    }
  },

  async calculateTenure(userId: string, tenantId?: number) {
    try {
      const tid = resolveTid(tenantId);
      let employment: Awaited<ReturnType<typeof prisma.employmentInfo.findFirst>>;
      try {
        employment = await prisma.employmentInfo.findFirst({ where: { userId, tenantId: tid } });
      } catch (e) {
        if (isTenantSchemaError(e)) employment = await prisma.employmentInfo.findUnique({ where: { userId } }) as never;
        else throw e;
      }

      if (!employment || !employment.employmentStartDate) {
        return { tenureMonths: 0, tenureDays: 0, isStable: false };
      }

      const today = new Date();
      const startDate = employment.employmentStartDate;
      const diffMs = today.getTime() - startDate.getTime();
      const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
      const diffMonths = Math.floor(diffDays / 30);

      const isStable = diffDays > 5 * 365;

      try {
        await prisma.employmentInfo.update({
          where: { id: employment.id },
          data: {
            employmentTenureMonths: diffMonths,
            employmentTenureDays: diffDays,
            employmentStable: isStable,
          },
        });
      } catch (e) {
        if (isTenantSchemaError(e)) {
          await prisma.employmentInfo.update({ where: { userId }, data: { employmentTenureMonths: diffMonths, employmentTenureDays: diffDays, employmentStable: isStable } });
        } else throw e;
      }

      return { tenureMonths: diffMonths, tenureDays: diffDays, isStable };
    } catch (error) {
      if (error instanceof AppError) throw error;
      logger.error({ err: error, userId }, 'Failed to calculate tenure');
      throw new AppError('Failed to calculate employment tenure', 500);
    }
  },

  async updateIncomeStabilityScore(userId: string, score: number, tenantId?: number) {
    try {
      const tid = resolveTid(tenantId);
      let employment: Awaited<ReturnType<typeof prisma.employmentInfo.findFirst>>;
      try {
        employment = await prisma.employmentInfo.findFirst({ where: { userId, tenantId: tid } });
      } catch (e) {
        if (isTenantSchemaError(e)) employment = await prisma.employmentInfo.findUnique({ where: { userId } }) as never;
        else throw e;
      }
      if (!employment) throw new AppError('Employment info not found', 404);
      try {
        await prisma.employmentInfo.update({ where: { id: employment.id }, data: { incomeStabilityScore: score } });
      } catch (e) {
        if (isTenantSchemaError(e)) await prisma.employmentInfo.update({ where: { userId }, data: { incomeStabilityScore: score } });
        else throw e;
      }
    } catch (error) {
      if (error instanceof AppError) throw error;
      logger.error({ err: error, userId }, 'Failed to update income stability score');
      throw new AppError('Failed to update income stability score', 500);
    }
  },
};
