import { Router } from "express";
import { z } from "zod";
import { authenticate } from "@/middleware/auth";
import { authorize } from "@/middleware/rbac";
import { validate } from "@/middleware/requestValidation";
import { companyService } from "@/services/tenant/companyService";
import { prisma } from "@/config/database";

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
    panNumber: z.string().regex(/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/i, "Invalid PAN"),
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

router.get("/requests", authorize("ADMIN", "REVIEWER", "SUPERCONTROLLER"), async (req, res, next) => {
  try {
    const status = req.query.status as string | undefined;
    const data = await companyService.listRequests(status);
    res.json({ success: true, data });
  } catch (e) { next(e); }
});

router.post("/requests/:id/approve", authorize("ADMIN", "REVIEWER", "SUPERCONTROLLER"), async (req, res, next) => {
  try {
    const tenant = await companyService.approveRequest(req.params.id, req.user!.id);
    res.json({ success: true, data: tenant });
  } catch (e) { next(e); }
});

router.post("/requests/:id/reject", authorize("ADMIN", "REVIEWER", "SUPERCONTROLLER"), async (req, res, next) => {
  try {
    const { reason } = req.body;
    if (!reason) return res.status(400).json({ success: false, message: "reason required" });
    const data = await companyService.rejectRequest(req.params.id, req.user!.id, reason);
    res.json({ success: true, data });
  } catch (e) { next(e); }
});

// invite
router.post("/invites", async (req, res, next) => {
  try {
    const { email, role } = req.body;
    if (!email) return res.status(400).json({ success: false, message: "email required" });
    const tenantId = (req.user as any).tenantId;
    if (!tenantId || tenantId === 1) return res.status(400).json({ success: false, message: "Join or create a company first" });
    // only admin/reviewer of that tenant can invite - check tenantAdmin or role
    const data = await companyService.inviteUser(tenantId, email, req.user!.id, role);
    res.json({ success: true, data });
  } catch (e) { next(e); }
});

router.post("/invites/accept", async (req, res, next) => {
  try {
    const { token } = req.body;
    if (!token) return res.status(400).json({ success: false, message: "token required" });
    const tenant = await companyService.acceptInvite(token, req.user!.id);
    res.json({ success: true, data: tenant });
  } catch (e) { next(e); }
});

router.post("/join", async (req, res, next) => {
  try {
    const { tenantId } = req.body;
    if (!tenantId) return res.status(400).json({ success: false, message: "tenantId required" });
    const tenant = await companyService.joinPublicTenant(req.user!.id, Number(tenantId));
    res.json({ success: true, data: tenant });
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
