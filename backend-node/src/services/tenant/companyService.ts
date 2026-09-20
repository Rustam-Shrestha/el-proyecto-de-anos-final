import crypto from "crypto";
import bcryptjs from "bcryptjs";
import { prisma } from "@/config/database";
import { AppError } from "@/utils/AppError";
import { mailService } from "@/services/mailService";
import { tokenService } from "@/services/tokenService";
import { permissionResolver } from "@/services/rbac/permissionResolver";

async function issueTokensForUser(userId: string, email: string, roleName: string, tenantId: number) {
  const perms = permissionResolver.resolveForRoleName(roleName);
  const accessToken = tokenService.generateAccessToken(userId, email, roleName, tenantId, perms);
  const refreshToken = tokenService.generateRefreshToken(userId, email, roleName, tenantId);
  const hash = await bcryptjs.hash(refreshToken, 12);
  await prisma.session.create({ data: { userId, refreshTokenHash: hash, expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) } });
  const user = { id: userId, email, role: roleName, tenantId };
  return { accessToken, refreshToken, user };
}

const PAN_REGEX = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;

export const companyService = {
  async listPublicTenants(search?: string, limit = 20) {
    const where: any = { status: "active", slug: { not: "default" } };
    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { slug: { contains: search, mode: "insensitive" } },
      ];
    }
    return prisma.tenant.findMany({
      where,
      select: { id: true, name: true, slug: true, companyType: true, domain: true, logoUrl: true },
      distinct: ["id"],
      take: limit,
      orderBy: { name: "asc" },
    });
  },

  async requestCompany(input: {
    requestedBy: string;
    companyName: string;
    slug: string;
    panNumber: string;
    companyType?: string;
    address?: string;
    gstin?: string;
    domain?: string;
    documentUrls?: any;
  }) {
    const pan = input.panNumber.toUpperCase().trim();
    if (!PAN_REGEX.test(pan)) throw new AppError("Invalid PAN format. Expected ABCDE1234F", 400);
    const existingPanTenant = await prisma.tenant.findUnique({ where: { panNumber: pan } });
    if (existingPanTenant) throw new AppError("PAN already registered to another company", 409);
    const existingPanReq = await prisma.companyRequest.findFirst({ where: { panNumber: pan, status: "PENDING" } });
    if (existingPanReq) throw new AppError("PAN already has pending request", 409);
    const existingSlug = await prisma.tenant.findUnique({ where: { slug: input.slug } });
    if (existingSlug) throw new AppError("Slug already taken", 409);
    const existingReqSlug = await prisma.companyRequest.findUnique({ where: { slug: input.slug } }).catch(() => null);
    if (existingReqSlug) throw new AppError("Slug already requested", 409);

    // user must not already belong to non-default tenant? allow but warn
    const req = await prisma.companyRequest.create({
      data: {
        requestedBy: input.requestedBy,
        companyName: input.companyName,
        slug: input.slug.toLowerCase().trim(),
        panNumber: pan,
        companyType: input.companyType,
        address: input.address,
        gstin: input.gstin,
        domain: input.domain,
        documentUrls: input.documentUrls ?? undefined,
        status: "PENDING",
      },
    });
    return req;
  },

  async listRequests(status?: string) {
    return prisma.companyRequest.findMany({
      where: status ? { status } : undefined,
      orderBy: { createdAt: "desc" },
    });
  },

  async myRequests(userId: string) {
    return prisma.companyRequest.findMany({ where: { requestedBy: userId }, orderBy: { createdAt: "desc" } });
  },

  async approveRequest(requestId: string, reviewedBy: string) {
    const req = await prisma.companyRequest.findUnique({ where: { id: requestId } });
    if (!req) throw new AppError("Request not found", 404);
    if (req.status !== "PENDING") throw new AppError("Request already processed", 400);
    // create tenant
    const tenant = await prisma.tenant.create({
      data: {
        slug: req.slug,
        name: req.companyName,
        companyType: req.companyType ?? undefined,
        panNumber: req.panNumber,
        domain: req.domain ?? undefined,
        status: "active",
      },
    });
    await prisma.companyRequest.update({
      where: { id: requestId },
      data: { status: "APPROVED", reviewedBy, reviewedAt: new Date(), tenantId: tenant.id },
    });
    // assign requester to tenant as admin
    await prisma.user.update({ where: { id: req.requestedBy }, data: { tenantId: tenant.id } });
    await prisma.tenantAdmin.create({ data: { tenantId: tenant.id, userId: req.requestedBy, email: (await prisma.user.findUnique({ where: { id: req.requestedBy } }))?.email ?? "" } });
    return tenant;
  },

  async rejectRequest(requestId: string, reviewedBy: string, reason: string) {
    const req = await prisma.companyRequest.findUnique({ where: { id: requestId } });
    if (!req) throw new AppError("Request not found", 404);
    if (req.status !== "PENDING") throw new AppError("Request already processed", 400);
    return prisma.companyRequest.update({
      where: { id: requestId },
      data: { status: "REJECTED", reviewedBy, reviewedAt: new Date(), rejectionReason: reason },
    });
  },

  async inviteUser(tenantId: number, email: string, invitedBy: string, role = "USER") {
    const tenant = await prisma.tenant.findUnique({ where: { id: tenantId } });
    if (!tenant) throw new AppError("Company not found", 404);
    const token = crypto.randomBytes(32).toString("hex");
    const invite = await prisma.companyInvite.create({
      data: {
        tenantId,
        email: email.toLowerCase().trim(),
        role,
        token,
        invitedBy,
        status: "PENDING",
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    });
    const link = `${process.env.FRONTEND_URL || "http://localhost:5173"}/invite?token=${token}`;
    try { (mailService as any).sendInviteMail(email, tenant.name, link); } catch {}
    return { invite, link };
  },

  async acceptInvite(token: string, userId: string) {
    const invite = await prisma.companyInvite.findUnique({ where: { token } });
    if (!invite) throw new AppError("Invalid invite", 404);
    if (invite.status !== "PENDING") throw new AppError("Invite already used", 400);
    if (invite.expiresAt < new Date()) throw new AppError("Invite expired", 400);
    const user = await prisma.user.findUnique({ where: { id: userId }, include: { role: true } });
    if (!user) throw new AppError("User not found", 404);
    if (user.email.toLowerCase() !== invite.email.toLowerCase()) throw new AppError("Invite email mismatch", 403);
    await prisma.user.update({ where: { id: userId }, data: { tenantId: invite.tenantId } });
    await prisma.companyInvite.update({ where: { token }, data: { status: "ACCEPTED", acceptedAt: new Date() } });
    const tenant = await prisma.tenant.findUnique({ where: { id: invite.tenantId } });
    const tokens = await issueTokensForUser(user.id, user.email, (user as any).role.name, invite.tenantId);
    return { tenant, ...tokens };
  },

  async joinPublicTenant(userId: string, tenantId: number) {
    const tenant = await prisma.tenant.findUnique({ where: { id: tenantId } });
    if (!tenant) throw new AppError("Company not found", 404);
    if (tenant.slug === "default") throw new AppError("Cannot join default tenant", 400);
    const user = await prisma.user.findUnique({ where: { id: userId }, include: { role: true } });
    if (!user) throw new AppError("User not found", 404);
    await prisma.user.update({ where: { id: userId }, data: { tenantId } });
    const tokens = await issueTokensForUser(user.id, user.email, (user as any).role.name, tenantId);
    return { tenant, ...tokens };
  },
};
