import type { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '@/config/env';
import { AppError } from '@/utils/AppError';
import { logger } from '@/config/logger';

interface JwtPayload {
  sub: string;
  email: string;
  role: string;
  iat?: number;
  exp?: number;
}

/**
 * Authentication middleware
 * Extracts and verifies JWT token from Authorization header
 * Attaches user info to req.user
 *
 * Expected header format: Authorization: Bearer <token>
 *
 * Usage:
 *   router.get('/protected', authenticate, handler);
 */
export const authenticate = (req: Request, _res: Response, next: NextFunction): void => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader?.startsWith('Bearer ')) {
      logger.debug('Missing or invalid authorization header');
      return next(new AppError('Missing or invalid authorization header', 401));
    }

    const token = authHeader.slice(7); // Remove 'Bearer ' prefix

    try {
      const decoded = jwt.verify(token, env.JWT_ACCESS_SECRET) as JwtPayload;

      // Attach user to request
      req.user = {
        id: decoded.sub,
        email: decoded.email,
        role: decoded.role,
      };

      next();
    } catch (jwtError) {
      if (jwtError instanceof jwt.TokenExpiredError) {
        logger.debug('JWT token expired');
        return next(new AppError('Token expired', 401));
      }
      if (jwtError instanceof jwt.JsonWebTokenError) {
        logger.debug('Invalid JWT token');
        return next(new AppError('Invalid token', 401));
      }
      throw jwtError;
    }
  } catch (error) {
    logger.error({ err: error }, 'Unexpected error in authentication middleware');
    next(new AppError('Authentication failed', 500));
  }
};
