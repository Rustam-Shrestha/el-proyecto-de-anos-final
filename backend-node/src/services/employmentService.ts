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

function parseSafeDate(val: string | null | undefined): Date | null {
  if (!val) return null;
  const str = String(val).trim();
  if (!str) return null;

  const ddmmyyyy = str.match(/^(\d{1,2})[-/](\d{1,2})[-/](\d{4})$/);
  if (ddmmyyyy) {
    const day = parseInt(ddmmyyyy[1], 10);
    const month = parseInt(ddmmyyyy[2], 10) - 1;
    const year = parseInt(ddmmyyyy[3], 10);
    const d = new Date(Date.UTC(year, month, day));
    if (!isNaN(d.getTime())) return d;
  }

  const yyyymmdd = str.match(/^(\d{4})[-/](\d{1,2})[-/](\d{1,2})/);
  if (yyyymmdd) {
    const year = parseInt(yyyymmdd[1], 10);
    const month = parseInt(yyyymmdd[2], 10) - 1;
    const day = parseInt(yyyymmdd[3], 10);
    const d = new Date(Date.UTC(year, month, day));
    if (!isNaN(d.getTime())) return d;
  }

  const parsed = new Date(str);
  if (isNaN(parsed.getTime())) return null;

  const fullYear = parsed.getFullYear();
  if (fullYear < 100) {
    parsed.setFullYear(2000 + fullYear);
  } else if (fullYear < 1900) {
    parsed.setFullYear(2000 + (fullYear % 100));
  }
  return parsed;
}

export const employmentService = {
  async saveEmploymentInfo(userId: string, data: EmploymentInput, tenantId?: number) {
    try {
      const tid = resolveTid(tenantId);
      const startDate = parseSafeDate(data.employmentStartDate);
      if (data.employmentStartDate && !startDate) {
        throw new AppError('Invalid employment start date', 400);
      }

      const graduationDate = parseSafeDate(data.expectedGraduationDate);
      if (data.expectedGraduationDate && !graduationDate) {
        throw new AppError('Invalid expected graduation date', 400);
      }

      const monthlyIncome = data.monthlyGrossIncome
        ? new Prisma.Decimal(data.monthlyGrossIncome)
        : null;
      const annualIncome = data.annualIncome
        ? new Prisma.Decimal(data.annualIncome)
        : (monthlyIncome ? monthlyIncome.mul(12) : new Prisma.Decimal(0));

      // Robust upsert keyed by userId (which has a unique constraint in schema)
      const empData = {
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
      };

      let employment: Awaited<ReturnType<typeof prisma.employmentInfo.upsert>>;
      try {
        employment = await prisma.employmentInfo.upsert({
          where: { userId },
          create: {
            ...empData,
            userId,
            tenantId: tid,
          },
          update: empData,
        });
      } catch (e) {
        if (isTenantSchemaError(e)) {
          employment = await prisma.employmentInfo.upsert({
            where: { userId },
            create: {
              ...empData,
              userId,
            },
            update: empData,
          });
        } else throw e;
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

  async getEmploymentInfo(userId: string, _tenantId?: number) {
    try {
      try {
        const employment = await prisma.employmentInfo.findFirst({ where: { userId } });
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

  async calculateTenure(userId: string, _tenantId?: number) {
    try {
      let employment: Awaited<ReturnType<typeof prisma.employmentInfo.findFirst>>;
      try {
        employment = await prisma.employmentInfo.findFirst({ where: { userId } });
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
