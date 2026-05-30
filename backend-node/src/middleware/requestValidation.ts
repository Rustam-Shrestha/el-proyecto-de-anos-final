import type { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { AppError } from '@/utils/AppError';

/**
 * Zod validation middleware factory
 * Validates request body, params, and query against provided schema
 * Catches validation errors and passes to error handler
 *
 * Usage:
 *   router.post('/users', validate(userSchema), handler);
 */
export const validate = (schema: z.ZodSchema) => {
  return async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
    try {
      const result = await schema.parseAsync({
        body: req.body,
        params: req.params,
        query: req.query,
      });

      // Never overwrite req.body/req.params/req.query here.
      // In Express, those values can be getter-backed and mutating them can crash at runtime.
      // Store validated/transformed data on a separate property so handlers can opt in safely.
      req.validated = result;
      _res.locals.validated = result;

      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        const formatted = error.flatten();
        return next(new AppError('Validation error', 400, formatted));
      }
      return next(error);
    }
  };
};
