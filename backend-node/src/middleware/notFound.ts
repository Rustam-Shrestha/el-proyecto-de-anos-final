import type { Request, Response } from 'express';
import { apiResponse } from '@/utils/apiResponse';

export const notFoundHandler = (_req: Request, res: Response): void => {
  res.status(404).json(apiResponse.error('Route not found', 404));
};
