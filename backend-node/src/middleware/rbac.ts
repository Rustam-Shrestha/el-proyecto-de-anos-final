import type { Request, Response, NextFunction } from 'express';
import { AppError } from '@/utils/AppError';
import { logger } from '@/config/logger';
import { normalizeRoleName } from '@/utils/roles';

export const authorize = (...allowedRoles: string[]) => {
  // Roles are compared canonically, so MD aliases (company_admin, customer, …)
  // and any casing work everywhere. SUPERADMIN passes every gate.
  const allowed = allowedRoles.map(normalizeRoleName);
  return (req: Request, _res: Response, next: NextFunction): void => {
    try {
      if (!req.user) {
        logger.warn('Authorization check failed - no user in request');
        return next(new AppError('Authentication required', 401));
      }
      const actual = normalizeRoleName(req.user.role);
      if (actual !== 'SUPERADMIN' && !allowed.includes(actual)) {
        logger.warn({ userId: req.user.id, userRole: req.user.role, requiredRoles: allowedRoles }, 'Authorization failed');
        return next(new AppError('Insufficient permissions for this action', 403));
      }
      next();
    } catch (error) {
      logger.error({ err: error }, 'Unexpected error in authorization middleware');
      next(new AppError('Authorization failed', 500));
    }
  };
};

const depMap = new Map<string, string[]>([
  ['loans.approve', ['loans.read', 'users.read']],
  ['loans.reject', ['loans.read', 'users.read']],
  ['users.write', ['users.read']],
  ['loans.write', ['loans.read']],
]);

function resolveForRole(roleName: string): string[] {
  const map: Record<string, string[]> = {
    ADMIN: ['admin.access', 'users.read', 'users.write', 'loans.read', 'loans.write', 'loans.approve', 'loans.reject'],
    REVIEWER: ['loans.read', 'loans.approve', 'loans.reject', 'users.read'],
    USER: ['loans.read', 'loans.write', 'users.read'],
  };
  const direct = map[roleName.toUpperCase()] || ['users.read'];
  const resolved = new Set<string>(direct);
  const queue = [...direct];
  while (queue.length) {
    const p = queue.shift()!;
    for (const d of depMap.get(p) || []) if (!resolved.has(d)) { resolved.add(d); queue.push(d); }
  }
  return Array.from(resolved);
}

export function requirePermission(requiredPerm: string) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const perms = (req as any).permissions || (req.user as any)?.permissions || [];
    if (!perms || perms.length === 0) {
      const derived = resolveForRole(req.user?.role || '');
      if (!derived.includes(requiredPerm)) return next(new AppError('Insufficient permissions', 403));
      return next();
    }
    if (!perms.includes(requiredPerm)) return next(new AppError('Insufficient permissions', 403));
    next();
  };
}

export function requireAnyPermission(...perms: string[]) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const permissions = (req as any).permissions || (req.user as any)?.permissions || [];
    if (!permissions || permissions.length === 0) {
      const derived = resolveForRole(req.user?.role || '');
      if (!derived.some((p: string) => perms.includes(p))) return next(new AppError('Insufficient permissions', 403));
      return next();
    }
    if (!perms.some((p) => permissions.includes(p))) return next(new AppError('Insufficient permissions', 403));
    next();
  };
}
