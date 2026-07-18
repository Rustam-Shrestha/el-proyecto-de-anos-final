import type { Request, Response, NextFunction } from 'express';
import { employmentService } from '@/services/employmentService';
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

    const { occupationJobTitle, employmentStartDate, annualIncome, employerName, dependentsCount } = req.body;

    const result = await employmentService.saveEmploymentInfo(user.id, {
      occupationJobTitle,
      employmentStartDate,
      annualIncome: Number(annualIncome),
      employerName,
      dependentsCount: dependentsCount ? Number(dependentsCount) : undefined,
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
