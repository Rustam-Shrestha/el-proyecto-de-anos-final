import type { Request, Response, NextFunction } from "express";
export function requireCompany(req: Request, res: Response, next: NextFunction) {
  const tid = (req as any).user?.tenantId;
  // allow if tenantId is not default (1) and present
  if (!tid || tid === 1) {
    return res.status(403).json({ success: false, message: "Company membership required. Please create or join a company.", code: "COMPANY_REQUIRED" });
  }
  next();
}
export function requireCompanyRole(...roles: string[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    const role = (req as any).user?.role;
    if (!role || !roles.includes(role)) {
      return res.status(403).json({ success: false, message: "Insufficient role for company operation" });
    }
    next();
  };
}
