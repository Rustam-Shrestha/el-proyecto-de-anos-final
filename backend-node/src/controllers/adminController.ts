import type { Request, Response, NextFunction } from 'express';
import { prisma } from '@/config/database';
import { apiResponse } from '@/utils/apiResponse';
import { paginate } from '@/utils/pagination';
import { logger } from '@/config/logger';
import { AppError } from '@/utils/AppError';

/**
 * GET /api/v1/admin/stats
 * Get unified admin statistics
 */
export const getStats = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const [totalUsers, kycStats, loanStats] = await Promise.all([
      prisma.user.count({ where: { isDeleted: false } }),
      prisma.kycApplication.groupBy({
        by: ['status'],
        _count: { status: true },
      }),
      prisma.loanApplication.groupBy({
        by: ['status'],
        _count: { status: true },
      }),
    ]);

    const mapStatus = (stats: Array<{ status: string; _count: { status: number } }>, status: string) =>
      stats.find((s) => s.status === status)?._count.status ?? 0;

    const data = {
      totalUsers,
      pendingKyc: mapStatus(kycStats, 'PENDING'),
      approvedKyc: mapStatus(kycStats, 'APPROVED'),
      rejectedKyc: mapStatus(kycStats, 'REJECTED'),
      pendingLoans: mapStatus(loanStats, 'SUBMITTED'),
      approvedLoans: mapStatus(loanStats, 'APPROVED'),
      rejectedLoans: mapStatus(loanStats, 'REJECTED'),
      totalLoans: loanStats.reduce((sum: number, s: { _count: { status: number } }) => sum + s._count.status, 0),
    };

    res.json(apiResponse.success('Admin statistics retrieved', data));
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/v1/admin/dashboard
 * Get admin dashboard statistics
 */
export const getDashboard = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json(apiResponse.error('Authentication required', 401));
      return;
    }

    // Fetch all stats in parallel
    const [
      totalUsers,
      activeUsers,
      verifiedUsers,
      totalKycApplications,
      pendingKycCount,
      approvedKycCount,
      rejectedKycCount,
      totalDocuments,
      recentAuditLogs,
      recentKycApplications,
    ] = await Promise.all([
      // User stats
      prisma.user.count({
        where: { isDeleted: false },
      }),
      prisma.user.count({
        where: {
          isDeleted: false,
          sessions: {
            some: {
              expiresAt: { gt: new Date() },
              isRevoked: false,
            },
          },
        },
      }),
      prisma.user.count({
        where: { isVerified: true, isDeleted: false },
      }),

      // KYC stats
      prisma.kycApplication.count(),
      prisma.kycApplication.count({
        where: { status: 'PENDING' },
      }),
      prisma.kycApplication.count({
        where: { status: 'APPROVED' },
      }),
      prisma.kycApplication.count({
        where: { status: 'REJECTED' },
      }),

      // Document stats
      prisma.document.count({
        where: { isDeleted: false },
      }),

      // Recent audit logs (last 10)
      prisma.auditLog.findMany({
        orderBy: { createdAt: 'desc' },
        take: 10,
        include: {
          user: {
            select: { id: true, email: true },
          },
        },
      }),

      // Recent KYC applications (last 5)
      prisma.kycApplication.findMany({
        orderBy: { submittedAt: 'desc' },
        take: 5,
        include: {
          user: {
            select: { id: true, email: true },
          },
        },
      }),
    ]);

    const dashboard = {
      stats: {
        users: {
          total: totalUsers,
          active: activeUsers,
          verified: verifiedUsers,
          unverified: totalUsers - verifiedUsers,
          percentage: {
            verified: totalUsers > 0 ? Math.round((verifiedUsers / totalUsers) * 100) : 0,
          },
        },
        kyc: {
          total: totalKycApplications,
          pending: pendingKycCount,
          approved: approvedKycCount,
          rejected: rejectedKycCount,
          percentage: {
            approved: totalKycApplications > 0 ? Math.round((approvedKycCount / totalKycApplications) * 100) : 0,
            pending: totalKycApplications > 0 ? Math.round((pendingKycCount / totalKycApplications) * 100) : 0,
            rejected: totalKycApplications > 0 ? Math.round((rejectedKycCount / totalKycApplications) * 100) : 0,
          },
        },
        documents: {
          total: totalDocuments,
        },
      },
      recentActivity: {
        auditLogs: recentAuditLogs.map((log) => ({
          id: log.id,
          userId: log.userId,
          userEmail: log.user?.email,
          action: log.action,
          createdAt: log.createdAt,
          metadata: log.metadata,
        })),
        kycApplications: recentKycApplications.map((kyc) => ({
          id: kyc.id,
          userId: kyc.userId,
          userEmail: kyc.user?.email,
          status: kyc.status,
          submittedAt: kyc.submittedAt,
          reviewedAt: kyc.reviewedAt,
        })),
      },
    };

    res.json(apiResponse.success('Dashboard data retrieved', dashboard));
  } catch (error) {
    logger.error({ err: error }, 'Failed to fetch dashboard data');
    next(new AppError('Failed to fetch dashboard data', 500));
  }
};

