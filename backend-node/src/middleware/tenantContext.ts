import type { Request, Response, NextFunction } from "express";
import { prisma } from "@/config/database";
import { logger } from "@/config/logger";

const DEFAULT_TENANT_SLUG = "default";

export async function tenantContext(req: Request, _res: Response, next: NextFunction): Promise<void> {
  try {
    let tenantSlug = req.headers["x-tenant"] as string | undefined;

    if (!tenantSlug) {
      const host = req.get("host") || "";
      const match = host.match(/^([a-z0-9-]+)\.localhost/);
      if (match) tenantSlug = match[1];
    }

    if (!tenantSlug) {
      tenantSlug = req.query.tenant as string | undefined;
    }

    // fallback to default tenant (soft tenancy) - ensures non-breaking for existing clients
    if (!tenantSlug) {
      tenantSlug = DEFAULT_TENANT_SLUG;
    }

    // ensure default tenant exists (lazy create) - gracefully handle missing table (P2021)
    try {
      let tenant = await prisma.tenant.findUnique({ where: { slug: tenantSlug } });

      if (!tenant) {
        if (tenantSlug === DEFAULT_TENANT_SLUG) {
          tenant = await prisma.tenant.create({
            data: { slug: DEFAULT_TENANT_SLUG, name: "Default Tenant", status: "active" },
          });
          logger.info({ tenantId: tenant.id }, "Default tenant auto-created");
        } else {
          tenant = await prisma.tenant.create({
            data: { slug: tenantSlug, name: tenantSlug, status: "active" },
          });
          logger.info({ tenantSlug, tenantId: tenant.id }, "Tenant auto-created via header");
        }
      }

      if (tenant.status !== "active") {
        const res = _res as Response;
        res.status(403).json({ success: false, message: "Tenant suspended" });
        return;
      }

      req.tenantId = tenant.id;
      req.tenantSlug = tenant.slug;
      next();
      return;
    } catch (dbError: unknown) {
      const code = (dbError as { code?: string })?.code;
      const msg = (dbError as { message?: string })?.message ?? "";
      const isMissingTable = code === "P2021" || msg.includes("does not exist") || msg.includes("auth.tenants");
      if (isMissingTable) {
        logger.warn({ err: dbError, tenantSlug }, "Tenants table missing (migration not applied) - falling back to default tenantId=1");
        req.tenantId = 1;
        req.tenantSlug = tenantSlug ?? DEFAULT_TENANT_SLUG;
        next();
        return;
      }
      throw dbError;
    }
  } catch (error) {
    // Last-resort fallback: never crash request pipeline due to tenancy
    const code = (error as { code?: string })?.code;
    const msg = (error as { message?: string })?.message ?? "";
    if (code === "P2021" || msg.includes("auth.tenants")) {
      logger.warn({ err: error }, "Tenant middleware fallback to default");
      req.tenantId = 1;
      req.tenantSlug = (req.headers["x-tenant"] as string) || DEFAULT_TENANT_SLUG;
      next();
      return;
    }
    logger.error({ err: error }, "Tenant context error");
    next(error);
  }
}
