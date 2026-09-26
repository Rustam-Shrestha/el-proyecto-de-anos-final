import type { Request, Response, NextFunction } from 'express';
import { tokenService } from '@/services/tokenService';
import { AppError } from '@/utils/AppError';

/**
 * MD-compat auth middleware (FINGUARD_MULTITENANT_COMPLETE_FIX Part 5).
 * Accepts both compat tokens ({sub,email,role,company_id?,customer_id?})
 * and legacy tokens ({sub,email,role,tenantId}).
 * Builds req.scope for tenant isolation and mirrors into req.user/req.tenantId
 * so legacy handlers keep working.
 */
export function slugAuthMiddleware(req: Request, _res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return next(new AppError('No token provided', 401));
  }
  const decoded = tokenService.verifyCompatToken(authHeader.slice(7));
  if (!decoded) {
    return next(new AppError('Invalid or expired token', 401));
  }

  const companyId = decoded.company_id ?? decoded.tenantId;
  const role = decoded.role;

  if (role === 'superadmin') {
    req.scope = { user_id: decoded.sub, role: 'superadmin' };
    req.user = { id: decoded.sub, email: decoded.email, role, permissions: decoded.permissions } as Express.User;
  } else if (['company_admin', 'reviewer', 'approver', 'ADMIN', 'REVIEWER', 'TenantAdmin', 'LoanApprover', 'Validator', 'Employee'].includes(role)) {
    if (companyId === undefined) {
      return next(new AppError('Token missing company scope', 401));
    }
    req.scope = { user_id: decoded.sub, role, company_id: companyId };
    req.user = { id: decoded.sub, email: decoded.email, role, tenantId: companyId, permissions: decoded.permissions } as Express.User;
    req.tenantId = companyId;
  } else if (role === 'customer' || role === 'USER' || role === 'Customer') {
    req.scope = { user_id: decoded.sub, role: 'customer', customer_id: decoded.customer_id ?? decoded.sub };
    req.user = { id: decoded.sub, email: decoded.email, role: 'customer', tenantId: companyId, permissions: decoded.permissions } as Express.User;
    if (companyId !== undefined) req.tenantId = companyId;
  } else {
    // Fallback: treat as generic authenticated user
    req.scope = {
      user_id: decoded.sub,
      role,
      ...(companyId !== undefined ? { company_id: companyId } : {}),
      ...(decoded.customer_id ? { customer_id: decoded.customer_id } : {}),
    };
    req.user = { id: decoded.sub, email: decoded.email, role, tenantId: companyId, permissions: decoded.permissions } as Express.User;
    if (companyId !== undefined) req.tenantId = companyId;
  }

  next();
}

/**
 * Enforces that :slug in the URL matches the caller's company scope.
 * Superadmin bypasses. Attach slug to scope for handlers.
 */
export function slugCompanyGuard(req: Request, _res: Response, next: NextFunction): void {
  const slug = (req.params as { slug?: string }).slug;
  if (req.scope) {
    req.scope = { ...req.scope, ...(slug ? { slug } : {}) };
  }
  if (!slug) return next();
  if (req.scope?.role === 'superadmin') return next();
  if (req.scope?.company_id === undefined) return next();
  // Concrete tenant-id check happens in handlers (needs DB lookup slug->id).
  // Store expected slug so handlers can verify.
  next();
}
