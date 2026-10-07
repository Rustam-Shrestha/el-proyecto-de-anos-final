import { prisma } from '@/config/database';
import { logger } from '@/config/logger';
import { AppError } from '@/utils/AppError';

type UserProfileFields = {
  fullName?: string | null;
  phone?: string | null;
  address?: string | null;
  avatarUrl?: string | null;
};

type UserWithProfile = {
  id: string;
  email: string;
  role: { name: string };
  isVerified: boolean;
  isDeleted: boolean;
  createdAt: Date;
  updatedAt: Date;
  profile?: UserProfileFields | null;
};

export type UserListItem = {
  id: string;
  email: string;
  role: string;
  isVerified: boolean;
  createdAt: Date;
};

export type UserDetail = {
  id: string;
  email: string;
  role: string;
  isVerified: boolean;
  isDeleted: boolean;
  createdAt: Date;
  updatedAt: Date;
} & UserProfileFields;

const profileSelect = {
  fullName: true,
  phone: true,
  address: true,
  avatarUrl: true,
} as const;

const mapUserProfile = (user: UserWithProfile): UserDetail => ({
  id: user.id,
  email: user.email,
  role: user.role.name,
  isVerified: user.isVerified,
  isDeleted: user.isDeleted,
  createdAt: user.createdAt,
  updatedAt: user.updatedAt,
  fullName: user.profile?.fullName ?? null,
  phone: user.profile?.phone ?? null,
  address: user.profile?.address ?? null,
  avatarUrl: user.profile?.avatarUrl ?? null,
});

function isTenantSchemaError(e: unknown): boolean {
  const code = (e as { code?: string })?.code;
  const msg = String((e as { message?: string })?.message ?? (e as Error)?.message ?? "");
  return code === "P2021" || code === "P2022" || msg.includes("tenantId") || msg.includes("tenant_id") || msg.includes("does not exist");
}

export const userService = {
  /**
   * List all users with pagination, optional search, and tenant isolation
   */
  async listUsers(
    limit: number = 10,
    offset: number = 0,
    search?: string,
    tenantId?: number
  ): Promise<{ users: UserListItem[]; total: number }> {
    try {
      const tenantFilter = tenantId !== undefined ? { tenantId } : {};
      const where: any = search
        ? {
            AND: [
              { isDeleted: false },
              tenantFilter,
              {
                OR: [
                  { email: { contains: search, mode: 'insensitive' as const } },
                ],
              },
            ],
          }
        : { isDeleted: false, ...tenantFilter };

      try {
        const [users, total] = await Promise.all([
          prisma.user.findMany({
            where,
            select: {
              id: true,
              email: true,
              role: {
                select: { name: true },
              },
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
      } catch (e) {
        if (!isTenantSchemaError(e)) throw e;
        const fallbackWhere: any = search
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
            where: fallbackWhere,
            select: {
              id: true,
              email: true,
              role: {
                select: { name: true },
              },
              isVerified: true,
              createdAt: true,
            },
            orderBy: { createdAt: 'desc' },
            take: limit,
            skip: offset,
          }),
          prisma.user.count({ where: fallbackWhere }),
        ]);
        return { users, total };
      }
    } catch (error) {
      logger.error({ err: error }, 'Failed to list users');
      throw new AppError('Failed to fetch users', 500);
    }
  },

  /**
   * Get a single user by ID with tenant verification
   */
  async getUserById(userId: string, tenantId?: number): Promise<UserDetail> {
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          email: true,
          tenantId: true,
          role: {
            select: { name: true },
          },
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

      if (tenantId !== undefined && (user as unknown as { tenantId?: number | null }).tenantId !== null && (user as unknown as { tenantId?: number | null }).tenantId !== undefined && (user as unknown as { tenantId?: number | null }).tenantId !== tenantId) {
        throw new AppError('You do not have permission to view users from another company', 403);
      }

      return {
        ...user,
        role: user.role.name,
        fullName: null,
        phone: null,
        address: null,
        avatarUrl: null,
      };
    } catch (error) {
      if (error instanceof AppError) throw error;
      logger.error({ err: error, userId }, 'Failed to get user by ID');
      throw new AppError('Failed to fetch user', 500);
    }
  },

  /**
   * Get user profile (me)
   */
  async getUserProfile(userId: string): Promise<Omit<UserDetail, 'isDeleted'> & { tenantId: number; tenant?: any }> {
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          email: true,
          tenantId: true,
          role: {
            select: { name: true },
          },
          isVerified: true,
          createdAt: true,
          updatedAt: true,
          profile: {
            select: profileSelect,
          },
        },
      }) as any;
      let tenant = null;
      if (user?.tenantId) {
        try { tenant = await prisma.tenant.findUnique({ where: { id: user.tenantId } }); } catch (_err) { /* ignore */ }
      }

      if (!user) {
        throw new AppError('User not found', 404);
      }

      const mapped: any = mapUserProfile(user);
      mapped.tenantId = (user as any).tenantId;
      mapped.tenant = tenant;
      // platform flag: row in public.supercontroller (drives the Platform nav section)
      try {
        const sc = await (prisma as any).supercontroller?.findUnique?.({ where: { email: (user as any).email } });
        mapped.isSuperUser = Boolean(sc);
      } catch { mapped.isSuperUser = false; }
      return mapped;
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
          role: {
            select: { name: true },
          },
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
          role: {
            select: { name: true },
          },
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
          role: {
            select: { name: true },
          },
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
  async changeUserRole(userId: string, newRole: 'USER' | 'ADMIN' | 'REVIEWER', tenantId?: number): Promise<UserDetail> {
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { id: true, isDeleted: true, tenantId: true },
      });

      if (!user || user.isDeleted) {
        throw new AppError('User not found', 404);
      }

      if (tenantId !== undefined && (user as unknown as { tenantId?: number | null }).tenantId !== null && (user as unknown as { tenantId?: number | null }).tenantId !== undefined && (user as unknown as { tenantId?: number | null }).tenantId !== tenantId) {
        throw new AppError('You do not have permission to modify users from another company', 403);
      }

      const updated = await prisma.user.update({
        where: { id: userId },
        data: { role: { connect: { name: newRole } } },
        select: {
          id: true,
          email: true,
          role: {
            select: { name: true },
          },
          isVerified: true,
          isDeleted: true,
          createdAt: true,
          updatedAt: true,
        },
      });

      return {
        ...updated,
        role: updated.role.name,
        fullName: null,
        phone: null,
        address: null,
        avatarUrl: null,
      };
    } catch (error) {
      if (error instanceof AppError) throw error;
      logger.error({ err: error, userId }, 'Failed to change user role');
      throw new AppError('Failed to change user role', 500);
    }
  },

  /**
   * Soft delete user (mark as deleted, don't remove from DB)
   */
  async softDeleteUser(userId: string, tenantId?: number): Promise<void> {
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { id: true, isDeleted: true, tenantId: true },
      });

      if (!user) {
        throw new AppError('User not found', 404);
      }

      if (user.isDeleted) {
        throw new AppError('User is already deleted', 410);
      }

      if (tenantId !== undefined && (user as unknown as { tenantId?: number | null }).tenantId !== null && (user as unknown as { tenantId?: number | null }).tenantId !== undefined && (user as unknown as { tenantId?: number | null }).tenantId !== tenantId) {
        throw new AppError('You do not have permission to delete users from another company', 403);
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
