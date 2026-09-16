import type { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '@/config/env';
import { AppError } from '@/utils/AppError';
import { prisma } from '@/config/database';

interface JwtPayload { sub: string; email: string; role: string; tenantId?: number; permissions?: string[] }

export async function requireSupercontroller(req: Request, _res: Response, next: NextFunction): Promise<void> {
  try {
    const header = req.headers.authorization;
    if (!header?.startsWith('Bearer ')) return next(new AppError('Unauthorized', 401));
    const token = header.slice(7);
    let decoded: JwtPayload;
    try { decoded = jwt.verify(token, env.JWT_ACCESS_SECRET) as JwtPayload; } catch { return next(new AppError('Invalid token', 401)); }

    // supercontroller is also stored in public.supercontroller - check if email exists there
    const isSuper = await (prisma as unknown as { supercontroller: { findUnique: (a: unknown) => Promise<unknown> } }).supercontroller.findUnique({ where: { email: decoded.email } }).then(Boolean).catch(() => false);
    // also allow legacy ADMIN with tenantId undefined or role hierarchyLevel 0
    const hasPerm = decoded.permissions?.includes('tenants.create') || decoded.permissions?.includes('tenants.read') || decoded.role === 'ADMIN' || decoded.role === 'Supercontroller';
    if (!isSuper && !hasPerm) return next(new AppError('Supercontroller access required', 403));

    // attach supercontroller id if found
    if (isSuper) {
      const sc = await (prisma as unknown as { supercontroller: { findUnique: (a: unknown) => Promise<unknown> } }).supercontroller.findUnique({ where: { email: decoded.email } }).catch(() => null) as { id: number } | null;
      (req as unknown as Record<string, unknown>).supercontrollerId = sc?.id;
    }
    next();
  } catch (e) { next(e); }
}
