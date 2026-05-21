import type { Request, Response } from 'express';

export const healthController = (_req: Request, res: Response): void => {
  res.json({
    success: true,
    message: 'Server is healthy',
    timestamp: new Date().toISOString(),
  });
};
