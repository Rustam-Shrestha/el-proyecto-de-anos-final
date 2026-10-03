import { Router } from 'express';
import { z } from 'zod';
import jwt from 'jsonwebtoken';
import { env } from '@/config/env';
import { authenticate } from '@/middleware/auth';
import { requireSupercontroller } from '@/middleware/requireSupercontroller';
import { supercontrollerService } from '@/services/supercontroller/supercontrollerService';
import { tenantMonitoringService } from '@/services/supercontroller/tenantMonitoringService';

const router = Router();

// Public: supercontroller login
router.post('/login', async (req, res, next) => {
  try {
    const schema = z.object({ email: z.string().email(), password: z.string().min(6) });
    const { email, password } = schema.parse(req.body);
    const sc = await supercontrollerService.authenticate(email, password);
    // issue JWT with supercontroller role + permissions
    const perms = ['tenants.create','tenants.read','tenants.update','tenants.delete','features.toggle','audit.view','audit.export','admin.access'];
    const accessToken = jwt.sign({ sub: String(sc.id), email: sc.email, role: 'Supercontroller', tenantId: undefined, permissions: perms }, env.JWT_ACCESS_SECRET, { expiresIn: '1h' });
    const refreshToken = jwt.sign({ sub: String(sc.id), email: sc.email, role: 'Supercontroller' }, env.JWT_REFRESH_SECRET, { expiresIn: '7d' });
    res.json({ success: true, data: { accessToken, refreshToken, user: { id: sc.id, email: sc.email, role: 'Supercontroller' } } });
  } catch (e) { next(e); }
});

// Guarded routes
router.use(authenticate);
router.use(requireSupercontroller);

router.get('/tenants', async (req, res, next) => {
  try {
    const page = Number(req.query.page ?? 1);
    const limit = Math.min(Number(req.query.limit ?? 20), 100);
    const result = await supercontrollerService.getAllTenants(page, limit);
    res.json({ success: true, ...result });
  } catch (e) { next(e); }
});

router.get('/dashboard/metrics', async (_req, res, next) => {
  try { const m = await supercontrollerService.getDashboardMetrics(); res.json({ success: true, data: m }); } catch (e) { next(e); }
});

router.get('/tenants/:id', async (req, res, next) => {
  try { const id = Number(req.params.id); const data = await tenantMonitoringService.getTenantOverview(id); res.json({ success: true, data }); } catch (e) { next(e); }
});

router.get('/tenants/:id/timeseries', async (req, res, next) => {
  try { const id = Number(req.params.id); const days = Number(req.query.days ?? 30); const data = await tenantMonitoringService.getTimeSeries(id, days); res.json({ success: true, data }); } catch (e) { next(e); }
});

router.get('/timeseries', async (req, res, next) => {
  try { const days = Number(req.query.days ?? 30); const data = await tenantMonitoringService.getTimeSeries(null, days); res.json({ success: true, data }); } catch (e) { next(e); }
});

router.post('/tenants', async (req, res, next) => {
  try {
    const schema = z.object({ slug: z.string().min(2).max(50), name: z.string().min(2), companyType: z.string().optional(), subscriptionTier: z.enum(['basic','professional','enterprise']).optional(), domain: z.string().optional(), maxUsers: z.number().int().optional(), maxLoans: z.number().int().optional() });
    const data = schema.parse(req.body);
    const scId = (req as unknown as { supercontrollerId?: number }).supercontrollerId ?? 1;
    const tenant = await supercontrollerService.createTenant(data, scId);
    res.status(201).json({ success: true, data: tenant });
  } catch (e) { next(e); }
});

router.patch('/tenants/:id/status', async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const schema = z.object({ status: z.enum(['active','suspended','deleted']) });
    const { status } = schema.parse(req.body);
    const scId = (req as unknown as { supercontrollerId?: number }).supercontrollerId ?? 1;
    const t = await supercontrollerService.updateTenantStatus(id, status, scId);
    res.json({ success: true, data: t });
  } catch (e) { next(e); }
});

router.post('/tenants/:id/features/:feature/toggle', async (req, res, next) => {
  try {
    const tenantId = Number(req.params.id);
    const feature = req.params.feature;
    const schema = z.object({ isEnabled: z.boolean() });
    const { isEnabled } = schema.parse(req.body);
    const scId = (req as unknown as { supercontrollerId?: number }).supercontrollerId ?? 1;
    const t = await supercontrollerService.toggleFeature(tenantId, feature, isEnabled, scId);
    res.json({ success: true, data: t });
  } catch (e) { next(e); }
});

router.get('/tenants/:id/features', async (req, res, next) => {
  try { const id = Number(req.params.id); const data = await supercontrollerService.getTenantFeatures(id); res.json({ success: true, data }); } catch (e) { next(e); }
});

router.get('/tenants/:id/alerts', async (req, res, next) => {
  try { const id = Number(req.params.id); const alerts = await tenantMonitoringService.checkUsageAlerts(id); res.json({ success: true, data: alerts }); } catch (e) { next(e); }
});

router.get('/audit-logs', async (req, res, next) => {
  try {
    const page = Number(req.query.page ?? 1);
    const limit = Math.min(Number(req.query.limit ?? 50), 100);
    const filters: { action?: string; targetType?: string } = {};
    if (req.query.action) filters.action = String(req.query.action);
    if (req.query.targetType) filters.targetType = String(req.query.targetType);
    const result = await supercontrollerService.getAuditLogs(page, limit, filters);
    res.json({ success: true, ...result });
  } catch (e) { next(e); }
});

export default router;
