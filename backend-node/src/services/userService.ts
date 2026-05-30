import { prisma } from '@/config/database';
import { logger } from '@/config/logger';
import { AppError } from '@/utils/AppError';
import type { User } from '@prisma/client';

type UserProfileFields = {
  fullName?: string | null;
  phone?: string | null;
  address?: string | null;
  avatarUrl?: string | null;
};

type UserWithProfile = Pick<User, 'id' | 'email' | 'role' | 'isVerified' | 'isDeleted' | 'createdAt' | 'updatedAt'> & {
  profile?: UserProfileFields | null;
};

export type UserListItem = Pick<User, 'id' | 'email' | 'role' | 'isVerified' | 'createdAt'>;

export type UserDetail = Pick<
  User,
  'id' | 'email' | 'role' | 'isVerified' | 'isDeleted' | 'createdAt' | 'updatedAt'
> & UserProfileFields;

const profileSelect = {
  fullName: true,
  phone: true,
  address: true,
  avatarUrl: true,
} as const;

const mapUserProfile = (user: UserWithProfile): Omit<UserDetail, 'isDeleted'> => ({
  id: user.id,
  email: user.email,
  role: user.role,
  isVerified: user.isVerified,
  createdAt: user.createdAt,
  updatedAt: user.updatedAt,
  fullName: user.profile?.fullName ?? null,
  phone: user.profile?.phone ?? null,
  address: user.profile?.address ?? null,
  avatarUrl: user.profile?.avatarUrl ?? null,
});

