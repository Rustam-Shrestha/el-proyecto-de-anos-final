import type { Request, Response, NextFunction } from 'express';
import { loanAssessmentService } from '@/services/loanAssessmentService';
import { auditService } from '@/services/auditService';
import { apiResponse } from '@/utils/apiResponse';

export const assessLoan = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const user = req.user;
    if (!user) {
      res.status(401).json(apiResponse.error('Authentication required', 401));
      return;
    }

    const { requestedAmount, loanTenureMonths = 24, interestRateAssumed = 10.5 } = req.body;

    const result = await loanAssessmentService.assess(
      user.id,
      Number(requestedAmount),
      Number(loanTenureMonths),
      Number(interestRateAssumed),
    );

    await auditService.log({
      userId: user.id,
      action: 'LOAN_ASSESSMENT',
      metadata: {
        assessmentId: result.id,
        requestedAmount,
        riskLevel: result.riskLevel,
        eligibilityScore: result.eligibilityScore,
      },
      ip: req.ip || undefined,
      userAgent: req.headers['user-agent'],
    });

    res.status(201).json(apiResponse.success('Loan assessment completed', result));
  } catch (error) {
    next(error);
  }
};

export const getLoanAssessmentHistory = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const user = req.user;
    if (!user) {
      res.status(401).json(apiResponse.error('Authentication required', 401));
      return;
    }

    const history = await loanAssessmentService.getHistory(user.id);
    res.json(apiResponse.success('Loan assessment history retrieved', history));
  } catch (error) {
    next(error);
  }
};
