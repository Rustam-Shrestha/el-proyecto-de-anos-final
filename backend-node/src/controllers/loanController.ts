import type { Request, Response, NextFunction } from 'express';
import { loanService } from '@/services/loanService';
import { auditService } from '@/services/auditService';
import { apiResponse } from '@/utils/apiResponse';
import { paginate } from '@/utils/pagination';
import { LoanStatus, LoanPurpose } from '@prisma/client';

export const applyForLoan = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const user = req.user;
    if (!user) {
      res.status(401).json(apiResponse.error('Authentication required', 401));
      return;
    }

    const { requestedAmount, tenureMonths, purpose } = req.body;

    const result = await loanService.applyForLoan(user.id, {
      requestedAmount: Number(requestedAmount),
      tenureMonths: Number(tenureMonths),
      purpose: purpose as LoanPurpose,
    });

    await auditService.log({
      userId: user.id,
      action: 'LOAN_APPLY',
      metadata: {
        loanId: result.id,
        requestedAmount,
        tenureMonths,
        purpose,
        riskScore: result.riskScore,
        riskLevel: result.riskLevel,
      },
      ip: req.ip || undefined,
      userAgent: req.headers['user-agent'],
    });

    res.status(201).json(
      apiResponse.success('Loan application submitted successfully', result)
    );
  } catch (error) {
    next(error);
  }
};

export const getLoan = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const user = req.user;
    if (!user) {
      res.status(401).json(apiResponse.error('Authentication required', 401));
      return;
    }

    const { id } = req.params as { id: string };

    const loan = await loanService.getLoanById(id, user.id, user.role);

    res.json(apiResponse.success('Loan application retrieved', loan));
  } catch (error) {
    next(error);
  }
};

export const listLoans = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const user = req.user;
    if (!user) {
      res.status(401).json(apiResponse.error('Authentication required', 401));
      return;
    }

    const { take, page, limit } = paginate(req.query);
    const status = (req.query.status as string) || undefined;
    const userId = (req.query.userId as string) || undefined;

    const { loans, total } = await loanService.listLoans(
      {
        status: status as LoanStatus | undefined,
        userId: user.role === 'USER' ? user.id : userId,
        page,
        limit: take,
      },
      user.role,
      user.id
    );

    res.json(
      apiResponse.paginated('Loan applications listed', loans, page, limit, total)
    );
  } catch (error) {
    next(error);
  }
};

export const reviewLoan = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const user = req.user;
    if (!user) {
      res.status(401).json(apiResponse.error('Authentication required', 401));
      return;
    }

    const { id } = req.params as { id: string };
    const { action, notes } = req.body;

    const result = await loanService.reviewLoan(
      id,
      user.id,
      action as 'APPROVED' | 'REJECTED',
      notes
    );

    const auditAction = action === 'APPROVED' ? 'APPROVE_LOAN' : 'REJECT_LOAN';

    await auditService.log({
      userId: user.id,
      action: auditAction,
      metadata: {
        loanId: id,
        targetUserId: result.userId,
        notes,
      },
      ip: req.ip || undefined,
      userAgent: req.headers['user-agent'],
    });

    res.json(apiResponse.success('Loan application reviewed', result));
  } catch (error) {
    next(error);
  }
};
