import crypto from "crypto";
import bcryptjs from "bcryptjs";
import { prisma } from "@/config/database";
import { AppError } from "@/utils/AppError";
import { mailService } from "@/services/mailService";
import { tokenService } from "@/services/tokenService";
import { permissionResolver } from "@/services/rbac/permissionResolver";
import { normalizePan, normalizeRoleName } from "@/utils/roles";

async function issueTokensForUser(userId: string, email: string, roleName: string, tenantId: number) {
  const perms = permissionResolver.resolveForRoleName(roleName);
  const accessToken = tokenService.generateAccessToken(userId, email, roleName, tenantId, perms);
  const refreshToken = tokenService.generateRefreshToken(userId, email, roleName, tenantId);
  const hash = await bcryptjs.hash(refreshToken, 12);
  await prisma.session.create({ data: { userId, refreshTokenHash: hash, expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) } });
  const user = { id: userId, email, role: roleName, tenantId };
  return { accessToken, refreshToken, user };
}

const makeCode = () => String(Math.floor(100000 + Math.random() * 900000));

async function tenantOr404(tenantId: number) {
  const tenant = await prisma.tenant.findUnique({ where: { id: tenantId } });
  if (!tenant) throw new AppError("Company not found", 404);
  if ((tenant as any).status && (tenant as any).status !== "active") throw new AppError("Company is suspended", 403);
  return tenant;
}

async function userOr404(userId: string) {
  const user = await prisma.user.findUnique({ where: { id: userId }, include: { role: true } });
  if (!user) throw new AppError("User not found", 404);
  return user;
}

