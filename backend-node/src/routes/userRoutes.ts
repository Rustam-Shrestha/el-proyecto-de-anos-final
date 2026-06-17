import { Router } from 'express';
import { authenticate } from '@/middleware/auth';
import { authorize } from '@/middleware/rbac';
import { validate } from '@/middleware/requestValidation';
import { avatarUpload } from '@/middleware/avatarUpload';
import {
  listUsersSchema,
  getUserByIdSchema,
  updateUserSchema,
  updateUserRoleSchema,
  updateUserProfileSchema,
  deleteUserSchema,
} from '@/routes/schemas';
import {
  getMe,
  updateMe,
  uploadAvatar,
  deleteAvatar,
  listUsers,
  getUser,
  updateProfile,
  changeUserRole,
  deleteUser,
} from '@/controllers/userController';

const userRouter = Router();

/**
 * @swagger
 * /api/v1/users/me:
 *   get:
 *     tags: [Users]
 *     summary: Get current user's profile
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User profile retrieved
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                       format: uuid
 *                     email:
 *                       type: string
 *                     role:
 *                       type: string
 *                     isVerified:
 *                       type: boolean
 *                     createdAt:
 *                       type: string
 *                       format: date-time
 *       401:
 *         description: Unauthorized
 */
userRouter.get('/me', authenticate, getMe);

/**
 * @swagger
 * /api/v1/users/me:
 *   patch:
 *     tags: [Users]
 *     summary: Update current user's profile
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               fullName:
 *                 type: string
 *               phone:
 *                 type: string
 *               address:
 *                 type: string
 *     responses:
 *       200:
 *         description: Profile updated successfully
 *       400:
 *         description: Invalid input
 *       401:
 *         description: Unauthorized
 */
userRouter.patch('/me', authenticate, validate(updateUserSchema), updateMe);

userRouter.patch(
  '/me/avatar',
  authenticate,
  (req, res, next) => {
    avatarUpload.single('avatar')(req, res, (err: unknown) => {
      if (err) return next(err);
      next();
    });
  },
  uploadAvatar
);

userRouter.delete('/me/avatar', authenticate, deleteAvatar);

/**
 * @swagger
 * /api/v1/users:
 *   get:
 *     tags: [Users]
 *     summary: List all users (paginated)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: page
 *         in: query
 *         schema:
 *           type: integer
 *           default: 1
 *       - name: limit
 *         in: query
 *         schema:
 *           type: integer
 *           default: 10
 *       - name: search
 *         in: query
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Users listed successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                 meta:
 *                   type: object
 *                   properties:
 *                     page:
 *                       type: integer
 *                     limit:
 *                       type: integer
 *                     total:
 *                       type: integer
 *                     pages:
 *                       type: integer
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin access required
 */
userRouter.get(
  '/',
  authenticate,
  authorize('ADMIN'),
  validate(listUsersSchema),
  listUsers
);

/**
 * @swagger
 * /api/v1/users/{id}:
 *   get:
 *     tags: [Users]
 *     summary: Get a specific user by ID
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: User retrieved
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: User not found
 */
userRouter.get(
  '/:id',
  authenticate,
  authorize('ADMIN'),
  validate(getUserByIdSchema),
  getUser
);

/**
 * @swagger
 * /api/v1/users/{id}/profile:
 *   patch:
 *     tags: [Users]
 *     summary: Update user profile (admin)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               firstName:
 *                 type: string
 *               lastName:
 *                 type: string
 *               phoneNumber:
 *                 type: string
 *     responses:
 *       200:
 *         description: Profile updated successfully
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: User not found
 */
userRouter.patch(
  '/:id/profile',
  authenticate,
  authorize('ADMIN'),
  validate(updateUserProfileSchema),
  updateProfile
);

/**
 * @swagger
 * /api/v1/users/{id}/role:
 *   patch:
 *     tags: [Users]
 *     summary: Change user role
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               role:
 *                 type: string
 *                 enum: [USER, ADMIN, REVIEWER]
 *     responses:
 *       200:
 *         description: User role updated
 *       400:
 *         description: Invalid role
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: User not found
 */
userRouter.patch(
  '/:id/role',
  authenticate,
  authorize('ADMIN'),
  validate(updateUserRoleSchema),
  changeUserRole
);

/**
 * @swagger
 * /api/v1/users/{id}:
 *   delete:
 *     tags: [Users]
 *     summary: Delete a user (soft delete)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: User deleted
 *       400:
 *         description: Cannot delete own account
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: User not found
 */
userRouter.delete(
  '/:id',
  authenticate,
  authorize('ADMIN'),
  validate(deleteUserSchema),
  deleteUser
);

export default userRouter;
