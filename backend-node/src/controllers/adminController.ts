import type { Request, Response, NextFunction } from 'express';
import { prisma } from '@/config/database';
import { apiResponse } from '@/utils/apiResponse';
import { paginate } from '@/utils/pagination';
import { logger } from '@/config/logger';
import { AppError } from '@/utils/AppError';

function isTenantSchemaError(e: unknown): boolean {
  const code = (e as { code?: string })?.code;
  const msg = String((e as { message?: string })?.message ?? (e as Error)?.message ?? "");
  return code === "P2021" || code === "P2022" || msg.includes("tenantId") || msg.includes("tenant_id") || msg.includes("does not exist");
}
function isSuperController(req: Request): boolean {
  const role = req.user?.role?.toUpperCase();
  if (role === 'SUPERCONTROLLER' || role === 'SUPER_ADMIN' || role === 'SUPER') return true;
  const header = (req.headers['x-supercontroller-token'] as string | undefined);
  if (header) return true;
  // also allow explicit flag
  if ((req as unknown as { isSupercontroller?: boolean }).isSupercontroller) return true;
  return false;
}
function resolveTenantFilter(req: Request): number | undefined {
  if (isSuperController(req)) return undefined;
  const tid = (req as unknown as { tenantId?: number }).tenantId ?? req.user?.tenantId ?? 1;
  // if tid is 1 by fallback but super not, still return 1 to enforce isolation
  if ((req as unknown as { tenantId?: number }).tenantId === undefined && req.user?.tenantId === undefined) {
    logger.warn("adminController: tenantId not provided, falling back to 1");
  }
  return tid;
}

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
    const tid = resolveTenantFilter(req);
    const userWhere = tid !== undefined ? { isDeleted: false, tenantId: tid } : { isDeleted: false };
    const kycWhere = tid !== undefined ? { tenantId: tid } : {};
    const loanWhere = tid !== undefined ? { tenantId: tid } : {};
    let totalUsers: number;
    let kycStats: Array<{ status: string; _count: { status: number } }>;
    let loanStats: Array<{ status: string; _count: { status: number } }>;
    try {
      [totalUsers, kycStats, loanStats] = await Promise.all([
        prisma.user.count({ where: userWhere as never }),
        prisma.kycApplication.groupBy({ by: ['status'], where: kycWhere as never, _count: { status: true } }) as never,
        prisma.loanApplication.groupBy({ by: ['status'], where: loanWhere as never, _count: { status: true } }) as never,
      ]);
    } catch (e) {
      if (isTenantSchemaError(e)) {
        [totalUsers, kycStats, loanStats] = await Promise.all([
          prisma.user.count({ where: { isDeleted: false } }),
          prisma.kycApplication.groupBy({ by: ['status'], _count: { status: true } }) as never,
          prisma.loanApplication.groupBy({ by: ['status'], _count: { status: true } }) as never,
        ]);
      } else throw e;
    }

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

    const tid = resolveTenantFilter(req);
    const userTenantFilter = tid !== undefined ? { tenantId: tid } : {};
    const kycTenantFilter = tid !== undefined ? { tenantId: tid } : {};
    const docTenantFilter = tid !== undefined ? { tenantId: tid, isDeleted: false } : { isDeleted: false };
    const auditTenantFilter = tid !== undefined ? { tenantId: tid } : {};

    // Fetch all stats in parallel
    let totalUsers: number;
    let activeUsers: number;
    let verifiedUsers: number;
    let totalKycApplications: number;
    let pendingKycCount: number;
    let approvedKycCount: number;
    let rejectedKycCount: number;
    let totalDocuments: number;
    let recentAuditLogs: Awaited<ReturnType<typeof prisma.auditLog.findMany>>;
    let recentKycApplications: Awaited<ReturnType<typeof prisma.kycApplication.findMany>>;
    try {
      [
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
        prisma.user.count({ where: { isDeleted: false, ...userTenantFilter } as never }),
        prisma.user.count({ where: { isDeleted: false, ...userTenantFilter, sessions: { some: { expiresAt: { gt: new Date() }, isRevoked: false } } } as never }),
        prisma.user.count({ where: { isVerified: true, isDeleted: false, ...userTenantFilter } as never }),
        prisma.kycApplication.count({ where: kycTenantFilter as never }),
        prisma.kycApplication.count({ where: { status: 'PENDING', ...kycTenantFilter } as never }),
        prisma.kycApplication.count({ where: { status: 'APPROVED', ...kycTenantFilter } as never }),
        prisma.kycApplication.count({ where: { status: 'REJECTED', ...kycTenantFilter } as never }),
        prisma.document.count({ where: docTenantFilter as never }),
        prisma.auditLog.findMany({ where: auditTenantFilter as never, orderBy: { createdAt: 'desc' }, take: 10, include: { user: { select: { id: true, email: true } } } }),
        prisma.kycApplication.findMany({ where: kycTenantFilter as never, orderBy: { submittedAt: 'desc' }, take: 5, include: { user: { select: { id: true, email: true } } } }),
      ]);
    } catch (e) {
      if (isTenantSchemaError(e)) {
        [
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
          prisma.user.count({ where: { isDeleted: false } }),
          prisma.user.count({ where: { isDeleted: false, sessions: { some: { expiresAt: { gt: new Date() }, isRevoked: false } } } }),
          prisma.user.count({ where: { isVerified: true, isDeleted: false } }),
          prisma.kycApplication.count(),
          prisma.kycApplication.count({ where: { status: 'PENDING' } }),
          prisma.kycApplication.count({ where: { status: 'APPROVED' } }),
          prisma.kycApplication.count({ where: { status: 'REJECTED' } }),
          prisma.document.count({ where: { isDeleted: false } }),
          prisma.auditLog.findMany({ orderBy: { createdAt: 'desc' }, take: 10, include: { user: { select: { id: true, email: true } } } }),
          prisma.kycApplication.findMany({ orderBy: { submittedAt: 'desc' }, take: 5, include: { user: { select: { id: true, email: true } } } }),
        ]);
      } else throw e;
    }

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
          userEmail: (kyc as unknown as { user?: { email?: string } }).user?.email,
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
    const tid = resolveTenantFilter(req);
    const { skip, take, page, limit } = paginate(req.query);
    const status = (req.query.status as string) || undefined;
    const search = (req.query.search as string) || undefined;

    const where: Record<string, unknown> = {
      isDeleted: false,
      ...(tid !== undefined ? { tenantId: tid } : {}),
    };

    if (search) {
      where.OR = [
        { email: { contains: search, mode: 'insensitive' } },
        { profile: { fullName: { contains: search, mode: 'insensitive' } } },
      ];
    }

    let users: Awaited<ReturnType<typeof prisma.user.findMany>>;
    let total: number;
    try {
      [users, total] = await Promise.all([
        prisma.user.findMany({
          where: where as never,
          skip,
          take,
          orderBy: { createdAt: 'desc' },
          include: {
            profile: { select: { fullName: true, phone: true, avatarUrl: true } },
            role: { select: { name: true } },
            kycApplications: { select: { id: true, status: true, submittedAt: true, reviewedAt: true, rejectionReason: true }, orderBy: { submittedAt: 'desc' }, take: 1 },
          },
        }),
        prisma.user.count({ where: where as never }),
      ]);
    } catch (e) {
      if (isTenantSchemaError(e)) {
        const fallbackWhere: Record<string, unknown> = { isDeleted: false };
        if (search) fallbackWhere.OR = where.OR;
        [users, total] = await Promise.all([
          prisma.user.findMany({ where: fallbackWhere as never, skip, take, orderBy: { createdAt: 'desc' }, include: { profile: { select: { fullName: true, phone: true, avatarUrl: true } }, role: { select: { name: true } }, kycApplications: { select: { id: true, status: true, submittedAt: true, reviewedAt: true, rejectionReason: true }, orderBy: { submittedAt: 'desc' }, take: 1 } } }),
          prisma.user.count({ where: fallbackWhere as never }),
        ]);
      } else throw e;
    }

    let filteredUsers = users;
    if (status) {
      filteredUsers = users.filter((user) => {
        const latestKyc = (user as unknown as { kycApplications: Array<{ status: string }> }).kycApplications[0];
        if (!latestKyc) return status === 'NONE';
        return latestKyc.status === status;
      });
    }

    const data = filteredUsers.map((user) => {
      const latestKyc = (user as unknown as { kycApplications: Array<{ id: string; status: string; submittedAt: Date; reviewedAt: Date | null; rejectionReason: string | null }> }).kycApplications[0];
      return {
        id: user.id,
        email: user.email,
        role: (user as unknown as { role: { name: string } }).role.name,
        fullName: (user as unknown as { profile?: { fullName?: string } }).profile?.fullName,
        phone: (user as unknown as { profile?: { phone?: string } }).profile?.phone,
        isVerified: user.isVerified,
        createdAt: user.createdAt,
        kyc: latestKyc ? { id: latestKyc.id, status: latestKyc.status, submittedAt: latestKyc.submittedAt, reviewedAt: latestKyc.reviewedAt, rejectionReason: latestKyc.rejectionReason } : null,
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
    const tid = resolveTenantFilter(req);
    const { skip, take, page, limit } = paginate(req.query);
    const action = (req.query.action as string) || undefined;
    const userId = (req.query.userId as string) || undefined;
    const startDate = (req.query.startDate as string) || undefined;
    const endDate = (req.query.endDate as string) || undefined;

    const where: { action?: string; userId?: string; tenantId?: number; createdAt?: { gte?: Date; lte?: Date } } = {};
    if (tid !== undefined) where.tenantId = tid;
    if (action) where.action = action;
    if (userId) where.userId = userId;
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = new Date(startDate);
      if (endDate) where.createdAt.lte = new Date(endDate);
    }

    let logs: Awaited<ReturnType<typeof prisma.auditLog.findMany>>;
    let total: number;
    try {
      [logs, total] = await Promise.all([
        prisma.auditLog.findMany({ where: where as never, skip, take, orderBy: { createdAt: 'desc' }, include: { user: { select: { id: true, email: true } } } }),
        prisma.auditLog.count({ where: where as never }),
      ]);
    } catch (e) {
      if (isTenantSchemaError(e)) {
        const fallbackWhere: Record<string, unknown> = {};
        if (action) fallbackWhere.action = action;
        if (userId) fallbackWhere.userId = userId;
        if (startDate || endDate) {
          fallbackWhere.createdAt = {};
          if (startDate) (fallbackWhere.createdAt as Record<string, Date>).gte = new Date(startDate);
          if (endDate) (fallbackWhere.createdAt as Record<string, Date>).lte = new Date(endDate);
        }
        [logs, total] = await Promise.all([
          prisma.auditLog.findMany({ where: fallbackWhere as never, skip, take, orderBy: { createdAt: 'desc' }, include: { user: { select: { id: true, email: true } } } }),
          prisma.auditLog.count({ where: fallbackWhere as never }),
        ]);
      } else throw e;
    }

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
    const tid = resolveTenantFilter(req);
    const kycWhere = tid !== undefined ? { tenantId: tid } : {};
    let kycStats: [Awaited<ReturnType<typeof prisma.kycApplication.groupBy>>, Awaited<ReturnType<typeof prisma.kycApplication.findMany>>];
    try {
      kycStats = await Promise.all([
        prisma.kycApplication.groupBy({ by: ['status'], where: kycWhere as never, _count: { id: true } }) as never,
        prisma.kycApplication.findMany({ where: kycWhere as never, select: { id: true, status: true, submittedAt: true, reviewedAt: true, userId: true, user: { select: { email: true } } }, orderBy: { submittedAt: 'desc' }, take: 20 }) as never,
      ]);
    } catch (e) {
      if (isTenantSchemaError(e)) {
        kycStats = await Promise.all([
          prisma.kycApplication.groupBy({ by: ['status'], _count: { id: true } }) as never,
          prisma.kycApplication.findMany({ select: { id: true, status: true, submittedAt: true, reviewedAt: true, userId: true, user: { select: { email: true } } }, orderBy: { submittedAt: 'desc' }, take: 20 }) as never,
        ]);
      } else throw e;
    }

    const [statusCounts, recentApplications] = kycStats;

    const statusBreakdown: Record<string, number> = {
      PENDING: 0,
      UNDER_REVIEW: 0,
      APPROVED: 0,
      REJECTED: 0,
      RESUBMIT_REQUIRED: 0,
    };

    (statusCounts as Array<{ status: string; _count: { id: number } }>).forEach((item) => {
      if (item.status in statusBreakdown) {
        statusBreakdown[item.status] = item._count.id;
      }
    });

    const stats = {
      breakdown: statusBreakdown,
      total: Object.values(statusBreakdown).reduce((a, b) => a + b, 0),
      averageReviewTime: null as number | null,
      recentApplications: (recentApplications as Array<{ id: string; status: string; submittedAt: Date; reviewedAt: Date | null; user: { email: string } }>).map((app) => ({
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
    const tid = resolveTenantFilter(req);
    const docWhere = tid !== undefined ? { isDeleted: false, tenantId: tid } : { isDeleted: false };
    let totalDocuments: number;
    let documentsByType: Array<{ type: string; _count: { id: number } }>;
    let totalSizeBytes: { _sum: { sizeBytes: number | null } };
    let documentsByMime: Array<{ mimeType: string; _count: { id: number } }>;
    try {
      [
        totalDocuments,
        documentsByType,
        totalSizeBytes,
        documentsByMime,
      ] = await Promise.all([
        prisma.document.count({ where: docWhere as never }),
        prisma.document.groupBy({ by: ['type'], where: docWhere as never, _count: { id: true } }) as never,
        prisma.document.aggregate({ where: docWhere as never, _sum: { sizeBytes: true } }) as never,
        prisma.document.groupBy({ by: ['mimeType'], where: docWhere as never, _count: { id: true } }) as never,
      ]);
    } catch (e) {
      if (isTenantSchemaError(e)) {
        const fallbackWhere = { isDeleted: false };
        [
          totalDocuments,
          documentsByType,
          totalSizeBytes,
          documentsByMime,
        ] = await Promise.all([
          prisma.document.count({ where: fallbackWhere }),
          prisma.document.groupBy({ by: ['type'], where: fallbackWhere, _count: { id: true } }) as never,
          prisma.document.aggregate({ where: fallbackWhere, _sum: { sizeBytes: true } }) as never,
          prisma.document.groupBy({ by: ['mimeType'], where: fallbackWhere, _count: { id: true } }) as never,
        ]);
      } else throw e;
    }

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
    const tid = resolveTenantFilter(req);
    const now = new Date();
    const last24h = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const last7d = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const last30d = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const auditTenant = tid !== undefined ? { tenantId: tid } : {};
    let registrationsLast24h: number;
    let registrationsLast7d: number;
    let registrationsLast30d: number;
    let loginsLast24h: number;
    let kycSubmissionsLast24h: number;
    let uploadsLast24h: number;
    let sessionsActive: number;
    try {
      [
        registrationsLast24h,
        registrationsLast7d,
        registrationsLast30d,
        loginsLast24h,
        kycSubmissionsLast24h,
        uploadsLast24h,
        sessionsActive,
      ] = await Promise.all([
        prisma.auditLog.count({ where: { action: 'REGISTER', createdAt: { gte: last24h }, ...auditTenant } as never }),
        prisma.auditLog.count({ where: { action: 'REGISTER', createdAt: { gte: last7d }, ...auditTenant } as never }),
        prisma.auditLog.count({ where: { action: 'REGISTER', createdAt: { gte: last30d }, ...auditTenant } as never }),
        prisma.auditLog.count({ where: { action: 'LOGIN', createdAt: { gte: last24h }, ...auditTenant } as never }),
        prisma.auditLog.count({ where: { action: 'SUBMIT_KYC', createdAt: { gte: last24h }, ...auditTenant } as never }),
        prisma.auditLog.count({ where: { action: 'UPLOAD', createdAt: { gte: last24h }, ...auditTenant } as never }),
        prisma.session.count({ where: { isRevoked: false, expiresAt: { gt: now } } }),
      ]);
    } catch (e) {
      if (isTenantSchemaError(e)) {
        [
          registrationsLast24h,
          registrationsLast7d,
          registrationsLast30d,
          loginsLast24h,
          kycSubmissionsLast24h,
          uploadsLast24h,
          sessionsActive,
        ] = await Promise.all([
          prisma.auditLog.count({ where: { action: 'REGISTER', createdAt: { gte: last24h } } }),
          prisma.auditLog.count({ where: { action: 'REGISTER', createdAt: { gte: last7d } } }),
          prisma.auditLog.count({ where: { action: 'REGISTER', createdAt: { gte: last30d } } }),
          prisma.auditLog.count({ where: { action: 'LOGIN', createdAt: { gte: last24h } } }),
          prisma.auditLog.count({ where: { action: 'SUBMIT_KYC', createdAt: { gte: last24h } } }),
          prisma.auditLog.count({ where: { action: 'UPLOAD', createdAt: { gte: last24h } } }),
          prisma.session.count({ where: { isRevoked: false, expiresAt: { gt: now } } }),
        ]);
      } else throw e;
    }

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
