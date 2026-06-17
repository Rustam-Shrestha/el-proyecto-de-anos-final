import type { Request, Response, NextFunction } from 'express';
import { authService } from '@/services/authService';
import { tokenService } from '@/services/tokenService';
import { auditService } from '@/services/auditService';
import { apiResponse } from '@/utils/apiResponse';
import { AppError } from '@/utils/AppError';

/**
 * POST /api/v1/auth/register
 * Register a new user
 */
export const register = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { email, password } = req.body;

    const result = await authService.register({ email, password });

    // Log registration
    await auditService.log({
      userId: result.user.id,
      action: 'REGISTER',
      metadata: { email },
      ip: req.ip || undefined,
      userAgent: req.headers['user-agent'],
    });

    res.status(201).json(
      apiResponse.success('User registered successfully. Please verify your email.', result)
    );
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/v1/auth/login
 * Login user
 */
export const login = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { email, password } = req.body;

    const result = await authService.login({ email, password });

    // Log login
    await auditService.log({
      userId: result.user.id,
      action: 'LOGIN',
      metadata: { email },
      ip: req.ip || undefined,
      userAgent: req.headers['user-agent'],
    });

    res.json(apiResponse.success('Login successful', result));
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/v1/auth/logout
 * Logout user (revoke refresh token)
 */
export const logout = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json(apiResponse.error('Authentication required', 401));
      return;
    }

    const userId = req.user.id;

    await authService.logout(userId);

    // Log logout
    await auditService.log({
      userId,
      action: 'LOGOUT',
      ip: req.ip || undefined,
      userAgent: req.headers['user-agent'],
    });

    res.json(apiResponse.success('Logged out successfully'));
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/v1/auth/refresh
 * Refresh access token
 */
export const refreshAccessToken = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      res.status(400).json(apiResponse.error('Refresh token is required', 400));
      return;
    }

    const result = await authService.refreshToken(refreshToken);

    // Log token refresh (creates new session)
    await auditService.log({
      userId: result.user?.id || null,
      action: 'REFRESH_TOKEN',
      ip: req.ip || undefined,
      userAgent: req.headers['user-agent'],
    });

    res.json(apiResponse.success('Token refreshed', result));
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/v1/auth/verify-email
 * Verify email address
 */
export const verifyEmail = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { token } = req.body;

    // Extract user ID from verification token before service call
    const payload = tokenService.verifyVerificationToken(token);
    if (!payload) {
      return next(new AppError('Invalid or expired verification token', 401));
    }

    // Verify email (validates token again and updates user)
    await authService.verifyEmail(token);

    // Log email verification with userId from token payload
    await auditService.log({
      userId: payload.sub,
      action: 'VERIFY_EMAIL',
      metadata: { email: payload.email },
      ip: req.ip || undefined,
      userAgent: req.headers['user-agent'],
    });

    res.json(apiResponse.success('Email verified successfully'));
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/v1/auth/forgot-password
 * Send password reset email
 */
export const forgotPassword = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { email } = req.body;

    await authService.forgotPassword(email);

    // Always return success (don't reveal if email exists)
    res.json(apiResponse.success('If the email exists, a password reset link has been sent'));
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/v1/auth/reset-password
 * Reset password using token
 */
export const resetPassword = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { token, password } = req.body;

    await authService.resetPassword(token, password);

    // Log password reset
    await auditService.log({
      userId: null,
      action: 'RESET_PASSWORD',
      ip: req.ip || undefined,
      userAgent: req.headers['user-agent'],
    });

    res.json(apiResponse.success('Password reset successfully. Please login with your new password.'));
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/v1/auth/change-password
 * Change password (authenticated)
 */
export const changePassword = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json(apiResponse.error('Authentication required', 401));
      return;
    }

    const { currentPassword, newPassword } = req.body;

    const userId = req.user.id;

    await authService.changePassword(userId, currentPassword, newPassword);

    // Log password change
    await auditService.log({
      userId,
      action: 'CHANGE_PASSWORD',
      ip: req.ip || undefined,
      userAgent: req.headers['user-agent'],
    });

    res.json(apiResponse.success('Password changed successfully'));
  } catch (error) {
    next(error);
  }
};
