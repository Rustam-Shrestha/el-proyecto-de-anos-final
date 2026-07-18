import { Router } from 'express';
import { authenticate } from '@/middleware/auth';
import { authorize } from '@/middleware/rbac';
import { validate } from '@/middleware/requestValidation';
import { z } from 'zod';
import {
  getStats,
  getDashboard,
  getUsersWithKycStatus,
  getAuditLogs,
  getKycStats,
  getDocumentStats,
  getSystemStats,
} from '@/controllers/adminController';

const adminRouter = Router();

// Validation schemas for admin endpoints
const auditLogsSchema = z.object({
  query: z
    .object({
      page: z.coerce.number().min(1).default(1),
      limit: z.coerce.number().min(1).max(100).default(10),
      action: z.string().optional(),
      userId: z.string().optional(),
      startDate: z.string().datetime().optional(),
      endDate: z.string().datetime().optional(),
    })
    .optional(),
});

const usersKycSchema = z.object({
  query: z
    .object({
      page: z.coerce.number().min(1).default(1),
      limit: z.coerce.number().min(1).max(100).default(10),
      status: z
        .enum(['PENDING', 'UNDER_REVIEW', 'APPROVED', 'REJECTED', 'RESUBMIT_REQUIRED', 'NONE'])
        .optional(),
      search: z.string().max(255).optional(),
    })
    .optional(),
});

/**
 * @swagger
 * /api/v1/admin/dashboard:
 *   get:
 *     tags: [Admin]
 *     summary: Get admin dashboard with statistics
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Dashboard data retrieved successfully
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
 *                     stats:
 *                       type: object
 *                       properties:
 *                         users:
 *                           type: object
 *                           properties:
 *                             total:
 *                               type: integer
 *                             active:
 *                               type: integer
 *                             verified:
 *                               type: integer
 *                             unverified:
 *                               type: integer
 *                             percentage:
 *                               type: object
 *                         kyc:
 *                           type: object
 *                           properties:
 *                             total:
 *                               type: integer
 *                             pending:
 *                               type: integer
 *                             approved:
 *                               type: integer
 *                             rejected:
 *                               type: integer
 *                             percentage:
 *                               type: object
 *                         documents:
 *                           type: object
 *                     recentActivity:
 *                       type: object
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin access required
 */
adminRouter.get(
  '/dashboard',
  authenticate,
  authorize('ADMIN'),
  getDashboard
);

/**
 * @swagger
 * /api/v1/admin/users-kyc:
 *   get:
 *     tags: [Admin]
 *     summary: Get users with their KYC status
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
 *       - name: status
 *         in: query
 *         schema:
 *           type: string
 *           enum: [PENDING, UNDER_REVIEW, APPROVED, REJECTED, RESUBMIT_REQUIRED, NONE]
 *       - name: search
 *         in: query
 *         schema:
 *           type: string
 *           description: Search by email or full name
 *     responses:
 *       200:
 *         description: Users with KYC status retrieved
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
 *                     properties:
 *                       id:
 *                         type: string
 *                       email:
 *                         type: string
 *                       role:
 *                         type: string
 *                       fullName:
 *                         type: string
 *                       phone:
 *                         type: string
 *                       isVerified:
 *                         type: boolean
 *                       createdAt:
 *                         type: string
 *                       kyc:
 *                         type: object
 *                 meta:
 *                   type: object
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin access required
 */
adminRouter.get(
  '/users-kyc',
  authenticate,
  authorize('ADMIN'),
  validate(usersKycSchema),
  getUsersWithKycStatus
);

/**
 * @swagger
 * /api/v1/admin/audit:
 *   get:
 *     tags: [Admin]
 *     summary: Get audit logs with filtering and pagination
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
 *       - name: action
 *         in: query
 *         schema:
 *           type: string
 *           description: Filter by audit action
 *       - name: userId
 *         in: query
 *         schema:
 *           type: string
 *           format: uuid
 *       - name: startDate
 *         in: query
 *         schema:
 *           type: string
 *           format: date-time
 *       - name: endDate
 *         in: query
 *         schema:
 *           type: string
 *           format: date-time
 *     responses:
 *       200:
 *         description: Audit logs retrieved
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
 *                     properties:
 *                       id:
 *                         type: string
 *                       userId:
 *                         type: string
 *                       userEmail:
 *                         type: string
 *                       action:
 *                         type: string
 *                       metadata:
 *                         type: object
 *                       ip:
 *                         type: string
 *                       userAgent:
 *                         type: string
 *                       createdAt:
 *                         type: string
 *                 meta:
 *                   type: object
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin access required
 */
adminRouter.get(
  '/audit',
  authenticate,
  authorize('ADMIN'),
  validate(auditLogsSchema),
  getAuditLogs
);

/**
 * @swagger
 * /api/v1/admin/stats/kyc:
 *   get:
 *     tags: [Admin]
 *     summary: Get detailed KYC application statistics
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: KYC statistics retrieved
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
 *                     breakdown:
 *                       type: object
 *                       properties:
 *                         PENDING:
 *                           type: integer
 *                         UNDER_REVIEW:
 *                           type: integer
 *                         APPROVED:
 *                           type: integer
 *                         REJECTED:
 *                           type: integer
 *                         RESUBMIT_REQUIRED:
 *                           type: integer
 *                     total:
 *                       type: integer
 *                     recentApplications:
 *                       type: array
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin access required
 */
adminRouter.get(
  '/stats/kyc',
  authenticate,
  authorize('ADMIN'),
  getKycStats
);

/**
 * @swagger
 * /api/v1/admin/stats/documents:
 *   get:
 *     tags: [Admin]
 *     summary: Get document upload statistics
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Document statistics retrieved
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
 *                     total:
 *                       type: integer
 *                     totalSizeBytes:
 *                       type: integer
 *                     totalSizeMB:
 *                       type: number
 *                     byType:
 *                       type: object
 *                     byMimeType:
 *                       type: object
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin access required
 */
adminRouter.get(
  '/stats/documents',
  authenticate,
  authorize('ADMIN'),
  getDocumentStats
);

/**
 * @swagger
 * /api/v1/admin/stats/system:
 *   get:
 *     tags: [Admin]
 *     summary: Get system and activity statistics
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: System statistics retrieved
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
 *                     activity:
 *                       type: object
 *                       properties:
 *                         registrationsLast24h:
 *                           type: integer
 *                         registrationsLast7d:
 *                           type: integer
 *                         registrationsLast30d:
 *                           type: integer
 *                         loginsLast24h:
 *                           type: integer
 *                         kycSubmissionsLast24h:
 *                           type: integer
 *                         uploadsLast24h:
 *                           type: integer
 *                     system:
 *                       type: object
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin access required
 */
adminRouter.get(
  '/stats/system',
  authenticate,
  authorize('ADMIN'),
  getSystemStats
);

adminRouter.get(
  '/stats',
  authenticate,
  authorize('ADMIN'),
  getStats
);

export default adminRouter;