/** Join a tenant: move membership, stamp invite ACCEPTED, hand out fresh tokens. */
async function performJoin(user: any, tenant: any, inviteToken?: string) {
  const roleName = normalizeRoleName(user.role?.name ?? user.role ?? "USER");
  // Invited role wins: an invite for REVIEWER/ADMIN upgrades the member's role.
  let finalRoleName = roleName;
  if (inviteToken) {
    const inv = await prisma.companyInvite.findUnique({ where: { token: inviteToken } });
    if (inv) {
      const invitedRole = normalizeRoleName(inv.role);
      if (["ADMIN", "REVIEWER", "USER"].includes(invitedRole)) finalRoleName = invitedRole;
      await prisma.companyInvite.update({ where: { token: inviteToken }, data: { status: "ACCEPTED", acceptedAt: new Date() } });
    }
  }
  if (finalRoleName !== roleName) {
    const roleRow = await prisma.role.findUnique({ where: { name: finalRoleName } });
    if (roleRow) await prisma.user.update({ where: { id: user.id }, data: { tenantId: tenant.id, roleId: roleRow.id } });
    else await prisma.user.update({ where: { id: user.id }, data: { tenantId: tenant.id } });
  } else {
    await prisma.user.update({ where: { id: user.id }, data: { tenantId: tenant.id } });
  }
  const tokens = await issueTokensForUser(user.id, user.email, finalRoleName, tenant.id);
  return { tenant, ...tokens };
}

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
      select: { id: true, name: true, slug: true, companyType: true, domain: true, logoUrl: true, joinMode: true },
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
    let pan: string;
    try {
      pan = normalizePan(input.panNumber);
    } catch (e) {
      throw new AppError((e as Error).message, 400);
    }
    const existingPanTenant = await prisma.tenant.findUnique({ where: { panNumber: pan } });
    if (existingPanTenant) throw new AppError(`PAN already registered to ${(existingPanTenant as any).name}`, 409);
    const existingPanReq = await prisma.companyRequest.findFirst({ where: { panNumber: pan, status: "PENDING" } });
    if (existingPanReq) throw new AppError(`PAN already has a pending request (${existingPanReq.companyName})`, 409);
    const existingSlug = await prisma.tenant.findUnique({ where: { slug: input.slug } });
    if (existingSlug) throw new AppError(`Slug "${input.slug}" already taken by ${(existingSlug as any).name}`, 409);
    const existingReqSlug = await prisma.companyRequest.findUnique({ where: { slug: input.slug } }).catch(() => null);
    if (existingReqSlug) throw new AppError(`Slug "${input.slug}" already requested`, 409);

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
    if (req.status !== "PENDING") throw new AppError(`Request already ${req.status.toLowerCase()}`, 400);
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
    // requester becomes the new company's admin
    const adminRole = await prisma.role.findUnique({ where: { name: "ADMIN" } });
    await prisma.user.update({
      where: { id: req.requestedBy },
      data: { tenantId: tenant.id, ...(adminRole ? { roleId: adminRole.id } : {}) },
    });
    const requester = await prisma.user.findUnique({ where: { id: req.requestedBy } });
    await prisma.tenantAdmin.create({ data: { tenantId: tenant.id, userId: req.requestedBy, email: requester?.email ?? "" } }).catch(() => {});
    return tenant;
  },

  async rejectRequest(requestId: string, reviewedBy: string, reason: string) {
    const req = await prisma.companyRequest.findUnique({ where: { id: requestId } });
    if (!req) throw new AppError("Request not found", 404);
    if (req.status !== "PENDING") throw new AppError(`Request already ${req.status.toLowerCase()}`, 400);
    return prisma.companyRequest.update({
      where: { id: requestId },
      data: { status: "REJECTED", reviewedBy, reviewedAt: new Date(), rejectionReason: reason },
    });
  },

  /**
   * Staff invites a member by email. A 6-digit invitation code for the company
   * is emailed automatically (from the configured sender) plus an accept link.
   * ADMIN may invite any role; REVIEWER may invite USER only.
   */
  async inviteUser(tenantId: number, email: string, invitedBy: string, role = "USER") {
    const tenant = await tenantOr404(tenantId);
    const inviter = await userOr404(invitedBy);
    if ((inviter as any).tenantId !== tenantId) throw new AppError("You can only invite members to your own company", 403);
    const inviterRole = normalizeRoleName((inviter as any).role?.name ?? (inviter as any).role);
    const wantedRole = normalizeRoleName(role);
    if (!["ADMIN", "REVIEWER", "USER"].includes(wantedRole)) throw new AppError("Invite role must be ADMIN, REVIEWER or USER", 400);
    if (inviterRole !== "ADMIN" && inviterRole !== "SUPERADMIN") {
      if (inviterRole !== "REVIEWER" || wantedRole !== "USER") {
        throw new AppError("Only company admins (or reviewers inviting customers) can send invites", 403);
      }
    }
    const target = email.toLowerCase().trim();
    const code = makeCode();
    const token = crypto.randomBytes(32).toString("hex");
    // expire older pending invites for same email+tenant
    await prisma.companyInvite.updateMany({ where: { tenantId, email: target, status: "PENDING" }, data: { status: "EXPIRED" } });
    const invite = await prisma.companyInvite.create({
      data: { tenantId, email: target, role: wantedRole, token, code, invitedBy, status: "PENDING", expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) },
    });
    const link = `${process.env.FRONTEND_URL || "http://localhost:5173"}/company?invite=${token}`;
    try { (mailService as any).sendInviteMail(target, (tenant as any).name, link, code); } catch {}
    const { code: _omit, ...safe } = invite as any;
    return { invite: safe, link, emailSent: true };
  },

  /**
   * "Urge to join": member taps join on a company.
   * - open company  -> joined immediately (fresh tokens)
   * - code company  -> 6-digit invitation code for that company is emailed
   *                     automatically; the user then enters the code to join
   */
  async requestJoin(tenantId: number, userId: string) {
    const tenant = await tenantOr404(tenantId);
    if ((tenant as any).slug === "default") throw new AppError("Cannot join the default tenant", 400);
    const user = await userOr404(userId);
    if ((user as any).tenantId === tenantId) {
      const tokens = await issueTokensForUser(user.id, user.email, normalizeRoleName((user as any).role?.name), tenantId);
      return { alreadyMember: true, tenant, ...tokens };
    }
    if ((user as any).tenantId) {
      const current = await prisma.tenant.findUnique({ where: { id: (user as any).tenantId } }).catch(() => null);
      if (current && (current as any).slug !== "default") {
        throw new AppError(`You already belong to ${(current as any).name} (${(current as any).slug}). Leave it first (Company Setup → Leave) to join another company.`, 409);
      }
    }
    if (((tenant as any).joinMode ?? "code") === "open") {
      return { ...(await performJoin(user, tenant)), joined: true };
    }
    // private company: email the code automatically
    await prisma.companyInvite.updateMany({ where: { tenantId, email: user.email.toLowerCase(), status: "PENDING" }, data: { status: "EXPIRED" } });
    const code = makeCode();
    const token = crypto.randomBytes(32).toString("hex");
    await prisma.companyInvite.create({
      data: { tenantId, email: user.email.toLowerCase(), role: "USER", token, code, invitedBy: user.id, status: "PENDING", expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) },
    });
    const link = `${process.env.FRONTEND_URL || "http://localhost:5173"}/company?invite=${token}`;
    try { (mailService as any).sendInviteMail(user.email, (tenant as any).name, link, code); } catch {}
    return { codeSent: true, email: user.email, tenant: { id: (tenant as any).id, name: (tenant as any).name, slug: (tenant as any).slug } };
  },

  /** Enter the emailed 6-digit code to join its company. */
  async joinWithCode(userId: string, code: string, tenantId?: number) {
    const user = await userOr404(userId);
    const clean = String(code ?? "").replace(/\D/g, "");
    if (clean.length !== 6) throw new AppError("Enter the 6-digit invitation code from your email", 400);
    const invite = await prisma.companyInvite.findFirst({
      where: { code: clean, email: user.email.toLowerCase(), status: "PENDING", ...(tenantId ? { tenantId } : {}) },
      orderBy: { createdAt: "desc" },
    });
    if (!invite) throw new AppError("Invalid code for this email address", 404);
    if (invite.expiresAt < new Date()) throw new AppError("This code expired — request a new one", 400);
    const tenant = await tenantOr404(invite.tenantId);
    if ((user as any).tenantId === tenant.id) {
      await prisma.companyInvite.update({ where: { id: invite.id }, data: { status: "ACCEPTED", acceptedAt: new Date() } });
      const tokens = await issueTokensForUser(user.id, user.email, normalizeRoleName((user as any).role?.name), tenant.id);
      return { alreadyMember: true, tenant, ...tokens };
    }
    if ((user as any).tenantId) {
      const current = await prisma.tenant.findUnique({ where: { id: (user as any).tenantId } }).catch(() => null);
      if (current && (current as any).slug !== "default") {
        throw new AppError(`You already belong to ${(current as any).name} (${(current as any).slug}). Leave it first to join another company.`, 409);
      }
    }
    return { ...(await performJoin(user, tenant, invite.token)), joined: true };
  },

  async acceptInvite(token: string, userId: string) {
    const invite = await prisma.companyInvite.findUnique({ where: { token } });
    if (!invite) throw new AppError("Invalid invite link", 404);
    if (invite.status !== "PENDING") throw new AppError(`Invite already ${invite.status.toLowerCase()}`, 400);
    if (invite.expiresAt < new Date()) throw new AppError("Invite expired — ask for a new one", 400);
    const user = await userOr404(userId);
    if (user.email.toLowerCase() !== invite.email.toLowerCase()) {
      throw new AppError(`This invite was sent to ${invite.email} — sign in with that address`, 403);
    }
    const tenant = await tenantOr404(invite.tenantId);
    if ((user as any).tenantId === tenant.id) {
      await prisma.companyInvite.update({ where: { token }, data: { status: "ACCEPTED", acceptedAt: new Date() } });
      const tokens = await issueTokensForUser(user.id, user.email, normalizeRoleName((user as any).role?.name), tenant.id);
      return { alreadyMember: true, tenant, ...tokens };
    }
    return { ...(await performJoin(user, tenant, token)), joined: true };
  },

  /** Legacy direct join — honors joinMode (open joins, code companies need a code). */
  async joinPublicTenant(userId: string, tenantId: number, code?: string) {
    const tenant = await tenantOr404(tenantId);
    if ((tenant as any).slug === "default") throw new AppError("Cannot join the default tenant", 400);
    if (((tenant as any).joinMode ?? "code") !== "open" && !code) {
      // fall into the code flow so the user gets the email automatically
      return this.requestJoin(tenantId, userId);
    }
    if (code) return this.joinWithCode(userId, code, tenantId);
    const user = await userOr404(userId);
    if ((user as any).tenantId === tenantId) {
      const tokens = await issueTokensForUser(user.id, user.email, normalizeRoleName((user as any).role?.name), tenantId);
      return { alreadyMember: true, tenant, ...tokens };
    }
    if ((user as any).tenantId) {
      const current = await prisma.tenant.findUnique({ where: { id: (user as any).tenantId } }).catch(() => null);
      if (current && (current as any).slug !== "default") {
        throw new AppError(`You already belong to ${(current as any).name} (${(current as any).slug}). Leave it first to join another company.`, 409);
      }
    }
    return { ...(await performJoin(user, tenant)), joined: true };
  },

  async leaveTenant(userId: string) {
    const user = await userOr404(userId);
    const current = (user as any).tenantId ? await prisma.tenant.findUnique({ where: { id: (user as any).tenantId } }).catch(() => null) : null;
    if (!current || (current as any).slug === "default") throw new AppError("You are not in a company", 400);
    const def = await prisma.tenant.findUnique({ where: { slug: "default" } });
    if (!def) throw new AppError("Default tenant missing", 500);
    await prisma.user.update({ where: { id: userId }, data: { tenantId: def.id } });
    await prisma.tenantAdmin.deleteMany({ where: { tenantId: current.id, userId } }).catch(() => {});
    const tokens = await issueTokensForUser(user.id, user.email, normalizeRoleName((user as any).role?.name), def.id);
    return { left: (current as any).name, ...tokens };
  },
};
