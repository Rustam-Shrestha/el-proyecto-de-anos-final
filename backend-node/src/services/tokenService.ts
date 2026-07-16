import jwt from 'jsonwebtoken';
import { env } from '@/config/env';

export interface TokenPayload {
  sub: string;
  email: string;
  role: string;
  iat?: number;
  exp?: number;
}

export const tokenService = {
  /**
   * Generate access token (short-lived, 15 minutes)
   */
  generateAccessToken(userId: string, email: string, role: string): string {
    return jwt.sign(
      { sub: userId, email, role },
      env.JWT_ACCESS_SECRET,
      { expiresIn: env.JWT_ACCESS_TTL, algorithm: 'HS256' }
    );
  },

  /**
   * Generate refresh token (long-lived, 7 days)
   */
  generateRefreshToken(userId: string, email: string, role: string): string {
    return jwt.sign(
      { sub: userId, email, role },
      env.JWT_REFRESH_SECRET,
      { expiresIn: env.JWT_REFRESH_TTL, algorithm: 'HS256' }
    );
  },

  /**
   * Generate email verification token (24 hours)
   */
  generateVerificationToken(userId: string, email: string): string {
    return jwt.sign(
      { sub: userId, email, type: 'verify_email' },
      env.JWT_ACCESS_SECRET,
      { expiresIn: '24h', algorithm: 'HS256' }
    );
  },

  /**
   * Generate password reset token (1 hour)
   */
  generatePasswordResetToken(userId: string, email: string): string {
    return jwt.sign(
      { sub: userId, email, type: 'password_reset' },
      env.JWT_ACCESS_SECRET,
      { expiresIn: '1h', algorithm: 'HS256' }
    );
  },

  /**
   * Verify access token
   */
  verifyAccessToken(token: string): TokenPayload | null {
    try {
      return jwt.verify(token, env.JWT_ACCESS_SECRET) as TokenPayload;
    } catch {
      return null;
    }
  },

  /**
   * Verify refresh token
   */
  verifyRefreshToken(token: string): TokenPayload | null {
    try {
      return jwt.verify(token, env.JWT_REFRESH_SECRET) as TokenPayload;
    } catch {
      return null;
    }
  },

  /**
   * Verify verification token
   */
  verifyVerificationToken(token: string): TokenPayload | null {
    try {
      const payload = jwt.verify(token, env.JWT_ACCESS_SECRET) as TokenPayload & { type: string };
      if (payload.type !== 'verify_email') return null;
      return payload;
    } catch {
      return null;
    }
  },

  /**
   * Verify password reset token
   */
  verifyPasswordResetToken(token: string): TokenPayload | null {
    try {
      const payload = jwt.verify(token, env.JWT_ACCESS_SECRET) as TokenPayload & { type: string };
      if (payload.type !== 'password_reset') return null;
      return payload;
    } catch {
      return null;
    }
  },
};
