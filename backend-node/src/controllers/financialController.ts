import type { Request, Response, NextFunction } from 'express';
import { financialProfileService } from '@/services/financialProfileService';
import { apiResponse } from '@/utils/apiResponse';

export const getProfile = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const user = req.user;
    if (!user) {
      res.status(401).json(apiResponse.error('Authentication required', 401));
      return;
    }

    const profile = await financialProfileService.getProfile(user.id);
    res.json(apiResponse.success('Financial profile retrieved', profile));
  } catch (error) {
    next(error);
  }
};

export const recalculateProfile = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const user = req.user;
    if (!user) {
      res.status(401).json(apiResponse.error('Authentication required', 401));
      return;
    }

    const profile = await financialProfileService.recalculate(user.id);
    res.json(apiResponse.success('Financial profile recalculated', profile));
  } catch (error) {
    next(error);
  }
};

export const getMonthlyTrends = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const user = req.user;
    if (!user) {
      res.status(401).json(apiResponse.error('Authentication required', 401));
      return;
    }

    const trends = await financialProfileService.getMonthlyTrends(user.id);
    res.json(apiResponse.success('Monthly trends retrieved', trends));
  } catch (error) {
    next(error);
  }
};

export const getCategoryBreakdown = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const user = req.user;
    if (!user) {
      res.status(401).json(apiResponse.error('Authentication required', 401));
      return;
    }

    const breakdown = await financialProfileService.getCategoryBreakdown(user.id);
    res.json(apiResponse.success('Category breakdown retrieved', breakdown));
  } catch (error) {
    next(error);
  }
};
