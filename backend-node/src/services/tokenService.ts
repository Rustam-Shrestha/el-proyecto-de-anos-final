import jwt from 'jsonwebtoken';
import { env } from '@/config/env';

export interface TokenPayload {
  sub: string;
  email: string;
  role: string;
  tenantId?: number;
  company_id?: number;
  customer_id?: string;
  permissions?: string[];
  iat?: number;
  exp?: number;
}

export const tokenService = {
  /**
   * Generate access token (short-lived, 15 minutes)
   */
  generateAccessToken(userId: string, email: string, role: string, tenantId?: number, permissions?: string[]): string {
    const expiresIn = env.JWT_ACCESS_TTL as jwt.SignOptions['expiresIn'];
    return jwt.sign(
      { sub: userId, email, role, tenantId, permissions },
      env.JWT_ACCESS_SECRET,
      { expiresIn, algorithm: 'HS256' }
    );
  },

  /**
   * Generate refresh token (long-lived, 7 days)
   */
  generateRefreshToken(userId: string, email: string, role: string, tenantId?: number): string {
    const expiresIn = env.JWT_REFRESH_TTL as jwt.SignOptions['expiresIn'];
    return jwt.sign(
      { sub: userId, email, role, tenantId },
      env.JWT_REFRESH_SECRET,
      { expiresIn, algorithm: 'HS256' }
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
   * Generate MD-compat token: {sub,email,role,company_id?,customer_id?}
   * issuer finguard / audience finguard-app, 24h. Verifiable by both
   * compat middleware and legacy authenticate (tenantId alias).
   */
  generateCompatToken(input: { sub: string; email: string; role: string; company_id?: number; customer_id?: string; tenantId?: number; permissions?: string[] }): string {
    const tenantId = input.tenantId ?? input.company_id;
    return jwt.sign(
      {
        sub: input.sub,
        email: input.email,
        role: input.role,
        ...(tenantId !== undefined ? { tenantId, company_id: tenantId } : {}),
        ...(input.customer_id ? { customer_id: input.customer_id } : {}),
        ...(input.permissions ? { permissions: input.permissions } : {}),
      },
      env.JWT_ACCESS_SECRET,
      { expiresIn: '24h', algorithm: 'HS256', issuer: 'finguard', audience: 'finguard-app' } as jwt.SignOptions,
    );
  },

  /**
   * Verify MD-compat token (tries issuer/audience first, falls back to plain verify
   * so legacy tokens without iss/aud still work).
   */
  verifyCompatToken(token: string): TokenPayload | null {
    try {
      return jwt.verify(token, env.JWT_ACCESS_SECRET, { issuer: 'finguard', audience: 'finguard-app' } as jwt.VerifyOptions) as TokenPayload;
    } catch {
      try {
        return jwt.verify(token, env.JWT_ACCESS_SECRET) as TokenPayload;
      } catch {
        return null;
      }
    }
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
