import type { Request, Response, NextFunction } from 'express';
import { homeCredtFeatureService } from '@/services/homeCreditFeatureService';
import { riskScoringService } from '@/services/riskScoringService';
import { auditService } from '@/services/auditService';
import { apiResponse } from '@/utils/apiResponse';

export const calculateRiskScore = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      return res.status(401).json(apiResponse.error('Unauthorized', 401));
    }

    const { requestedLoanAmount, loanTenureMonths } = req.body;

    const features = await homeCredtFeatureService.calculateAllFeatures(
      req.user.id,
      requestedLoanAmount,
      loanTenureMonths
    );

    const { riskScore, riskLevel } = riskScoringService.calculateRiskScoreRuleBased(
      features.derivedFeatures
    );

    res.json(apiResponse.success('Risk score calculated', {
      requestedLoanAmount,
      loanTenureMonths,
      calculatedEMI: features.homeCredtFeatures.AMT_ANNUITY,
      riskScore,
      riskLevel,
      homeCredtFeatures: features.homeCredtFeatures,
      derivedFeatures: features.derivedFeatures,
      approvalRecommendation: riskLevel === 'LOW' ? 'AUTO_APPROVE' : 'MANUAL_REVIEW'
    }));

    await auditService.log({
      userId: req.user.id,
      action: 'CALCULATE_RISK_SCORE',
      metadata: { requestedLoanAmount, riskScore, riskLevel },
      ip: req.ip,
      userAgent: req.get('user-agent')
    });
  } catch (error) {
    next(error);
  }
};
