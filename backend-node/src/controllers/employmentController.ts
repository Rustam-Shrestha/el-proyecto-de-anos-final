import type { Request, Response, NextFunction } from 'express';
import { employmentService } from '@/services/employmentService';
import { portfolioVerificationService } from '@/services/portfolioVerificationService';
import { auditService } from '@/services/auditService';
import { apiResponse } from '@/utils/apiResponse';

export const saveEmployment = async (
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

    const data = req.body;

    const result = await employmentService.saveEmploymentInfo(user.id, {
      employmentStatus: data.employmentStatus,
      occupationJobTitle: data.occupationJobTitle,
      employerName: data.employerName,
      employmentStartDate: data.employmentStartDate,
      monthlyGrossIncome: data.monthlyGrossIncome ? Number(data.monthlyGrossIncome) : undefined,
      annualIncome: data.annualIncome ? Number(data.annualIncome) : undefined,
      dependentsCount: data.dependentsCount ? Number(data.dependentsCount) : undefined,
      incomeSourceType: data.incomeSourceType,
      businessName: data.businessName,
      businessType: data.businessType,
      institutionName: data.institutionName,
      educationLevel: data.educationLevel,
      expectedGraduationDate: data.expectedGraduationDate,
    });

    await employmentService.calculateTenure(user.id);

    await portfolioVerificationService.calculatePortfolioMetrics(user.id);

    await auditService.log({
      userId: user.id,
      action: 'SAVE_EMPLOYMENT',
      metadata: {
        employmentStatus: data.employmentStatus,
        incomeSourceType: data.incomeSourceType,
      },
      ip: req.ip || undefined,
      userAgent: req.headers['user-agent'],
    });

    res.status(201).json(
      apiResponse.success('Employment information saved', result)
    );
  } catch (error) {
    next(error);
  }
};

export const getEmployment = async (
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

    const result = await employmentService.getEmploymentInfo(user.id);

    if (!result) {
      res.json(apiResponse.success('No employment information found', null));
      return;
    }

    res.json(apiResponse.success('Employment information retrieved', result));
  } catch (error) {
    next(error);
  }
};

export const adminGetUserEmployment = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { userId } = req.params as { userId: string };

    const result = await employmentService.getEmploymentInfo(userId);

    if (!result) {
      res.json(apiResponse.success('No employment information found', null));
      return;
    }

    res.json(apiResponse.success('Employment information retrieved', result));
  } catch (error) {
    next(error);
  }
};
