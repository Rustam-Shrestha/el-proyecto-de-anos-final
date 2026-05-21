import type { Request, Response, NextFunction } from 'express';
import { userService } from '@/services/userService';
import { auditService } from '@/services/auditService';
import { apiResponse } from '@/utils/apiResponse';
import { paginate } from '@/utils/pagination';

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
