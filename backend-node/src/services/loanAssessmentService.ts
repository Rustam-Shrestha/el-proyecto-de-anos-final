import { prisma } from '@/config/database';
import { logger } from '@/config/logger';
import { AppError } from '@/utils/AppError';
import { statementParserService } from './statementParserService';
import { finguardProxyService, normalizeFinguardInput } from './finguardProxyService';
import type { FinguardInput, FinguardResult } from './finguardProxyService';
import { Prisma } from '@prisma/client';

/** Penalty applied to the heuristic eligibility score: probability (0-1) * 20 points. */
const FINGUARD_PENALTY_WEIGHT = 20;

function round2(value: number): number {
  return Math.round(value * 100) / 100;
}

function riskLevelFromScore(score: number): string {
  if (score >= 80) return 'LOW';
  if (score >= 60) return 'MEDIUM';
  if (score >= 40) return 'HIGH';
  return 'REJECTED';
}

function multiplierFor(riskLevel: string): number {
  switch (riskLevel) {
    case 'LOW': return 1.0;
    case 'MEDIUM': return 0.8;
    case 'HIGH': return 0.5;
    default: return 0.0;
  }
}

function resolveTid(tenantId?: number): number {
  if (tenantId === undefined || tenantId === null) {
    logger.warn("loanAssessmentService: tenantId not provided, falling back to 1");
    return 1;
  }
  return tenantId;
}
function isTenantSchemaError(e: unknown): boolean {
  const code = (e as { code?: string })?.code;
  const msg = String((e as { message?: string })?.message ?? (e as Error)?.message ?? "");
  return code === "P2021" || code === "P2022" || msg.includes("tenantId") || msg.includes("tenant_id") || msg.includes("does not exist");
}

class LoanEligibilityCalculator {
  constructor(
    private profile: {
      avgMonthlyIncome: number;
      avgMonthlyExpense: number;
      savingsRate: number;
      debtToIncomeRatio: number;
      incomeStabilityScore: number;
      creditScoreEstimate: number;
      totalStatements: number;
    },
    private requestedAmount: number,
  ) {}

  assess(interestRate = 10.5, tenureMonths = 24) {
    const { avgMonthlyIncome, savingsRate, debtToIncomeRatio, incomeStabilityScore, totalStatements } = this.profile;

    const stabilityScore = incomeStabilityScore >= 70 ? 30 : incomeStabilityScore >= 50 ? 25 : incomeStabilityScore >= 30 ? 15 : 5;
    const savingsScore = savingsRate >= 0.30 ? 25 : savingsRate >= 0.20 ? 20 : savingsRate >= 0.10 ? 15 : savingsRate >= 0.05 ? 10 : 0;
    const dtiScore = debtToIncomeRatio <= 0.20 ? 25 : debtToIncomeRatio <= 0.40 ? 15 : debtToIncomeRatio <= 0.60 ? 5 : 0;
    const durationScore = totalStatements >= 12 ? 20 : totalStatements >= 6 ? 10 : 0;

    const monthlyRate = (interestRate / 100) / 12;
    const numerator = this.requestedAmount * monthlyRate * Math.pow(1 + monthlyRate, tenureMonths);
    const denominator = Math.pow(1 + monthlyRate, tenureMonths) - 1;
    const monthlyEmi = denominator !== 0 ? numerator / denominator : this.requestedAmount / tenureMonths;
    const emiRatio = avgMonthlyIncome > 0 ? monthlyEmi / avgMonthlyIncome : 1;
    const affordabilityMultiplier = emiRatio <= 0.30 ? 1.0 : emiRatio <= 0.40 ? 0.7 : 0.3;

    const totalScore = stabilityScore + savingsScore + dtiScore + durationScore;
    const finalScore = Math.min(100, totalScore * affordabilityMultiplier);

    let riskLevel: string;
    let multiplier: number;
    if (finalScore >= 80) { riskLevel = 'LOW'; multiplier = 1.0; }
    else if (finalScore >= 60) { riskLevel = 'MEDIUM'; multiplier = 0.8; }
    else if (finalScore >= 40) { riskLevel = 'HIGH'; multiplier = 0.5; }
    else { riskLevel = 'REJECTED'; multiplier = 0.0; }

    const eligibleAmount = this.requestedAmount * multiplier;
    const maxMonthlyEmi = avgMonthlyIncome * 0.30;

    return {
      eligibilityScore: Math.round(finalScore * 100) / 100,
      riskLevel,
      requestedAmount: this.requestedAmount,
      eligibleAmount: Math.round(eligibleAmount * 100) / 100,
      maxMonthlyEmi: Math.round(maxMonthlyEmi * 100) / 100,
      recommendedTenure: riskLevel === 'REJECTED' ? null : riskLevel === 'HIGH' ? 60 : riskLevel === 'MEDIUM' ? 36 : 24,
      monthlyEmi: Math.round(monthlyEmi * 100) / 100,
      details: {
        incomeStability: { score: stabilityScore, maxScore: 30 },
        savingsRate: { score: savingsScore, maxScore: 25 },
        debtToIncome: { score: dtiScore, maxScore: 25 },
        statementHistory: { score: durationScore, maxScore: 20 },
        emiAffordability: Math.round(affordabilityMultiplier * 100) / 100,
      },
    };
  }
}

