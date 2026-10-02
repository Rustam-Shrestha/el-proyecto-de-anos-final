import { prisma } from '@/config/database';
import { logger } from '@/config/logger';
import { AppError } from '@/utils/AppError';
import { statementParserService } from './statementParserService';

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
  async assess(userId: string, requestedAmount: number, tenureMonths = 24, interestRate = 10.5) {
    let profile = await prisma.financialProfile.findUnique({ where: { userId } });

    if (!profile) {
      await statementParserService.recalculateFinancialProfile(userId);
      profile = await prisma.financialProfile.findUnique({ where: { userId } });
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

    const assessment = await prisma.loanAssessment.create({
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

    logger.info({ userId, requestedAmount, riskLevel: result.riskLevel }, 'Loan assessment completed');

    return assessment;
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

  async getHistory(userId: string) {
    return prisma.loanAssessment.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 20,
    });
  },
};