/**
 * GET /api/v1/admin/users-kyc
 * Get list of users with their KYC status (joined)
 */
export const getUsersWithKycStatus = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { skip, take, page, limit } = paginate(req.query);
    const status = (req.query.status as string) || undefined; // Filter by KYC status
    const search = (req.query.search as string) || undefined; // Search by email or full name

    // Build where clause
    const where: any = {
      isDeleted: false,
    };

    if (search) {
      where.OR = [
        { email: { contains: search, mode: 'insensitive' } },
        { profile: { fullName: { contains: search, mode: 'insensitive' } } },
      ];
    }

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: 'desc' },
        include: {
          profile: {
            select: {
              fullName: true,
              phone: true,
              avatarUrl: true,
            },
          },
          role: {
            select: { name: true },
          },
          kycApplications: {
            select: {
              id: true,
              status: true,
              submittedAt: true,
              reviewedAt: true,
              rejectionReason: true,
            },
            // Get only the latest KYC application
            orderBy: { submittedAt: 'desc' },
            take: 1,
          },
        },
      }),
      prisma.user.count({ where }),
    ]);

    // Filter by KYC status if requested
    let filteredUsers = users;
    if (status) {
      filteredUsers = users.filter((user) => {
        const latestKyc = user.kycApplications[0];
        if (!latestKyc) {
          return status === 'NONE';
        }
        return latestKyc.status === status;
      });
    }

    const data = filteredUsers.map((user) => {
      const latestKyc = user.kycApplications[0];
      return {
        id: user.id,
        email: user.email,
        role: user.role.name,
        fullName: user.profile?.fullName,
        phone: user.profile?.phone,
        isVerified: user.isVerified,
        createdAt: user.createdAt,
        kyc: latestKyc ? {
          id: latestKyc.id,
          status: latestKyc.status,
          submittedAt: latestKyc.submittedAt,
          reviewedAt: latestKyc.reviewedAt,
          rejectionReason: latestKyc.rejectionReason,
        } : null,
      };
    });

    res.json(
      apiResponse.paginated(
        'Users with KYC status retrieved',
        data,
        page,
        limit,
        status ? filteredUsers.length : total
      )
    );
  } catch (error) {
    logger.error({ err: error }, 'Failed to fetch users with KYC status');
    next(new AppError('Failed to fetch user data', 500));
  }
};

/**
 * GET /api/v1/admin/audit
 * Get audit logs with pagination and filtering
 */
export const getAuditLogs = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { skip, take, page, limit } = paginate(req.query);
    const action = (req.query.action as string) || undefined;
    const userId = (req.query.userId as string) || undefined;
    const startDate = (req.query.startDate as string) || undefined;
    const endDate = (req.query.endDate as string) || undefined;

    // Build where clause
    const where: any = {};

    if (action) {
      where.action = action;
    }

    if (userId) {
      where.userId = userId;
    }

    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) {
        where.createdAt.gte = new Date(startDate);
      }
      if (endDate) {
        where.createdAt.lte = new Date(endDate);
      }
    }

    const [logs, total] = await Promise.all([
      prisma.auditLog.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: 'desc' },
        include: {
          user: {
            select: {
              id: true,
              email: true,
            },
          },
        },
      }),
      prisma.auditLog.count({ where }),
    ]);

    const data = logs.map((log) => ({
      id: log.id,
      userId: log.userId,
      userEmail: log.user?.email,
      action: log.action,
      metadata: log.metadata,
      ip: log.ip,
      userAgent: log.userAgent,
      createdAt: log.createdAt,
    }));

    res.json(
      apiResponse.paginated(
        'Audit logs retrieved',
        data,
        page,
        limit,
        total
      )
    );
  } catch (error) {
    logger.error({ err: error }, 'Failed to fetch audit logs');
    next(new AppError('Failed to fetch audit logs', 500));
  }
};

/**
 * GET /api/v1/admin/stats/kyc
 * Get detailed KYC statistics
 */
