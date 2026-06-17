import type { Request, Response, NextFunction } from 'express';
import { employmentService } from '@/services/employmentService';
import { apiResponse } from '@/utils/apiResponse';

export const saveEmployment = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const user = (req as any).user;
    if (!user) {
      res.status(401).json(apiResponse.error('Authentication required', 401));
      return;
    }

    const { jobTitle, employmentStartDate, declaredAnnualIncome } = req.body;

    const result = await employmentService.saveEmploymentInfo(user.id, {
      jobTitle,
      employmentStartDate,
      declaredAnnualIncome: Number(declaredAnnualIncome),
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
    const user = (req as any).user;
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
