import { Router } from "express";
import { z } from "zod";
import { authenticate } from "@/middleware/auth";
import { authorize } from "@/middleware/rbac";
import { requireSupercontroller } from "@/middleware/requireSupercontroller";
import { validate } from "@/middleware/requestValidation";
import { companyService } from "@/services/tenant/companyService";
import { prisma } from "@/config/database";

// PAN is collected as typed (any reasonable format: 5-15 letters/digits).
const panField = z.string().min(5, "PAN looks too short").max(20, "PAN looks too long");

const router = Router();

// public searchable list
router.get("/tenants", async (req, res, next) => {
  try {
    const search = req.query.search as string | undefined;
    const data = await companyService.listPublicTenants(search);
    res.json({ success: true, data });
  } catch (e) { next(e); }
});

// must be auth for below
router.use(authenticate);

const requestSchema = z.object({
  body: z.object({
    companyName: z.string().min(2),
    slug: z.string().min(2).regex(/^[a-z0-9-]+$/),
    panNumber: panField,
    companyType: z.string().optional(),
    address: z.string().optional(),
    gstin: z.string().optional(),
    domain: z.string().optional(),
    documentUrls: z.any().optional(),
  })
});

router.post("/requests", validate(requestSchema), async (req, res, next) => {
  try {
    const data = await companyService.requestCompany({ requestedBy: req.user!.id, ...req.body });
    res.status(201).json({ success: true, data });
  } catch (e) { next(e); }
});

router.get("/requests/my", async (req, res, next) => {
  try {
    const data = await companyService.myRequests(req.user!.id);
    res.json({ success: true, data });
  } catch (e) { next(e); }
});

// Creating a company (approving a request) is a platform privilege: superadmin only.
router.get("/requests", requireSupercontroller, async (req, res, next) => {
  try {
    const status = req.query.status as string | undefined;
    const data = await companyService.listRequests(status);
    res.json({ success: true, data });
  } catch (e) { next(e); }
});

router.post("/requests/:id/approve", requireSupercontroller, async (req, res, next) => {
  try {
    const tenant = await companyService.approveRequest(req.params.id, req.user!.id);
    res.json({ success: true, data: tenant });
  } catch (e) { next(e); }
});

router.post("/requests/:id/reject", requireSupercontroller, async (req, res, next) => {
  try {
    const { reason } = req.body;
    if (!reason) return res.status(400).json({ success: false, message: "reason required" });
    const data = await companyService.rejectRequest(req.params.id, req.user!.id, reason);
    res.json({ success: true, data });
  } catch (e) { next(e); }
});

// invite a member by email (ADMIN any role, REVIEWER customers only — enforced in service)
router.post("/invites", authorize("ADMIN", "REVIEWER"), async (req, res, next) => {
  try {
    const { email, role } = req.body;
    if (!email) return res.status(400).json({ success: false, message: "email required" });
    const tenantId = (req.user as any).tenantId;
    if (!tenantId) return res.status(400).json({ success: false, message: "Join or create a company first" });
    const tenant = await prisma.tenant.findUnique({ where: { id: Number(tenantId) } });
    if (!tenant || (tenant as any).slug === "default") {
      return res.status(400).json({ success: false, message: "Join or create a company first" });
    }
    const data = await companyService.inviteUser(Number(tenantId), email, req.user!.id, role);
    res.json({ success: true, data });
  } catch (e) { next(e); }
});

router.post("/invites/accept", async (req, res, next) => {
  try {
    const { token } = req.body;
    if (!token) return res.status(400).json({ success: false, message: "token required" });
    const data = await companyService.acceptInvite(token, req.user!.id);
    res.json({ success: true, data });
  } catch (e) { next(e); }
});

// accept with the 6-digit emailed code
router.post("/invites/accept-code", async (req, res, next) => {
  try {
    const { code, tenantId } = req.body;
    if (!code) return res.status(400).json({ success: false, message: "Enter the 6-digit code from your email" });
    const data = await companyService.joinWithCode(req.user!.id, code, tenantId ? Number(tenantId) : undefined);
    res.json({ success: true, data });
  } catch (e) { next(e); }
});

// "urge to join": open company -> joined; code company -> code emailed automatically
router.post("/request-join", async (req, res, next) => {
  try {
    const { tenantId } = req.body;
    if (!tenantId) return res.status(400).json({ success: false, message: "tenantId required" });
    const data = await companyService.requestJoin(Number(tenantId), req.user!.id);
    res.json({ success: true, data });
  } catch (e) { next(e); }
});

router.post("/join", async (req, res, next) => {
  try {
    const { tenantId, code } = req.body;
    if (!tenantId) return res.status(400).json({ success: false, message: "tenantId required" });
    const data = await companyService.joinPublicTenant(req.user!.id, Number(tenantId), code);
    res.json({ success: true, data });
  } catch (e) { next(e); }
});

router.post("/leave", async (req, res, next) => {
  try {
    const data = await companyService.leaveTenant(req.user!.id);
    res.json({ success: true, data });
  } catch (e) { next(e); }
});

router.get("/me", async (req, res, next) => {
  try {
    const tid = (req.user as any).tenantId;
    if (!tid) return res.json({ success: true, data: null });
    const tenant = await prisma.tenant.findUnique({ where: { id: Number(tid) } });
    res.json({ success: true, data: tenant });
  } catch (e) { next(e); }
});

export default router;
