import type { Request, Response, NextFunction } from 'express';
import { apiResponse } from '@/utils/apiResponse';
import { logger } from '@/config/logger';
import { env } from '@/config/env';
import { AppError } from '@/utils/AppError';

export const errorHandler = (
  error: Error | AppError,
  _req: Request,
  res: Response,
  _next: NextFunction
): void => {
  let statusCode = 500;
  let message = 'Internal server error';
  let details: unknown;

  if (error instanceof AppError) {
    statusCode = error.statusCode;
    message = error.message;
    details = error.details;
  } else if (error instanceof SyntaxError && 'body' in error) {
    statusCode = 400;
    message = 'Invalid request body';
  } else {
    logger.error({ err: error }, 'Unhandled error');
  }

  const response = apiResponse.error(
    message,
    statusCode,
    env.NODE_ENV === 'development' ? details : undefined
  );

  res.status(statusCode).json(response);
};
