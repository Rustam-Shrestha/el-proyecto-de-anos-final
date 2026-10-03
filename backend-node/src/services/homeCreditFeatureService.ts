import { prisma } from '@/config/database';
import { logger } from '@/config/logger';
import { Prisma } from '@prisma/client';

function resolveTid(tenantId?: number): number {
  if (tenantId === undefined || tenantId === null) {
    logger.warn("homeCreditFeatureService: tenantId not provided, falling back to 1");
    return 1;
  }
  return tenantId;
}
function isTenantSchemaError(e: unknown): boolean {
  const code = (e as { code?: string })?.code;
  const msg = String((e as { message?: string })?.message ?? (e as Error)?.message ?? "");
  return code === "P2021" || code === "P2022" || msg.includes("tenantId") || msg.includes("tenant_id") || msg.includes("does not exist");
}

export const homeCredtFeatureService = {
  async calculateAllFeatures(userId: string, loanRequestAmount: number, loanTenureMonths: number, tenantId?: number) {
    const tid = resolveTid(tenantId);
    let employment: Awaited<ReturnType<typeof prisma.employmentInfo.findFirst>>;
    try {
      employment = await prisma.employmentInfo.findFirst({ where: { userId } });
    } catch (e) {
      if (isTenantSchemaError(e)) employment = await prisma.employmentInfo.findUnique({ where: { userId } }) as never;
      else throw e;
    }

    if (!employment) {
      const [fin, kyc] = await Promise.all([
        prisma.financialProfile.findFirst({ where: { userId } }).catch(() => null),
        prisma.kycApplication.findFirst({ where: { userId, status: 'APPROVED' }, orderBy: { createdAt: 'desc' } }).catch(() => null),
      ]);
      const income = Number(fin?.avgMonthlyIncome || (kyc as unknown as { confirmedMonthlyIncome?: number })?.confirmedMonthlyIncome || 50000);
      employment = {
        annualIncome: new Prisma.Decimal(income * 12),
        monthlyGrossIncome: new Prisma.Decimal(income),
        employmentStartDate: new Date(Date.now() - 365 * 3 * 86400000),
        dependentsCount: 0,
        occupationJobTitle: 'Professional',
        employmentStatus: 'EMPLOYED',
      } as never;
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { profile: true }
    });

    // ===== CORE FEATURES (Home Credit) =====
    const amtIncomeTotal = employment.annualIncome ? employment.annualIncome.toNumber() : (employment.monthlyGrossIncome ? employment.monthlyGrossIncome.toNumber() * 12 : 500000);
    const amtCredit = loanRequestAmount;

    const today = new Date();
    let daysBirth = -10957; // default ~30 years
    let daysSinceBirth = 10957;
    if (user?.profile?.dateOfBirth) {
      const birthDate = new Date(user.profile.dateOfBirth);
      if (!isNaN(birthDate.getTime())) {
        daysSinceBirth = Math.floor((today.getTime() - birthDate.getTime()) / (1000 * 60 * 60 * 24));
        if (daysSinceBirth < 6000) daysSinceBirth = 10000;
        if (daysSinceBirth > 30000) daysSinceBirth = 25000;
        daysBirth = -daysSinceBirth;
      }
    }

    let daysEmployed = -1000; // default ~3 years
    let daysSinceEmployment = 1000;
    if (employment.employmentStartDate) {
      const startDate = new Date(employment.employmentStartDate);
      if (!isNaN(startDate.getTime())) {
        daysSinceEmployment = Math.floor((today.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
        if (daysSinceEmployment < 0) daysSinceEmployment = 0;
        if (daysSinceEmployment > 20000) daysSinceEmployment = 20000;
        daysEmployed = -daysSinceEmployment;
      }
    } else if (employment.employmentStatus === 'UNEMPLOYED' || employment.employmentStatus === 'RETIRED') {
      daysEmployed = 365243;
      daysSinceEmployment = 0;
    }

    const amtAnnuity = this.calculateEMI(amtCredit, loanTenureMonths);
    const occupationType = employment.occupationJobTitle || 'Unknown';
    const cntChildren = employment.dependentsCount ?? 0;

    // ===== DERIVED FEATURES =====
    const creditIncomePercent = amtIncomeTotal > 0 ? (amtCredit / amtIncomeTotal) * 100 : 0;
    const annualEMI = amtAnnuity * 12;
    const annuityIncomePercent = amtIncomeTotal > 0 ? (annualEMI / amtIncomeTotal) * 100 : 0;
    const incomePerPerson = amtIncomeTotal / (1 + cntChildren);
    const daysEmployedPercent = daysSinceBirth > 0 ? (daysSinceEmployment / daysSinceBirth) * 100 : 0;
    const employmentStability = daysSinceEmployment > 5 * 365 ? 1 : 0;
    const ageYears = daysSinceBirth / 365;
    const ageCategory = ageYears >= 25 && ageYears <= 60 ? 1 : 0;

    // ===== STORE ALL FEATURES =====
    let _features: Awaited<ReturnType<typeof prisma.loanFeatures.findFirst>>;
    try {
      const existing = await prisma.loanFeatures.findFirst({ where: { userId, tenantId: tid } });
      if (existing) {
        _features = await prisma.loanFeatures.update({
          where: { id: existing.id },
          data: {
            requestedLoanAmount: new Prisma.Decimal(amtCredit),
            loanTenureMonths,
            calculatedEMI: new Prisma.Decimal(amtAnnuity),
            creditIncomePercent: new Prisma.Decimal(creditIncomePercent.toFixed(2)),
            annuityIncomePercent: new Prisma.Decimal(annuityIncomePercent.toFixed(2)),
            incomePerPerson: new Prisma.Decimal(incomePerPerson.toFixed(2)),
            lastCalculated: new Date()
          }
        }) as never;
      } else {
        try {
          _features = await prisma.loanFeatures.create({
            data: {
              tenantId: tid,
              userId,
              requestedLoanAmount: new Prisma.Decimal(amtCredit),
              loanTenureMonths,
              calculatedEMI: new Prisma.Decimal(amtAnnuity),
              creditIncomePercent: new Prisma.Decimal(creditIncomePercent.toFixed(2)),
              annuityIncomePercent: new Prisma.Decimal(annuityIncomePercent.toFixed(2)),
              incomePerPerson: new Prisma.Decimal(incomePerPerson.toFixed(2))
            }
          }) as never;
        } catch (e) {
          if (isTenantSchemaError(e)) {
            _features = await prisma.loanFeatures.upsert({
              where: { userId },
              update: {
                requestedLoanAmount: new Prisma.Decimal(amtCredit),
                loanTenureMonths,
                calculatedEMI: new Prisma.Decimal(amtAnnuity),
                creditIncomePercent: new Prisma.Decimal(creditIncomePercent.toFixed(2)),
                annuityIncomePercent: new Prisma.Decimal(annuityIncomePercent.toFixed(2)),
                incomePerPerson: new Prisma.Decimal(incomePerPerson.toFixed(2)),
                lastCalculated: new Date()
              },
              create: {
                userId,
                requestedLoanAmount: new Prisma.Decimal(amtCredit),
                loanTenureMonths,
                calculatedEMI: new Prisma.Decimal(amtAnnuity),
                creditIncomePercent: new Prisma.Decimal(creditIncomePercent.toFixed(2)),
                annuityIncomePercent: new Prisma.Decimal(annuityIncomePercent.toFixed(2)),
                incomePerPerson: new Prisma.Decimal(incomePerPerson.toFixed(2))
              }
            }) as never;
          } else throw e;
        }
      }
    } catch (e) {
      if (isTenantSchemaError(e)) {
        _features = await prisma.loanFeatures.upsert({
          where: { userId },
          update: {
            requestedLoanAmount: new Prisma.Decimal(amtCredit),
            loanTenureMonths,
            calculatedEMI: new Prisma.Decimal(amtAnnuity),
            creditIncomePercent: new Prisma.Decimal(creditIncomePercent.toFixed(2)),
            annuityIncomePercent: new Prisma.Decimal(annuityIncomePercent.toFixed(2)),
            incomePerPerson: new Prisma.Decimal(incomePerPerson.toFixed(2)),
            lastCalculated: new Date()
          },
          create: {
            userId,
            requestedLoanAmount: new Prisma.Decimal(amtCredit),
            loanTenureMonths,
            calculatedEMI: new Prisma.Decimal(amtAnnuity),
            creditIncomePercent: new Prisma.Decimal(creditIncomePercent.toFixed(2)),
            annuityIncomePercent: new Prisma.Decimal(annuityIncomePercent.toFixed(2)),
            incomePerPerson: new Prisma.Decimal(incomePerPerson.toFixed(2))
          }
        }) as never;
      } else throw e;
    }

    return {
      homeCredtFeatures: {
        AMT_INCOME_TOTAL: amtIncomeTotal,
        AMT_CREDIT: amtCredit,
        DAYS_BIRTH: daysBirth,
        DAYS_EMPLOYED: daysEmployed,
        AMT_ANNUITY: amtAnnuity,
        OCCUPATION_TYPE: occupationType,
        CNT_CHILDREN: cntChildren
      },
      derivedFeatures: {
        CREDIT_INCOME_PERCENT: creditIncomePercent,
        ANNUITY_INCOME_PERCENT: annuityIncomePercent,
        INCOME_PER_PERSON: incomePerPerson,
        DAYS_EMPLOYED_PERCENT: daysEmployedPercent,
        EMPLOYMENT_STABILITY: employmentStability,
        AGE_CATEGORY: ageCategory
      }
    };
  },

  calculateEMI(principal: number, tenureMonths: number): number {
    const annualRate = 0.18;
    const monthlyRate = annualRate / 12;
    const numerator = principal * monthlyRate * Math.pow(1 + monthlyRate, tenureMonths);
    const denominator = Math.pow(1 + monthlyRate, tenureMonths) - 1;
    const emi = numerator / denominator;
    return Math.round(emi);
  }
};
