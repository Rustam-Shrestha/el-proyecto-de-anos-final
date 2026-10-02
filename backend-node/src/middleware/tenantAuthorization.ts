import type { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { env } from "@/config/env";
import { AppError } from "@/utils/AppError";
import { logger } from "@/config/logger";

interface JwtPayload {
  sub: string;
  email: string;
  role: string;
  tenantId?: number;
  permissions?: string[];
  iat?: number;
  exp?: number;
}

export async function tenantAuthorization(req: Request, _res: Response, next: NextFunction): Promise<void> {
  try {
    const token = req.headers.authorization?.replace("Bearer ", "");

    if (!token) {
      return next(new AppError("Unauthorized", 401));
    }

    const decoded = jwt.verify(token, env.JWT_ACCESS_SECRET) as JwtPayload;

    // tenant mismatch check - if token carries tenantId, enforce it
    if (decoded.tenantId !== undefined && req.tenantId !== undefined && decoded.tenantId !== req.tenantId) {
      logger.warn({ tokenTenant: decoded.tenantId, reqTenant: req.tenantId }, "Tenant mismatch");
      return next(new AppError("Tenant mismatch", 403));
    }

    // attach to req.user (preserve existing shape + enrich)
    req.user = {
      id: decoded.sub,
      email: decoded.email,
      role: decoded.role,
      tenantId: decoded.tenantId ?? req.tenantId,
      permissions: decoded.permissions,
    };

    // also expose on req for convenience
    (req as unknown as { tenantId?: number }).tenantId = decoded.tenantId ?? req.tenantId;
    (req as unknown as { permissions?: string[] }).permissions = decoded.permissions;

    next();
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) return next(new AppError("Token expired", 401));
    if (error instanceof jwt.JsonWebTokenError) return next(new AppError("Invalid token", 401));
    if (error instanceof AppError) return next(error);
    next(new AppError("Invalid token", 401));
  }
}
