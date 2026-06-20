import type { Request, Response, NextFunction } from 'express';
import fs from 'fs/promises';
import path from 'path';
import bcryptjs from 'bcryptjs';
import { prisma } from '@/config/database';
import { userService } from '@/services/userService';
import { auditService } from '@/services/auditService';
import { apiResponse } from '@/utils/apiResponse';
import { paginate } from '@/utils/pagination';

const isUploadPath = (value?: string | null) => Boolean(value && value.startsWith('/uploads/'));

const resolveUploadFilePath = (value: string) => path.join(process.cwd(), value.replace(/^\//, ''));

const deleteUploadIfPresent = async (value?: string | null): Promise<void> => {
  if (!isUploadPath(value)) {
    return;
  }

  try {
    await fs.unlink(resolveUploadFilePath(value as string));
  } catch {
    // Missing files are fine; the database record is authoritative.
  }
};

/**
 * POST /api/v1/users
 * Create a new user (ADMIN only)
 */
export const createUser = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { email, password, role, fullName } = req.body;

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      res.status(409).json(apiResponse.error('Email already registered', 409));
      return;
    }

    const passwordHash = await bcryptjs.hash(password, 12);
    const roleRecord = await prisma.role.findUnique({ where: { name: role } });
    if (!roleRecord) {
      res.status(400).json(apiResponse.error(`Role "${role}" not found`, 400));
      return;
    }

    const user = await prisma.user.create({
      data: {
        email,
        passwordHash,
        roleId: roleRecord.id,
        isVerified: false,
        profile: fullName ? { create: { fullName } } : undefined,
      },
      include: {
        role: { select: { name: true } },
        profile: { select: { fullName: true, phone: true, address: true, avatarUrl: true } },
      },
    });

    await auditService.log({
      userId: req.user!.id,
      action: 'CREATE_USER',
      metadata: { targetUserId: user.id, email, role },
      ip: req.ip || undefined,
      userAgent: req.headers['user-agent'],
    });

    res.status(201).json(
      apiResponse.success('User created successfully', {
        id: user.id,
        email: user.email,
        role: user.role.name,
        isVerified: user.isVerified,
        fullName: user.profile?.fullName ?? null,
        phone: null,
        address: null,
        avatarUrl: null,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      })
    );
  } catch (error) {
    next(error);
  }
};

/**
 * PATCH /api/v1/users/:id
 * Update a user's email and/or role (ADMIN only)
 */
export const updateUserAdmin = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const { email, role } = req.body;

    const existing = await prisma.user.findUnique({
      where: { id },
      select: { id: true, isDeleted: true },
    });
    if (!existing || existing.isDeleted) {
      res.status(404).json(apiResponse.error('User not found', 404));
      return;
    }

    if (email) {
      const emailTaken = await prisma.user.findFirst({
        where: { email, NOT: { id } },
      });
      if (emailTaken) {
        res.status(409).json(apiResponse.error('Email already in use', 409));
        return;
      }
    }

    if (role) {
      const roleRecord = await prisma.role.findUnique({ where: { name: role } });
      if (!roleRecord) {
        res.status(400).json(apiResponse.error(`Role "${role}" not found`, 400));
        return;
      }
    }

    const updated = await prisma.user.update({
      where: { id },
      data: {
        ...(email && { email }),
        ...(role && { role: { connect: { name: role } } }),
      },
      include: {
        role: { select: { name: true } },
        profile: { select: { fullName: true, phone: true, address: true, avatarUrl: true } },
      },
    });

    await auditService.log({
      userId: req.user!.id,
      action: 'UPDATE_USER',
      metadata: { targetUserId: id, email, role },
      ip: req.ip || undefined,
      userAgent: req.headers['user-agent'],
    });

    res.json(
      apiResponse.success('User updated successfully', {
        id: updated.id,
        email: updated.email,
        role: updated.role.name,
        isVerified: updated.isVerified,
        fullName: updated.profile?.fullName ?? null,
        phone: updated.profile?.phone ?? null,
        address: updated.profile?.address ?? null,
        avatarUrl: updated.profile?.avatarUrl ?? null,
        createdAt: updated.createdAt,
        updatedAt: updated.updatedAt,
      })
    );
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/v1/users/me
 * Get current user's profile
 */
export const getMe = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json(apiResponse.error('Authentication required', 401));
      return;
    }

    const user = await userService.getUserProfile(req.user.id);
    res.json(apiResponse.success('Profile retrieved', user));
  } catch (error) {
    next(error);
  }
};

/**
 * PATCH /api/v1/users/me
 * Update current user's profile
 */
export const updateMe = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json(apiResponse.error('Authentication required', 401));
      return;
    }

    const updated = await userService.updateUser(req.user.id, req.body);

    // Log the update action
    await auditService.log({
      userId: req.user.id,
      action: 'UPDATE_PROFILE',
      metadata: { updatedFields: Object.keys(req.body) },
      ip: req.ip || undefined,
      userAgent: req.headers['user-agent'],
    });

    res.json(apiResponse.success('Profile updated', updated));
  } catch (error) {
    next(error);
  }
};

