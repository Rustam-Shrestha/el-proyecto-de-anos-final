import type { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '@/config/env';
import { AppError } from '@/utils/AppError';
import { prisma } from '@/config/database';
import { normalizeRoleName } from '@/utils/roles';

interface JwtPayload { sub: string; email: string; role: string; tenantId?: number; permissions?: string[] }

export async function requireSupercontroller(req: Request, _res: Response, next: NextFunction): Promise<void> {
  try {
    const header = req.headers.authorization;
    if (!header?.startsWith('Bearer ')) return next(new AppError('Unauthorized', 401));
    const token = header.slice(7);
    let decoded: JwtPayload;
    try { decoded = jwt.verify(token, env.JWT_ACCESS_SECRET) as JwtPayload; } catch { return next(new AppError('Invalid token', 401)); }

    // Platform access is granted ONLY to rows in public.supercontroller or to
    // the SUPERADMIN role. A tenant ADMIN must never reach platform routes —
    // that bypass was the "slug admin == finguard admin" bug.
    const isSuper = await (prisma as unknown as { supercontroller: { findUnique: (a: unknown) => Promise<unknown> } }).supercontroller.findUnique({ where: { email: decoded.email } }).then(Boolean).catch(() => false);
    const hasSuperRole = normalizeRoleName(decoded.role) === 'SUPERADMIN';
    if (!isSuper && !hasSuperRole) return next(new AppError('Supercontroller access required', 403));

    // attach supercontroller id if found
    if (isSuper) {
      const sc = await (prisma as unknown as { supercontroller: { findUnique: (a: unknown) => Promise<unknown> } }).supercontroller.findUnique({ where: { email: decoded.email } }).catch(() => null) as { id: number } | null;
      (req as unknown as Record<string, unknown>).supercontrollerId = sc?.id;
    }
    next();
  } catch (e) { next(e); }
}
