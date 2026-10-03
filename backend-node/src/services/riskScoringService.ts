export const riskScoringService = {
  calculateRiskScoreRuleBased(derivedFeatures: {
    CREDIT_INCOME_PERCENT: number;
    ANNUITY_INCOME_PERCENT: number;
    INCOME_PER_PERSON: number;
    DAYS_EMPLOYED_PERCENT: number;
    EMPLOYMENT_STABILITY: number;
    AGE_CATEGORY: number;
  }) {
    let riskScore = 0;

    // 1. CREDIT_INCOME_PERCENT (Loan amount vs annual income)
    if (derivedFeatures.CREDIT_INCOME_PERCENT > 300) riskScore += 40;
    else if (derivedFeatures.CREDIT_INCOME_PERCENT > 200) riskScore += 25;
    else if (derivedFeatures.CREDIT_INCOME_PERCENT > 100) riskScore += 10;

    // 2. ANNUITY_INCOME_PERCENT (Annual payment vs annual income)
    if (derivedFeatures.ANNUITY_INCOME_PERCENT > 50) riskScore += 30;
    else if (derivedFeatures.ANNUITY_INCOME_PERCENT > 30) riskScore += 20;
    else if (derivedFeatures.ANNUITY_INCOME_PERCENT > 15) riskScore += 5;

    // 3. DAYS_EMPLOYED_PERCENT (Employment history vs age)
    if (derivedFeatures.DAYS_EMPLOYED_PERCENT < 10) riskScore += 35;
    else if (derivedFeatures.DAYS_EMPLOYED_PERCENT < 25) riskScore += 20;
    else if (derivedFeatures.DAYS_EMPLOYED_PERCENT < 40) riskScore += 10;

    // 4. AGE_CATEGORY (Age risk)
    if (derivedFeatures.AGE_CATEGORY === 0) riskScore += 15;

    // 5. INCOME_PER_PERSON (Annual income per family member - NPR scale)
    if (derivedFeatures.INCOME_PER_PERSON < 50000) riskScore += 15;

    // 6. EMPLOYMENT_STABILITY
    if (!derivedFeatures.EMPLOYMENT_STABILITY) riskScore += 20;

    riskScore = Math.min(100, Math.max(0, riskScore));

    let riskLevel: string;
    if (riskScore < 40) riskLevel = 'LOW';
    else if (riskScore < 70) riskLevel = 'MEDIUM';
    else riskLevel = 'HIGH';

    return { riskScore, riskLevel };
  }
};