/**
 * PATCH /api/v1/users/me/avatar
 * Upload or replace current user's avatar
 */
export const uploadAvatar = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json(apiResponse.error('Authentication required', 401));
      return;
    }

    const file = req.file as { filename: string } | undefined;

    if (!file) {
      res.status(400).json(apiResponse.error('Avatar file is required', 400));
      return;
    }

    const currentProfile = await userService.getUserProfile(req.user.id);
    const previousAvatarUrl = currentProfile.avatarUrl;
    const avatarUrl = `/uploads/avatars/${file.filename}`;
    const updated = await userService.updateProfileAvatar(req.user.id, avatarUrl);

    if (previousAvatarUrl && previousAvatarUrl !== avatarUrl) {
      await deleteUploadIfPresent(previousAvatarUrl);
    }

    await auditService.log({
      userId: req.user.id,
      action: 'UPDATE_AVATAR',
      metadata: { avatarUrl },
      ip: req.ip || undefined,
      userAgent: req.headers['user-agent'],
    });

    res.json(apiResponse.success('Avatar updated', updated));
  } catch (error) {
    const file = req.file as { filename: string } | undefined;
    if (file) {
      await deleteUploadIfPresent(`/uploads/avatars/${file.filename}`);
    }
    next(error);
  }
};

/**
 * DELETE /api/v1/users/me/avatar
 * Remove current user's avatar
 */
export const deleteAvatar = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json(apiResponse.error('Authentication required', 401));
      return;
    }

    const currentProfile = await userService.getUserProfile(req.user.id);
    const previousAvatarUrl = currentProfile.avatarUrl;
    const updated = await userService.removeProfileAvatar(req.user.id);

    await deleteUploadIfPresent(previousAvatarUrl);

    await auditService.log({
      userId: req.user.id,
      action: 'DELETE_AVATAR',
      metadata: { previousAvatarUrl },
      ip: req.ip || undefined,
      userAgent: req.headers['user-agent'],
    });

    res.json(apiResponse.success('Avatar removed', updated));
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/v1/users
 * List all users (ADMIN only)
 */
export const listUsers = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { skip, take, page, limit } = paginate(req.query);
    const search = (req.query.search as string) || undefined;

    const { users, total } = await userService.listUsers(take, skip, search);

    res.json(
      apiResponse.paginated(
        'Users listed successfully',
        users,
        page,
        limit,
        total
      )
    );
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/v1/users/:id
 * Get a specific user by ID (ADMIN only)
 */
export const getUser = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const user = await userService.getUserById(id);

    res.json(apiResponse.success('User retrieved', user));
  } catch (error) {
    next(error);
  }
};

/**
 * PATCH /api/v1/users/:id/role
 * Change user role (ADMIN only)
 */
export const changeUserRole = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const { role } = req.body;

    if (!req.user) {
      res.status(401).json(apiResponse.error('Authentication required', 401));
      return;
    }

    const updated = await userService.changeUserRole(id, role);

    // Log the role change action
    await auditService.log({
      userId: req.user.id,
      action: 'CHANGE_USER_ROLE',
      metadata: { targetUserId: id, newRole: role, oldRole: 'USER' },
      ip: req.ip || undefined,
      userAgent: req.headers['user-agent'],
    });

    res.json(apiResponse.success('User role updated', updated));
  } catch (error) {
    next(error);
  }
};

/**
 * PATCH /api/v1/users/:id/profile
 * Update user profile (admin)
 */
export const updateProfile = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json(apiResponse.error('Authentication required', 401));
      return;
    }

    const { id } = req.params;
    const { firstName, lastName, phoneNumber } = req.body;

    const data: Record<string, string> = {};
    if (firstName || lastName) {
      data.fullName = `${firstName || ''} ${lastName || ''}`.trim();
    }
    if (phoneNumber !== undefined) {
      data.phone = phoneNumber;
    }

    const user = await userService.updateUser(id, data);

    await auditService.log({
      userId: req.user.id,
      action: 'UPDATE_PROFILE',
      metadata: { targetUserId: id, fields: Object.keys(data) },
      ip: req.ip || undefined,
      userAgent: req.headers['user-agent'],
    });

    res.json(apiResponse.success('Profile updated successfully', user));
  } catch (error) {
    next(error);
  }
};

/**
 * DELETE /api/v1/users/:id
 * Soft delete a user (ADMIN only)
 */
export const deleteUser = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;

    if (!req.user) {
      res.status(401).json(apiResponse.error('Authentication required', 401));
      return;
    }

    // Prevent self-deletion
    if (req.user.id === id) {
      res.status(400).json(apiResponse.error('Cannot delete your own account', 400));
      return;
    }

    await userService.softDeleteUser(id);

    // Log the deletion action
    await auditService.log({
      userId: req.user.id,
      action: 'DELETE_USER',
      metadata: { deletedUserId: id },
      ip: req.ip || undefined,
      userAgent: req.headers['user-agent'],
    });

    res.json(apiResponse.success('User deleted successfully'));
  } catch (error) {
    next(error);
  }
};
