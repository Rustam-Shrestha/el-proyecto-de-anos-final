import { prisma } from '@/config/database';
import { Prisma } from '@prisma/client';

export const homeCredtFeatureService = {
  async calculateAllFeatures(userId: string, loanRequestAmount: number, loanTenureMonths: number) {
    const employment = await prisma.employmentInfo.findUnique({
      where: { userId }
    });

    if (!employment) {
      throw new Error('Employment info not found');
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { profile: true }
    });

    if (!user?.profile?.dateOfBirth) {
      throw new Error('Date of birth not found');
    }

    // ===== CORE FEATURES (Home Credit) =====
    const amtIncomeTotal = employment.annualIncome.toNumber();
    const amtCredit = loanRequestAmount;

    const today = new Date();
    const birthDate = user.profile.dateOfBirth;
    const daysSinceBirth = Math.floor((today.getTime() - birthDate.getTime()) / (1000 * 60 * 60 * 24));
    const daysBirth = -daysSinceBirth;

    const employmentStartDate = employment.employmentStartDate;
    if (!employmentStartDate) {
      throw new Error('Employment start date not found');
    }
    const daysSinceEmployment = Math.floor((today.getTime() - employmentStartDate.getTime()) / (1000 * 60 * 60 * 24));
    const daysEmployed = -daysSinceEmployment;

    const amtAnnuity = this.calculateEMI(amtCredit, loanTenureMonths);
    const occupationType = employment.occupationJobTitle || 'Unknown';
    const cntChildren = employment.dependentsCount;

    // ===== DERIVED FEATURES =====
    const creditIncomePercent = (amtCredit / amtIncomeTotal) * 100;
    const annualEMI = amtAnnuity * 12;
    const annuityIncomePercent = (annualEMI / amtIncomeTotal) * 100;
    const incomePerPerson = amtIncomeTotal / (1 + cntChildren);
    const daysEmployedPercent = (daysSinceEmployment / daysSinceBirth) * 100;
    const employmentStability = daysSinceEmployment > 5 * 365 ? 1 : 0;
    const ageYears = daysSinceBirth / 365;
    const ageCategory = ageYears >= 25 && ageYears <= 60 ? 1 : 0;

    // ===== STORE ALL FEATURES =====
    const features = await prisma.loanFeatures.upsert({
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
    });

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