export const userService = {
  /**
   * List all users with pagination and optional search
   */
  async listUsers(
    limit: number = 10,
    offset: number = 0,
    search?: string
  ): Promise<{ users: UserListItem[]; total: number }> {
    try {
      const where = search
        ? {
            AND: [
              { isDeleted: false },
              {
                OR: [
                  { email: { contains: search, mode: 'insensitive' as const } },
                ],
              },
            ],
          }
        : { isDeleted: false };

      const [users, total] = await Promise.all([
        prisma.user.findMany({
          where,
          select: {
            id: true,
            email: true,
            role: true,
            isVerified: true,
            createdAt: true,
          },
          orderBy: { createdAt: 'desc' },
          take: limit,
          skip: offset,
        }),
        prisma.user.count({ where }),
      ]);

      return { users, total };
    } catch (error) {
      logger.error({ err: error }, 'Failed to list users');
      throw new AppError('Failed to fetch users', 500);
    }
  },

  /**
   * Get a single user by ID
   */
  async getUserById(userId: string): Promise<UserDetail> {
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          email: true,
          role: true,
          isVerified: true,
          isDeleted: true,
          createdAt: true,
          updatedAt: true,
        },
      });

      if (!user) {
        throw new AppError('User not found', 404);
      }

      if (user.isDeleted) {
        throw new AppError('User has been deleted', 404);
      }

      return user;
    } catch (error) {
      if (error instanceof AppError) throw error;
      logger.error({ err: error, userId }, 'Failed to get user by ID');
      throw new AppError('Failed to fetch user', 500);
    }
  },

  /**
   * Get user profile (me)
   */
  async getUserProfile(userId: string): Promise<Omit<UserDetail, 'isDeleted'>> {
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          email: true,
          role: true,
          isVerified: true,
          createdAt: true,
          updatedAt: true,
          profile: {
            select: profileSelect,
          },
        },
      });

      if (!user) {
        throw new AppError('User not found', 404);
      }

      return mapUserProfile(user);
    } catch (error) {
      if (error instanceof AppError) throw error;
      logger.error({ err: error, userId }, 'Failed to get user profile');
      throw new AppError('Failed to fetch profile', 500);
    }
  },

  /**
   * Update user information
   */
  async updateUser(
    userId: string,
    data: { email?: string; fullName?: string; phone?: string; address?: string }
  ): Promise<UserDetail> {
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { id: true, isDeleted: true },
      });

      if (!user || user.isDeleted) {
        throw new AppError('User not found', 404);
      }

      if (data.email) {
        const existingUser = await prisma.user.findFirst({
          where: {
            email: data.email,
            NOT: { id: userId },
          },
        });

        if (existingUser) {
          throw new AppError('Email already in use', 409);
        }
      }

      if (data.email) {
        await prisma.user.update({
          where: { id: userId },
          data: { email: data.email },
        });
      }

      const profileData = {
        fullName: data.fullName,
        phone: data.phone,
        address: data.address,
      };

      const hasProfileUpdates = Object.values(profileData).some((value) => value !== undefined);

      if (hasProfileUpdates) {
        await prisma.profile.upsert({
          where: { userId },
          create: {
            userId,
            fullName: data.fullName,
            phone: data.phone,
            address: data.address,
          },
          update: {
            ...(data.fullName !== undefined ? { fullName: data.fullName } : {}),
            ...(data.phone !== undefined ? { phone: data.phone } : {}),
            ...(data.address !== undefined ? { address: data.address } : {}),
          },
        });
      }

      const updated = await prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          email: true,
          role: true,
          isVerified: true,
          isDeleted: true,
          createdAt: true,
          updatedAt: true,
          profile: {
            select: profileSelect,
          },
        },
      });

      if (!updated) {
        throw new AppError('User not found', 404);
      }

      return mapUserProfile(updated);
    } catch (error) {
      if (error instanceof AppError) throw error;
      logger.error({ err: error, userId }, 'Failed to update user');
      throw new AppError('Failed to update user', 500);
    }
  },

  async updateProfileAvatar(userId: string, avatarUrl: string): Promise<UserDetail> {
    try {
      await prisma.profile.upsert({
        where: { userId },
        create: { userId, avatarUrl },
        update: { avatarUrl },
      });

      const updated = await prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          email: true,
          role: true,
          isVerified: true,
          isDeleted: true,
          createdAt: true,
          updatedAt: true,
          profile: {
            select: profileSelect,
          },
        },
      });

      if (!updated) {
        throw new AppError('User not found', 404);
      }

      return mapUserProfile(updated);
    } catch (error) {
      if (error instanceof AppError) throw error;
      logger.error({ err: error, userId }, 'Failed to update profile avatar');
      throw new AppError('Failed to update profile avatar', 500);
    }
  },

  async removeProfileAvatar(userId: string): Promise<UserDetail> {
    try {
      await prisma.profile.upsert({
        where: { userId },
        create: { userId, avatarUrl: null },
        update: { avatarUrl: null },
      });

      const updated = await prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          email: true,
          role: true,
          isVerified: true,
          isDeleted: true,
          createdAt: true,
          updatedAt: true,
          profile: {
            select: profileSelect,
          },
        },
      });

      if (!updated) {
        throw new AppError('User not found', 404);
      }

      return mapUserProfile(updated);
    } catch (error) {
      if (error instanceof AppError) throw error;
      logger.error({ err: error, userId }, 'Failed to remove profile avatar');
      throw new AppError('Failed to remove profile avatar', 500);
    }
  },

  /**
   * Change user role (ADMIN only)
   */
  async changeUserRole(userId: string, newRole: 'USER' | 'ADMIN' | 'REVIEWER'): Promise<UserDetail> {
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { id: true, isDeleted: true },
      });

      if (!user || user.isDeleted) {
        throw new AppError('User not found', 404);
      }

      const updated = await prisma.user.update({
        where: { id: userId },
        data: { role: newRole },
        select: {
          id: true,
          email: true,
          role: true,
          isVerified: true,
          isDeleted: true,
          createdAt: true,
          updatedAt: true,
        },
      });

      return updated;
    } catch (error) {
      if (error instanceof AppError) throw error;
      logger.error({ err: error, userId }, 'Failed to change user role');
      throw new AppError('Failed to change user role', 500);
    }
  },

  /**
   * Soft delete user (mark as deleted, don't remove from DB)
   */
  async softDeleteUser(userId: string): Promise<void> {
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { id: true, isDeleted: true },
      });

      if (!user) {
        throw new AppError('User not found', 404);
      }

      if (user.isDeleted) {
        throw new AppError('User is already deleted', 410);
      }

      await prisma.user.update({
        where: { id: userId },
        data: { isDeleted: true },
      });
    } catch (error) {
      if (error instanceof AppError) throw error;
      logger.error({ err: error, userId }, 'Failed to delete user');
      throw new AppError('Failed to delete user', 500);
    }
  },
};