export const loanAssessmentService = {
  async assess(userId: string, requestedAmount: number, tenureMonths = 24, interestRate = 10.5, tenantId?: number) {
    const tid = resolveTid(tenantId);
    let profile: Awaited<ReturnType<typeof prisma.financialProfile.findFirst>>;
    try {
      profile = await prisma.financialProfile.findFirst({ where: { userId, tenantId: tid } });
    } catch (e) {
      if (isTenantSchemaError(e)) profile = await prisma.financialProfile.findUnique({ where: { userId } }) as never;
      else throw e;
    }

    if (!profile) {
      await statementParserService.recalculateFinancialProfile(userId);
      try {
        profile = await prisma.financialProfile.findFirst({ where: { userId, tenantId: tid } });
      } catch (e) {
        if (isTenantSchemaError(e)) profile = await prisma.financialProfile.findUnique({ where: { userId } }) as never;
        else throw e;
      }
    }

    if (!profile) {
      throw new AppError('No financial data found. Upload a bank statement first.', 404);
    }

    const calc = new LoanEligibilityCalculator({
      avgMonthlyIncome: Number(profile.avgMonthlyIncome || 0),
      avgMonthlyExpense: Number(profile.avgMonthlyExpense || 0),
      savingsRate: Number(profile.savingsRate || 0),
      debtToIncomeRatio: Number(profile.debtToIncomeRatio || 0),
      incomeStabilityScore: Number(profile.incomeStabilityScore || 0),
      creditScoreEstimate: Number(profile.creditScoreEstimate || 600),
      totalStatements: profile.totalStatements,
    }, requestedAmount);

    const result = calc.assess(interestRate, tenureMonths);

    let assessment: Awaited<ReturnType<typeof prisma.loanAssessment.create>>;
    try {
      assessment = await prisma.loanAssessment.create({
        data: {
          tenantId: tid,
          userId,
          requestedAmount,
          loanTenureMonths: tenureMonths,
          interestRateAssumed: interestRate,
          eligibleAmount: result.eligibleAmount,
          maxMonthlyEmi: result.maxMonthlyEmi,
          recommendedTenure: result.recommendedTenure,
          eligibilityScore: result.eligibilityScore,
          riskLevel: result.riskLevel,
          recommendation: this.generateRecommendation(result),
          assessmentDetails: result.details,
        },
      });
    } catch (e) {
      if (isTenantSchemaError(e)) {
        assessment = await prisma.loanAssessment.create({
          data: {
            userId,
            requestedAmount,
            loanTenureMonths: tenureMonths,
            interestRateAssumed: interestRate,
            eligibleAmount: result.eligibleAmount,
            maxMonthlyEmi: result.maxMonthlyEmi,
            recommendedTenure: result.recommendedTenure,
            eligibilityScore: result.eligibilityScore,
            riskLevel: result.riskLevel,
            recommendation: this.generateRecommendation(result),
            assessmentDetails: result.details,
          },
        });
      } else throw e;
    }

    logger.info({ userId, tenantId: tid, requestedAmount, riskLevel: result.riskLevel }, 'Loan assessment completed');

    return assessment;
  },

  /**
   * Best-effort derivation of HomeCredit/FinGuard features from the stored
   * profile, employment and financial-profile rows. Never throws.
   */
  async buildFinguardFeatures(userId: string, requestedAmount = 0): Promise<Record<string, number | string>> {
    const features: Record<string, number | string> = {};
    if (requestedAmount > 0) features.amt_credit = requestedAmount;

    type ProfileRow = { dateOfBirth?: Date | string | null };
    type EmploymentRow = {
      employmentStartDate?: Date | string | null;
      annualIncome?: number | string | null;
      occupationJobTitle?: string | null;
      dependentsCount?: number | null;
    };
    type FinancialRow = { avgMonthlyIncome?: number | string | null };

    let profile: ProfileRow | null = null;
    let employment: EmploymentRow | null = null;
    let financial: FinancialRow | null = null;

    try { profile = await prisma.profile.findUnique({ where: { userId } }) as unknown as ProfileRow | null; } catch { /* schema drift */ }
    try { employment = await prisma.employmentInfo.findUnique({ where: { userId } }) as unknown as EmploymentRow | null; } catch { /* schema drift */ }
    try { financial = await prisma.financialProfile.findFirst({ where: { userId } }) as unknown as FinancialRow | null; } catch { /* schema drift */ }

    if (profile?.dateOfBirth) {
      features.days_birth = -Math.floor((Date.now() - new Date(profile.dateOfBirth).getTime()) / 86400000);
    }
    if (employment?.employmentStartDate) {
      features.days_employed = -Math.floor((Date.now() - new Date(employment.employmentStartDate).getTime()) / 86400000);
    }

    const monthlyIncome = Number(financial?.avgMonthlyIncome ?? 0);
    const annualFromEmployment = Number(employment?.annualIncome ?? 0);
    const annualIncome = annualFromEmployment > 0 ? annualFromEmployment : monthlyIncome * 12;
    if (annualIncome > 0) features.amt_income_total = round2(annualIncome);

    if (employment?.occupationJobTitle) features.occupation_type = String(employment.occupationJobTitle);

    const dependents = Number(employment?.dependentsCount ?? 0);
    if (dependents > 0) {
      features.cnt_children = dependents;
      features.cnt_fam_members = dependents + 1;
    }

    return features;
  },

  /**
   * Heuristic assessment (unchanged) merged with the FinGuard ML probability.
   * eligibilityScore -= probability * 20 (max 20 point penalty), then the
   * risk level / eligible amount / recommendation are recomputed.
   * Falls back to the pure heuristic result when FinGuard is unavailable.
   */
  async assessWithFinguard(
    userId: string,
    requestedAmount: number,
    tenureMonths = 24,
    interestRate = 10.5,
    tenantId?: number,
  ) {
    const base = await this.assess(userId, requestedAmount, tenureMonths, interestRate, tenantId);

    let ml: FinguardResult | null = null;
    let features: FinguardInput | null = null;
    try {
      const derived = await this.buildFinguardFeatures(userId, requestedAmount);
      features = normalizeFinguardInput(derived) as unknown as FinguardInput;
    } catch (e) {
      logger.warn({ err: e, userId }, 'Insufficient data for FinGuard features, using heuristic only');
    }
    if (features) {
      try {
        ml = await finguardProxyService.evaluate(features);
      } catch (e) {
        logger.warn({ err: e, userId }, 'FinGuard ML evaluation failed, using heuristic only');
      }
    }

    if (!ml) {
      return { ...base, finguardAdjusted: false, finguard: null };
    }

    const probability = Number(ml.default_probability ?? 0);
    const penalty = probability * FINGUARD_PENALTY_WEIGHT;
    const baseScore = Number(base.eligibilityScore ?? 0);
    const eligibilityScore = round2(Math.max(0, baseScore - penalty));
    const riskLevel = riskLevelFromScore(eligibilityScore);
    const eligibleAmount = round2(requestedAmount * multiplierFor(riskLevel));
    const maxMonthlyEmi = round2(Number(base.maxMonthlyEmi ?? 0));
    const monthlyEmi = round2(Number(base.assessmentDetails && typeof base.assessmentDetails === 'object'
      ? ((base.assessmentDetails as { monthlyEmi?: number }).monthlyEmi ?? 0)
      : 0));

    const recommendation = this.generateRecommendation({
      riskLevel, eligibleAmount, eligibilityScore, maxMonthlyEmi, monthlyEmi,
    });

    const assessmentDetails = {
      ...(typeof base.assessmentDetails === 'object' && base.assessmentDetails !== null ? base.assessmentDetails : {}),
      heuristicScore: baseScore,
      finguard: {
        defaultProbability: probability,
        creditScore: ml.credit_score,
        riskBand: ml.risk_band,
        decision: ml.decision,
        modelVersion: ml.model_version,
        penaltyApplied: round2(penalty),
        penaltyWeight: FINGUARD_PENALTY_WEIGHT,
      },
    } as unknown as Prisma.InputJsonValue;

    try {
      await prisma.loanAssessment.update({
        where: { id: base.id },
        data: { eligibilityScore, riskLevel, eligibleAmount, recommendation, assessmentDetails },
      });
    } catch (e) {
      if (!isTenantSchemaError(e)) throw e;
      await prisma.loanAssessment.update({
        where: { id: base.id },
        data: { eligibilityScore, riskLevel, eligibleAmount, recommendation, assessmentDetails },
      });
    }

    logger.info(
      { userId, probability, baseScore, eligibilityScore, riskLevel },
      'Loan assessment adjusted with FinGuard ML probability',
    );

    return {
      ...base,
      eligibilityScore,
      riskLevel,
      eligibleAmount,
      recommendation,
      assessmentDetails,
      finguardAdjusted: true,
      finguard: {
        defaultProbability: probability,
        creditScore: ml.credit_score,
        riskBand: ml.risk_band,
        decision: ml.decision,
        modelVersion: ml.model_version,
        penaltyApplied: round2(penalty),
      },
    };
  },

  generateRecommendation(result: {
    riskLevel: string; eligibleAmount: number; eligibilityScore: number;
    maxMonthlyEmi: number; monthlyEmi: number;
  }): string {
    switch (result.riskLevel) {
      case 'REJECTED':
        return 'Unfortunately, you are not eligible for this loan. Consider improving your financial profile: increase income stability, reduce expenses, or provide more bank statements.';
      case 'HIGH':
        return `Conditional approval possible. We can approve up to ₹${result.eligibleAmount.toLocaleString('en-IN')} (${result.eligibilityScore.toFixed(0)}% score). Consider a longer tenure or lower amount.`;
      case 'MEDIUM':
        return `Likely approval for ₹${result.eligibleAmount.toLocaleString('en-IN')}. Current profile shows moderate risk. Monthly EMI capacity: ₹${result.maxMonthlyEmi.toLocaleString('en-IN')}.`;
      case 'LOW':
        return `Strong approval for ₹${result.eligibleAmount.toLocaleString('en-IN')}. Your financial profile is healthy. Recommended tenure: 24-36 months.`;
      default:
        return 'Assessment completed.';
    }
  },

  async getHistory(userId: string, tenantId?: number) {
    const tid = resolveTid(tenantId);
    try {
      return prisma.loanAssessment.findMany({
        where: { userId, tenantId: tid },
        orderBy: { createdAt: 'desc' },
        take: 20,
      });
    } catch (e) {
      if (isTenantSchemaError(e)) return prisma.loanAssessment.findMany({ where: { userId }, orderBy: { createdAt: 'desc' }, take: 20 });
      throw e;
    }
  },
};
