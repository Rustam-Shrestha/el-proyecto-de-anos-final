import { prisma } from '@/config/database';
import { logger } from '@/config/logger';
import { AppError } from '@/utils/AppError';
import { RiskLevel } from '@prisma/client';

export interface RiskResult {
  riskScore: number;
  riskLevel: RiskLevel;
  features: {
    amtIncomeTotal?: number;
    daysEmployed?: number;
    daysBirth?: number;
    debtToIncomeRatio?: number;
    cntInstalment?: number;
    amtCredit?: number;
  };
}

const ANNUAL_INTEREST_RATE = 0.18;

function resolveTid(tenantId?: number): number {
  if (tenantId === undefined || tenantId === null) {
    logger.warn("riskService: tenantId not provided, falling back to 1");
    return 1;
  }
  return tenantId;
}
function isTenantSchemaError(e: unknown): boolean {
  const code = (e as { code?: string })?.code;
  const msg = String((e as { message?: string })?.message ?? (e as Error)?.message ?? "");
  return code === "P2021" || code === "P2022" || msg.includes("tenantId") || msg.includes("tenant_id") || msg.includes("does not exist");
}

export const riskService = {
  calculateEmi(principal: number, tenureMonths: number): number {
    const monthlyRate = ANNUAL_INTEREST_RATE / 12;
    const factor = Math.pow(1 + monthlyRate, tenureMonths);
    return Math.round(principal * monthlyRate * factor / (factor - 1) * 100) / 100;
  },

  async computeRiskScore(
    userId: string,
    requestedAmount: number,
    tenureMonths: number,
    tenantId?: number
  ): Promise<RiskResult> {
    try {
      const tid = resolveTid(tenantId);
      const emi = this.calculateEmi(requestedAmount, tenureMonths);

      let employmentInfo: Awaited<ReturnType<typeof prisma.employmentInfo.findFirst>>;
      try {
        employmentInfo = await prisma.employmentInfo.findFirst({ where: { userId, tenantId: tid } });
      } catch (e) {
        if (isTenantSchemaError(e)) employmentInfo = await prisma.employmentInfo.findUnique({ where: { userId } }) as never;
        else throw e;
      }

      let incomeProofDoc: Awaited<ReturnType<typeof prisma.document.findFirst>>;
      try {
        incomeProofDoc = await prisma.document.findFirst({
          where: { userId, tenantId: tid, documentType: 'INCOME_PROOF', isDeleted: false },
          orderBy: { createdAt: 'desc' },
        });
      } catch (e) {
        if (isTenantSchemaError(e)) incomeProofDoc = await prisma.document.findFirst({ where: { userId, documentType: 'INCOME_PROOF', isDeleted: false }, orderBy: { createdAt: 'desc' } });
        else throw e;
      }

      let monthlyIncome: number | undefined;

      if (incomeProofDoc?.extractedData && typeof incomeProofDoc.extractedData === 'object' && 'net_salary' in incomeProofDoc.extractedData) {
        monthlyIncome = Number((incomeProofDoc.extractedData as Record<string, unknown>).net_salary);
      }

      if (!monthlyIncome && employmentInfo) {
        monthlyIncome = Number(employmentInfo.annualIncome) / 12;
      }

      const annualIncome = monthlyIncome ? monthlyIncome * 12 : undefined;

      let riskScore = 0;

      if (monthlyIncome && monthlyIncome > 0) {
        const dti = (emi / monthlyIncome) * 100;
        if (dti > 80) riskScore += 40;
        else if (dti >= 50) riskScore += 25;
        else if (dti >= 30) riskScore += 10;

        if (annualIncome && annualIncome > 0) {
          const incomeMultiple = requestedAmount / annualIncome;
          if (incomeMultiple > 5) riskScore += 30;
          else if (incomeMultiple >= 3) riskScore += 15;
        }
      }

      if (employmentInfo?.employmentStartDate) {
        const daysEmployed = Math.floor(
          (Date.now() - new Date(employmentInfo.employmentStartDate).getTime()) / (1000 * 60 * 60 * 24)
        );

        if (daysEmployed < 90) riskScore += 30;
        else if (daysEmployed < 365) riskScore += 15;
        else if (daysEmployed < 1095) riskScore += 5;

        let citizenshipDoc: Awaited<ReturnType<typeof prisma.document.findFirst>>;
        try {
          citizenshipDoc = await prisma.document.findFirst({
            where: { userId, tenantId: tid, documentType: 'CITIZENSHIP_FRONT', isDeleted: false, extractedData: { path: ['date_of_birth'], not: null } },
            orderBy: { createdAt: 'desc' },
          });
        } catch (e) {
          if (isTenantSchemaError(e)) citizenshipDoc = await prisma.document.findFirst({ where: { userId, documentType: 'CITIZENSHIP_FRONT', isDeleted: false, extractedData: { path: ['date_of_birth'], not: null } }, orderBy: { createdAt: 'desc' } });
          else throw e;
        }

        if (citizenshipDoc?.extractedData && typeof citizenshipDoc.extractedData === 'object') {
          const dobStr = (citizenshipDoc.extractedData as Record<string, unknown>).date_of_birth as string | undefined;
          if (dobStr) {
            const dob = new Date(dobStr);
            const age = Math.floor((Date.now() - dob.getTime()) / (1000 * 60 * 60 * 24 * 365.25));
            if (age < 21 || age > 65) riskScore += 20;
            else if ((age >= 21 && age <= 25) || (age >= 60 && age <= 65)) riskScore += 10;
          }
        }
      }

      let existingLoanDocs: number;
      try {
        existingLoanDocs = await prisma.document.count({ where: { userId, tenantId: tid, documentType: 'EXISTING_LOAN', isDeleted: false } });
      } catch (e) {
        if (isTenantSchemaError(e)) existingLoanDocs = await prisma.document.count({ where: { userId, documentType: 'EXISTING_LOAN', isDeleted: false } });
        else throw e;
      }

      if (existingLoanDocs >= 3) riskScore += 20;
      else if (existingLoanDocs >= 1) riskScore += 10;

      riskScore = Math.max(0, Math.min(100, riskScore));

      let riskLevel: RiskLevel;
      if (riskScore < 40) riskLevel = 'LOW';
      else if (riskScore <= 70) riskLevel = 'MEDIUM';
      else riskLevel = 'HIGH';

      const daysEmployed = employmentInfo?.employmentStartDate
        ? Math.floor((Date.now() - new Date(employmentInfo.employmentStartDate).getTime()) / (1000 * 60 * 60 * 24))
        : undefined;

      const features = {
        amtIncomeTotal: annualIncome,
        daysEmployed,
        daysBirth: undefined as number | undefined,
        debtToIncomeRatio: monthlyIncome && monthlyIncome > 0
          ? Math.round((emi / monthlyIncome) * 10000) / 100
          : undefined,
        cntInstalment: tenureMonths,
        amtCredit: requestedAmount,
      };

      return { riskScore, riskLevel, features };
    } catch (error) {
      if (error instanceof AppError) throw error;
      logger.error({ err: error, userId }, 'Failed to compute risk score');
      throw new AppError('Failed to compute risk score', 500);
    }
  },
};
