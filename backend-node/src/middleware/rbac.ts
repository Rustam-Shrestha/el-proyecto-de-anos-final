import type { Request, Response, NextFunction } from 'express';
import { AppError } from '@/utils/AppError';
import { logger } from '@/config/logger';

/**
 * Role-Based Access Control (RBAC) middleware factory
 * Verifies user has one of the allowed roles
 *
 * Usage:
 *   router.get('/admin', authenticate, authorize('ADMIN'), handler);
 *   router.post('/approve', authenticate, authorize('ADMIN', 'REVIEWER'), handler);
 *
 * Expected req.user to be set by authenticate middleware
 */
export const authorize = (...allowedRoles: string[]) => {
  return (req: Request, _res: Response, next: NextFunction): void => {
    try {
      // Ensure user is authenticated (should be enforced by previous middleware)
      if (!req.user) {
        logger.warn('Authorization check failed - no user in request');
        return next(new AppError('Authentication required', 401));
      }

      // Check if user's role is in allowed list
      if (!allowedRoles.includes(req.user.role)) {
        logger.warn(
          { userId: req.user.id, userRole: req.user.role, requiredRoles: allowedRoles },
          'Authorization failed - insufficient permissions'
        );
        return next(new AppError('Insufficient permissions for this action', 403));
      }

      // User is authorized, proceed
      next();
    } catch (error) {
      logger.error({ err: error }, 'Unexpected error in authorization middleware');
      next(new AppError('Authorization failed', 500));
    }
  };
};