export const getKycStats = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const kycStats = await Promise.all([
      prisma.kycApplication.groupBy({
        by: ['status'],
        _count: {
          id: true,
        },
      }),
      prisma.kycApplication.findMany({
        select: {
          id: true,
          status: true,
          submittedAt: true,
          reviewedAt: true,
          userId: true,
          user: {
            select: {
              email: true,
            },
          },
        },
        orderBy: { submittedAt: 'desc' },
        take: 20,
      }),
    ]);

    const [statusCounts, recentApplications] = kycStats;

    // Format status counts
    const statusBreakdown: Record<string, number> = {
      PENDING: 0,
      UNDER_REVIEW: 0,
      APPROVED: 0,
      REJECTED: 0,
      RESUBMIT_REQUIRED: 0,
    };

    statusCounts.forEach((item) => {
      if (item.status in statusBreakdown) {
        statusBreakdown[item.status] = item._count.id;
      }
    });

    const stats = {
      breakdown: statusBreakdown,
      total: Object.values(statusBreakdown).reduce((a, b) => a + b, 0),
      averageReviewTime: null as number | null,
      recentApplications: recentApplications.map((app) => ({
        id: app.id,
        status: app.status,
        userEmail: app.user.email,
        submittedAt: app.submittedAt,
        reviewedAt: app.reviewedAt,
        daysToReview: app.reviewedAt
          ? Math.floor((app.reviewedAt.getTime() - app.submittedAt.getTime()) / (1000 * 60 * 60 * 24))
          : null,
      })),
    };

    res.json(apiResponse.success('KYC statistics retrieved', stats));
  } catch (error) {
    logger.error({ err: error }, 'Failed to fetch KYC statistics');
    next(new AppError('Failed to fetch KYC statistics', 500));
  }
};

/**
 * GET /api/v1/admin/stats/documents
 * Get document upload statistics
 */
export const getDocumentStats = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const [
      totalDocuments,
      documentsByType,
      totalSizeBytes,
      documentsByMime,
    ] = await Promise.all([
      prisma.document.count({
        where: { isDeleted: false },
      }),
      prisma.document.groupBy({
        by: ['type'],
        _count: {
          id: true,
        },
        where: { isDeleted: false },
      }),
      prisma.document.aggregate({
        _sum: {
          sizeBytes: true,
        },
        where: { isDeleted: false },
      }),
      prisma.document.groupBy({
        by: ['mimeType'],
        _count: {
          id: true,
        },
        where: { isDeleted: false },
      }),
    ]);

    const stats = {
      total: totalDocuments,
      totalSizeBytes: totalSizeBytes._sum.sizeBytes || 0,
      totalSizeMB: Math.round((totalSizeBytes._sum.sizeBytes || 0) / (1024 * 1024)),
      byType: documentsByType.reduce(
        (acc, item) => {
          acc[item.type] = item._count.id;
          return acc;
        },
        {} as Record<string, number>
      ),
      byMimeType: documentsByMime.reduce(
        (acc, item) => {
          acc[item.mimeType] = item._count.id;
          return acc;
        },
        {} as Record<string, number>
      ),
    };

    res.json(apiResponse.success('Document statistics retrieved', stats));
  } catch (error) {
    logger.error({ err: error }, 'Failed to fetch document statistics');
    next(new AppError('Failed to fetch document statistics', 500));
  }
};

/**
 * GET /api/v1/admin/stats/system
 * Get system and performance statistics
 */
export const getSystemStats = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const now = new Date();
    const last24h = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const last7d = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const last30d = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const [
      registrationsLast24h,
      registrationsLast7d,
      registrationsLast30d,
      loginsLast24h,
      kycSubmissionsLast24h,
      uploadsLast24h,
      sessionsActive,
    ] = await Promise.all([
      prisma.auditLog.count({
        where: {
          action: 'REGISTER',
          createdAt: { gte: last24h },
        },
      }),
      prisma.auditLog.count({
        where: {
          action: 'REGISTER',
          createdAt: { gte: last7d },
        },
      }),
      prisma.auditLog.count({
        where: {
          action: 'REGISTER',
          createdAt: { gte: last30d },
        },
      }),
      prisma.auditLog.count({
        where: {
          action: 'LOGIN',
          createdAt: { gte: last24h },
        },
      }),
      prisma.auditLog.count({
        where: {
          action: 'SUBMIT_KYC',
          createdAt: { gte: last24h },
        },
      }),
      prisma.auditLog.count({
        where: {
          action: 'UPLOAD',
          createdAt: { gte: last24h },
        },
      }),
      prisma.session.count({
        where: {
          isRevoked: false,
          expiresAt: { gt: now },
        },
      }),
    ]);

    const stats = {
      activity: {
        registrationsLast24h,
        registrationsLast7d,
        registrationsLast30d,
        loginsLast24h,
        kycSubmissionsLast24h,
        uploadsLast24h,
      },
      system: {
        activeSessionsCount: sessionsActive,
        timestamp: now.toISOString(),
      },
    };

    res.json(apiResponse.success('System statistics retrieved', stats));
  } catch (error) {
    logger.error({ err: error }, 'Failed to fetch system statistics');
    next(new AppError('Failed to fetch system statistics', 500));
  }
};
