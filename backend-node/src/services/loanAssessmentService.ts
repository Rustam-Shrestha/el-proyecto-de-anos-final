import { prisma } from '@/config/database';
import { logger } from '@/config/logger';
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
    const { avgMonthlyIncome, savingsRate, debtToIncomeRatio, incomeStabilityScore, creditScoreEstimate } = this.profile;

    const monthlyRate = (interestRate / 100) / 12;
    const n = Math.max(6, tenureMonths);

    // Standard Fixed Obligation to Income Ratio (FOIR) capacity: 45% of monthly income
    const maxFoir = 0.45;
    const existingDti = Math.min(0.8, Math.max(0, debtToIncomeRatio || 0.1));
    const maxMonthlyEmi = Math.max(0, avgMonthlyIncome * maxFoir * (1 - existingDti));

    // Present Value (PV) calculation for maximum loan borrowing capacity
    const pvFactor = monthlyRate > 0 && n > 0
      ? (Math.pow(1 + monthlyRate, n) - 1) / (monthlyRate * Math.pow(1 + monthlyRate, n))
      : n;
    const maxLoanCapacity = Math.max(0, maxMonthlyEmi * pvFactor);

    // Actual EMI for requested amount
    const numerator = this.requestedAmount * monthlyRate * Math.pow(1 + monthlyRate, n);
    const denominator = Math.pow(1 + monthlyRate, n) - 1;
    const monthlyEmi = denominator > 0 ? numerator / denominator : (this.requestedAmount / n);

    const capacityRatio = maxLoanCapacity > 0 ? this.requestedAmount / maxLoanCapacity : 2;

    // Dynamic Multi-Factor Scoring (0 to 100)
    const creditWeight = Math.min(30, Math.max(5, ((creditScoreEstimate || 650) / 850) * 30));
    const stabilityWeight = Math.min(25, Math.max(5, ((incomeStabilityScore || 60) / 100) * 25));
    const savingsWeight = Math.min(15, Math.max(0, (Math.min(savingsRate || 0.2, 0.4) / 0.4) * 15));

    // Affordability factor: full 30 points if requested amount is under 60% of capacity, scaling down
    let affordabilityWeight = 30;
    if (capacityRatio > 1.2) {
      affordabilityWeight = Math.max(0, 30 - (capacityRatio - 1.2) * 40);
    } else if (capacityRatio > 0.7) {
      affordabilityWeight = 30 - (capacityRatio - 0.7) * 20;
    }

    const finalScore = Math.min(100, Math.max(10, creditWeight + stabilityWeight + savingsWeight + affordabilityWeight));

    let riskLevel: string;
    if (finalScore >= 75) riskLevel = 'LOW';
    else if (finalScore >= 55) riskLevel = 'MEDIUM';
    else if (finalScore >= 35) riskLevel = 'HIGH';
    else riskLevel = 'REJECTED';

    // Eligible amount: if within capacity, requested amount is fully eligible; if exceeded, capped at capacity
    let eligibleAmount = 0;
    if (riskLevel === 'LOW' || riskLevel === 'MEDIUM') {
      eligibleAmount = Math.min(this.requestedAmount, Math.round(maxLoanCapacity / 1000) * 1000);
    } else if (riskLevel === 'HIGH') {
      eligibleAmount = Math.min(this.requestedAmount * 0.7, Math.round(maxLoanCapacity * 0.7 / 1000) * 1000);
    }

    return {
      eligibilityScore: Math.round(finalScore * 10) / 10,
      riskLevel,
      requestedAmount: this.requestedAmount,
      eligibleAmount: Math.round(eligibleAmount),
      maxMonthlyEmi: Math.round(maxMonthlyEmi),
      maxLoanCapacity: Math.round(maxLoanCapacity),
      recommendedTenure: riskLevel === 'REJECTED' ? null : capacityRatio > 0.8 ? Math.min(60, n + 12) : n,
      monthlyEmi: Math.round(monthlyEmi),
      details: {
        creditScore: Math.round(creditWeight),
        incomeStability: Math.round(stabilityWeight),
        savingsRate: Math.round(savingsWeight),
        affordability: Math.round(affordabilityWeight),
        capacityRatio: Math.round(capacityRatio * 100) / 100,
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

    // If no financial profile or income is 0, attempt to look up KYC or employment income
    if (!profile || Number(profile.avgMonthlyIncome || 0) <= 0) {
      try {
        const [kyc, emp, prof] = await Promise.all([
          prisma.kycApplication.findFirst({
            where: { userId, status: 'APPROVED' },
            orderBy: { createdAt: 'desc' },
          }).catch(() => null),
          prisma.employmentInfo.findUnique({ where: { userId } }).catch(() => null),
          prisma.profile.findUnique({ where: { userId } }).catch(() => null),
        ]);

        const monthlyFromKyc = Number((kyc as unknown as { confirmedMonthlyIncome?: number })?.confirmedMonthlyIncome || 0);
        const annualFromEmp = Number(emp?.annualIncome || 0);
        const monthlyFromEmp = annualFromEmp > 0 ? annualFromEmp / 12 : 0;
        const monthlyFromProf = Number((prof as unknown as { monthlyIncome?: number })?.monthlyIncome || 0);

        const bestMonthlyIncome = monthlyFromKyc || monthlyFromEmp || monthlyFromProf;

        if (bestMonthlyIncome > 0) {
          profile = {
            totalStatements: 1,
            avgMonthlyIncome: bestMonthlyIncome,
            avgMonthlyExpense: bestMonthlyIncome * 0.5,
            savingsRate: 0.3,
            debtToIncomeRatio: 0.15,
            incomeStabilityScore: 65,
            creditScoreEstimate: 680,
          } as unknown as NonNullable<typeof profile>;
        }
      } catch (err) {
        logger.warn({ err, userId }, 'Could not look up supplemental profile data for assessment');
      }
    }

    const needsData = !profile || Number(profile.avgMonthlyIncome || 0) <= 0;
    if (!profile) {
      profile = {
        totalStatements: 0,
        avgMonthlyIncome: 0,
        avgMonthlyExpense: 0,
        savingsRate: 0,
        debtToIncomeRatio: 0,
        incomeStabilityScore: 0,
        creditScoreEstimate: 600,
      } as unknown as NonNullable<typeof profile>;
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
    const recommendation = needsData
      ? 'No financial data found. Upload a bank statement first, then request a new assessment.'
      : this.generateRecommendation(result);

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
          recommendation,
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
            recommendation,
            assessmentDetails: result.details,
          },
        });
      } else if ((e as { code?: string })?.code === 'P2003') {
        // Non-customer identity (e.g. superadmin token sub "sc-1" is a
        // supercontroller row, not an auth.User): FK can't persist, so return
        // the computed assessment ephemerally instead of 500.
        logger.warn({ userId, requestedAmount }, 'assess: unknown user, returning ephemeral assessment');
        return {
          id: `ephemeral-${Date.now()}`,
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
          recommendation,
          assessmentDetails: result.details,
          createdAt: new Date(),
          updatedAt: new Date(),
          persisted: false,
        } as unknown as typeof assessment;
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
    if (requestedAmount > 0) {
      features.amt_credit = requestedAmount;
      features.amt_goods_price = requestedAmount;
    }

    type ProfileRow = { dateOfBirth?: Date | string | null };
    type EmploymentRow = {
      employmentStartDate?: Date | string | null;
      annualIncome?: number | string | null;
      monthlyGrossIncome?: number | string | null;
      occupationJobTitle?: string | null;
      businessType?: string | null;
      educationLevel?: string | null;
      incomeStabilityScore?: number | null;
      dependentsCount?: number | null;
    };
    type FinancialRow = {
      avgMonthlyIncome?: number | string | null;
      incomeStabilityScore?: number | null;
    };

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
    const annualFromEmployment = Number(employment?.annualIncome ?? (employment?.monthlyGrossIncome ? Number(employment.monthlyGrossIncome) * 12 : 0));
    const annualIncome = annualFromEmployment > 0 ? annualFromEmployment : monthlyIncome * 12;
    if (annualIncome > 0) features.amt_income_total = round2(annualIncome);

    if (employment?.occupationJobTitle) features.occupation_type = String(employment.occupationJobTitle);
    if (employment?.businessType) features.organization_type = String(employment.businessType);
    if (employment?.educationLevel) features.name_education_type = String(employment.educationLevel);

    const stability = employment?.incomeStabilityScore ?? financial?.incomeStabilityScore;
    if (stability && Number(stability) > 0) {
      features.ext_source_2 = Number(stability) / 100;
    }

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
    const hardRuleTriggered = Boolean(ml.hard_rule_triggered);
    const reasonCodes = Array.isArray(ml.reason_codes) ? ml.reason_codes : [];
    const penalty = probability * FINGUARD_PENALTY_WEIGHT;
    const baseScore = Number(base.eligibilityScore ?? 0);
    let eligibilityScore = round2(Math.max(0, baseScore - penalty));
    let riskLevel = riskLevelFromScore(eligibilityScore);
    let eligibleAmount = round2(requestedAmount * multiplierFor(riskLevel));

    if (hardRuleTriggered || ml.recommendation === 'REJECT' || ml.decision === 'Decline') {
      riskLevel = 'REJECTED';
      eligibleAmount = 0;
      eligibilityScore = Math.min(eligibilityScore, 35);
    }

    const maxMonthlyEmi = round2(Number(base.maxMonthlyEmi ?? 0));
    const monthlyEmi = round2(Number(base.assessmentDetails && typeof base.assessmentDetails === 'object'
      ? ((base.assessmentDetails as { monthlyEmi?: number }).monthlyEmi ?? 0)
      : 0));

    let recommendation: string;
    if (hardRuleTriggered && reasonCodes.length > 0) {
      recommendation = `Application rejected by pre-model hard business rules: ${reasonCodes.join(', ')}.`;
    } else {
      recommendation = this.generateRecommendation({
        riskLevel, eligibleAmount, eligibilityScore, maxMonthlyEmi, monthlyEmi,
      });
    }

    const assessmentDetails = {
      ...(typeof base.assessmentDetails === 'object' && base.assessmentDetails !== null ? base.assessmentDetails : {}),
      heuristicScore: baseScore,
      finguard: {
        defaultProbability: probability,
        creditScore: ml.credit_score,
        riskBand: ml.risk_band,
        decision: ml.decision,
        decisionTier: ml.decision_tier,
        recommendation: ml.recommendation,
        hardRuleTriggered,
        reasonCodes,
        modelVersion: ml.model_version,
        pipelineVersion: ml.pipeline_version ?? '1.4.0',
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
      { userId, probability, baseScore, eligibilityScore, riskLevel, hardRuleTriggered },
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
        decisionTier: ml.decision_tier,
        recommendation: ml.recommendation,
        hardRuleTriggered,
        reasonCodes,
        modelVersion: ml.model_version,
        pipelineVersion: ml.pipeline_version ?? '1.4.0',
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
