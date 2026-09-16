import { prisma } from '@/config/database';
import { logger } from '@/config/logger';
import { AppError } from '@/utils/AppError';
import { tokenService } from '@/services/tokenService';
import { mailService } from '@/services/mailService';
import { permissionResolver } from '@/services/rbac/permissionResolver';
import bcryptjs from 'bcryptjs';

export interface RegisterInput {
  email: string;
  password: string;
}

export interface LoginInput {
  email: string;
  password: string;
}

export interface TokenResponse {
  accessToken: string;
  refreshToken: string;
  user: {
    id: string;
    email: string;
    role: string;
    isVerified: boolean;
  };
}

function isTenantSchemaError(e: unknown): boolean {
  const code = (e as { code?: string })?.code;
  const msg = String((e as { message?: string })?.message ?? (e as Error)?.message ?? "");
  return code === "P2021" || code === "P2022" || msg.includes("tenantId") || msg.includes("auth.tenants") || msg.includes("does not exist");
}

export const authService = {
  /**
   * Register a new user
   */
  async register(input: RegisterInput): Promise<TokenResponse> {
    try {
      // Check if email already exists
      const existingUser = await prisma.user.findUnique({
        where: { email: input.email },
      });

      if (existingUser) {
        throw new AppError('Email already registered', 409);
      }

      // Hash password
      const passwordHash = await bcryptjs.hash(input.password, 12);

      // Get or create default USER role
      let userRole = await prisma.role.findFirst({
        where: { name: 'USER' },
      });

      if (!userRole) {
        userRole = await prisma.role.create({ data: { name: 'USER' } });
        logger.info('Default USER role created on-the-fly');
      }

      // Create user - handle missing tenantId column gracefully
      let user: Awaited<ReturnType<typeof prisma.user.create>>;
      try {
        user = await prisma.user.create({
          data: {
            email: input.email,
            passwordHash,
            roleId: userRole.id,
            isVerified: false,
          } as never,
        });
      } catch (e) {
        if (isTenantSchemaError(e)) {
          // fallback via raw SQL without tenantId column
          const id = `c${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;
          await prisma.$executeRawUnsafe(
            `INSERT INTO "auth"."users" ("id", "email", "passwordHash", "roleId", "isVerified", "isDeleted", "createdAt", "updatedAt") VALUES ($1,$2,$3,$4,false,false,$5,$6)`,
            id,
            input.email,
            passwordHash,
            userRole.id,
            new Date(),
            new Date(),
          );
          user = (await prisma.user.findUnique({ where: { email: input.email } }))!;
        } else throw e;
      }

      // Get role for token
      const role = await prisma.role.findUnique({
        where: { id: user.roleId },
      });
      const permissions = permissionResolver.resolveForRoleName(role!.name);
      // Generate tokens (tenantId from user, default 1)
      const accessToken = tokenService.generateAccessToken(user.id, user.email, role!.name, (user as unknown as { tenantId?: number }).tenantId ?? 1, permissions);
      const refreshToken = tokenService.generateRefreshToken(user.id, user.email, role!.name, (user as unknown as { tenantId?: number }).tenantId ?? 1);

      // Hash and store refresh token
      const refreshTokenHash = await bcryptjs.hash(refreshToken, 12);
      await prisma.session.create({
        data: {
          userId: user.id,
          refreshTokenHash,
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        },
      });

      // Send verification email (fire-and-forget)
      const verificationToken = tokenService.generateVerificationToken(user.id, user.email);
      await mailService.sendVerificationMail(user.email, verificationToken);

      logger.info({ userId: user.id, email: user.email }, 'User registered');

      return {
        accessToken,
        refreshToken,
        user: {
          id: user.id,
          email: user.email,
          role: role!.name,
          isVerified: user.isVerified,
        },
      };
    } catch (error) {
      if (error instanceof AppError) throw error;
      logger.error({ err: error }, 'Registration failed');
      throw new AppError('Failed to register user', 500);
    }
  },

  /**
   * Login user
   */
  async login(input: LoginInput): Promise<TokenResponse> {
    try {
      let user: Awaited<ReturnType<typeof prisma.user.findUnique>> & { role?: { name: string } } | null = null;
      try {
        user = await prisma.user.findUnique({
          where: { email: input.email },
          include: { role: true },
        }) as never;
      } catch (e) {
        if (isTenantSchemaError(e)) {
          logger.warn({ err: e }, "Login fallback: tenantId column missing, using raw query");
          const rows = (await prisma.$queryRawUnsafe(
            `SELECT u."id", u."email", u."passwordHash", u."isDeleted", u."isVerified", u."roleId", r."name" as "roleName" FROM "auth"."users" u JOIN "auth"."Role" r ON r."id" = u."roleId" WHERE u."email" = $1 LIMIT 1`,
            input.email,
          )) as Array<{ id: string; email: string; passwordHash: string; isDeleted: boolean; isVerified: boolean; roleId: string; roleName: string }>;
          if (rows.length > 0) {
            const r = rows[0];
            user = {
              id: r.id,
              email: r.email,
              passwordHash: r.passwordHash,
              isDeleted: r.isDeleted,
              isVerified: r.isVerified,
              roleId: r.roleId,
              role: { name: r.roleName },
            } as never;
          }
        } else throw e;
      }

      if (!user) {
        throw new AppError('Invalid email or password', 401);
      }

      // Verify password
      const isPasswordValid = await bcryptjs.compare(input.password, user.passwordHash);
      if (!isPasswordValid) {
        throw new AppError('Invalid email or password', 401);
      }

      if (user.isDeleted) {
        throw new AppError('Account has been deleted', 403);
      }

      // Generate tokens (tenant-aware)
      const permissions = permissionResolver.resolveForRoleName(user.role.name);
      const tenantId = (user as unknown as { tenantId?: number }).tenantId ?? 1;
      const accessToken = tokenService.generateAccessToken(user.id, user.email, user.role.name, tenantId, permissions);
      const refreshToken = tokenService.generateRefreshToken(user.id, user.email, user.role.name, tenantId);

      // Hash and store refresh token
      const refreshTokenHash = await bcryptjs.hash(refreshToken, 12);
      await prisma.session.create({
        data: {
          userId: user.id,
          refreshTokenHash,
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        },
      });

      logger.info({ userId: user.id, email: user.email }, 'User logged in');

      return {
        accessToken,
        refreshToken,
        user: {
          id: user.id,
          email: user.email,
          role: user.role.name,
          isVerified: user.isVerified,
        },
      };
    } catch (error) {
      if (error instanceof AppError) throw error;
      logger.error({ err: error }, 'Login failed');
      throw new AppError('Login failed', 500);
    }
  },

  /**
   * Logout user (revoke refresh token)
   */
  async logout(userId: string): Promise<void> {
    try {
      // Revoke all sessions for this user
      await prisma.session.updateMany({
        where: { userId },
        data: { isRevoked: true },
      });

      logger.info({ userId }, 'User logged out');
    } catch (error) {
      logger.error({ err: error, userId }, 'Logout failed');
      throw new AppError('Logout failed', 500);
    }
  },

  /**
   * Refresh token pair
   */
  async refreshToken(refreshToken: string): Promise<TokenResponse> {
    try {
      const payload = tokenService.verifyRefreshToken(refreshToken);
      if (!payload) {
        throw new AppError('Invalid or expired refresh token', 401);
      }

      // Find user and check session
      const user = await prisma.user.findUnique({
        where: { id: payload.sub },
        include: { role: true },
      });

      if (!user || user.isDeleted) {
        throw new AppError('User not found or deleted', 404);
      }

      // Verify refresh token exists and isn't revoked
      const session = await prisma.session.findFirst({
        where: {
          userId: user.id,
          isRevoked: false,
          expiresAt: { gt: new Date() },
        },
      });

      if (!session) {
        throw new AppError('Session not found or expired', 401);
      }

      // Verify token matches (constant time comparison)
      const isTokenValid = await bcryptjs.compare(refreshToken, session.refreshTokenHash);
      if (!isTokenValid) {
        throw new AppError('Invalid refresh token', 401);
      }

      // Revoke old session
      await prisma.session.update({
        where: { id: session.id },
        data: { isRevoked: true },
      });

      // Generate new tokens
      const perms = permissionResolver.resolveForRoleName(user.role.name);
      const tid = (user as unknown as { tenantId?: number }).tenantId ?? 1;
      const newAccessToken = tokenService.generateAccessToken(user.id, user.email, user.role.name, tid, perms);
      const newRefreshToken = tokenService.generateRefreshToken(user.id, user.email, user.role.name, tid);

      // Store new refresh token
      const newRefreshTokenHash = await bcryptjs.hash(newRefreshToken, 12);
      await prisma.session.create({
        data: {
          userId: user.id,
          refreshTokenHash: newRefreshTokenHash,
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        },
      });

      logger.info({ userId: user.id }, 'Token refreshed');

      return {
        accessToken: newAccessToken,
        refreshToken: newRefreshToken,
        user: {
          id: user.id,
          email: user.email,
          role: user.role.name,
          isVerified: user.isVerified,
        },
      };
    } catch (error) {
      if (error instanceof AppError) throw error;
      logger.error({ err: error }, 'Token refresh failed');
      throw new AppError('Token refresh failed', 500);
    }
  },

  /**
   * Verify email
   */
  async verifyEmail(token: string): Promise<void> {
    try {
      const payload = tokenService.verifyVerificationToken(token);
      if (!payload) {
        throw new AppError('Invalid or expired verification token', 401);
      }

      const user = await prisma.user.findUnique({
        where: { id: payload.sub },
      });

      if (!user) {
        throw new AppError('User not found', 404);
      }

      if (user.isVerified) {
        throw new AppError('Email already verified', 400);
      }

      await prisma.user.update({
        where: { id: user.id },
        data: { isVerified: true },
      });

      logger.info({ userId: user.id }, 'Email verified');
    } catch (error) {
      if (error instanceof AppError) throw error;
      logger.error({ err: error }, 'Email verification failed');
      throw new AppError('Email verification failed', 500);
    }
  },

  /**
   * Send password reset email
   */
  async forgotPassword(email: string): Promise<void> {
    try {
      const user = await prisma.user.findUnique({
        where: { email },
      });

      if (!user) {
        // Don't reveal if email exists (security best practice)
        logger.info({ email }, 'Password reset requested for non-existent email');
        return;
      }

      // Generate reset token
      const resetToken = tokenService.generatePasswordResetToken(user.id, user.email);

      // Send email (fire-and-forget)
      await mailService.sendPasswordResetMail(user.email, resetToken);

      logger.info({ userId: user.id }, 'Password reset email sent');
    } catch (error) {
      logger.error({ err: error }, 'Forgot password failed');
      throw new AppError('Failed to process password reset request', 500);
    }
  },

  /**
   * Reset password
   */
  async resetPassword(token: string, newPassword: string): Promise<void> {
    try {
      const payload = tokenService.verifyPasswordResetToken(token);
      if (!payload) {
        throw new AppError('Invalid or expired password reset token', 401);
      }

      const user = await prisma.user.findUnique({
        where: { id: payload.sub },
      });

      if (!user) {
        throw new AppError('User not found', 404);
      }

      // Hash new password
      const passwordHash = await bcryptjs.hash(newPassword, 12);

      await prisma.user.update({
        where: { id: user.id },
        data: { passwordHash },
      });

      // Revoke all sessions (force re-login)
      await prisma.session.updateMany({
        where: { userId: user.id },
        data: { isRevoked: true },
      });

      logger.info({ userId: user.id }, 'Password reset successfully');
    } catch (error) {
      if (error instanceof AppError) throw error;
      logger.error({ err: error }, 'Password reset failed');
      throw new AppError('Password reset failed', 500);
    }
  },

  /**
   * Change password (while authenticated)
   */
  async changePassword(userId: string, currentPassword: string, newPassword: string): Promise<void> {
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
      });

      if (!user) {
        throw new AppError('User not found', 404);
      }

      // Verify current password
      const isPasswordValid = await bcryptjs.compare(currentPassword, user.passwordHash);
      if (!isPasswordValid) {
        throw new AppError('Current password is incorrect', 401);
      }

      // Hash new password
      const passwordHash = await bcryptjs.hash(newPassword, 12);

      await prisma.user.update({
        where: { id: user.id },
        data: { passwordHash },
      });

      // Revoke all sessions except current one (user stays logged in)
      await prisma.session.updateMany({
        where: { userId, isRevoked: false },
        data: { isRevoked: true },
      });

      logger.info({ userId }, 'Password changed successfully');
    } catch (error) {
      if (error instanceof AppError) throw error;
      logger.error({ err: error, userId }, 'Change password failed');
      throw new AppError('Change password failed', 500);
    }
  },
};
