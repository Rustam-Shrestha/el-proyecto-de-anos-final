import { Router } from 'express';
import { authenticate } from '@/middleware/auth';
import { prisma } from '@/config/database';
import * as XLSX from 'xlsx';

const router = Router();
router.use(authenticate);

// Generic CSV/Excel export for tenants/users/kyc/loans/audit — tenant-aware
router.get('/:entity', async (req, res, next) => {
  try {
    const entity = req.params.entity as string;
    const format = String(req.query.format ?? 'xlsx').toLowerCase();
    const tenantId = (req as unknown as { tenantId?: number }).tenantId ?? (req.user as unknown as { tenantId?: number })?.tenantId ?? 1;
    const isSuper = (req.user as unknown as { role?: string })?.role === 'Supercontroller' || (req.user as unknown as { role?: string })?.role === 'ADMIN';
    const whereTenant = isSuper && req.query.all === 'true' ? undefined : tenantId;

    let rows: Record<string, unknown>[] = [];
    let headers: string[] = [];
    switch (entity) {
      case 'tenants': {
        const tenants = await prisma.tenant.findMany({ orderBy: { createdAt: 'desc' } });
        headers = ['id','slug','name','status','companyType','subscriptionTier','maxUsers','maxLoans','usageUsers','usageLoans'];
        rows = tenants.map(t => ({ id: t.id, slug: t.slug, name: t.name, status: t.status, companyType: (t as unknown as { companyType?: string }).companyType, subscriptionTier: (t as unknown as { subscriptionTier?: string }).subscriptionTier, maxUsers: (t as unknown as { maxUsers?: number }).maxUsers, maxLoans: (t as unknown as { maxLoans?: number }).maxLoans, usageUsers: (t as unknown as { usageUsers?: number }).usageUsers, usageLoans: (t as unknown as { usageLoans?: number }).usageLoans }));
        break;
      }
      case 'users': {
        const users = await prisma.user.findMany({ where: whereTenant ? { tenantId: whereTenant } : undefined, include: { role: true, profile: true } as never, take: 5000 });
        headers = ['id','email','role','tenantId','isVerified','fullName'];
        rows = users.map(u => ({ id: u.id, email: u.email, role: (u as unknown as { role: { name: string } }).role?.name ?? u.roleId, tenantId: u.tenantId, isVerified: u.isVerified, fullName: (u as unknown as { profile?: { fullName?: string } }).profile?.fullName ?? '' }));
        break;
      }
      case 'kyc': {
        const kyc = await prisma.kycApplication.findMany({ where: whereTenant ? { tenantId: whereTenant } : undefined, take: 5000, orderBy: { createdAt: 'desc' } });
        headers = ['id','userId','status','tenantId','createdAt'];
        rows = kyc.map(k => ({ id: k.id, userId: k.userId, status: k.status, tenantId: k.tenantId, createdAt: k.createdAt.toISOString() }));
        break;
      }
      case 'loans': {
        const loans = await prisma.loanApplication.findMany({ where: whereTenant ? { tenantId: whereTenant } : undefined, take: 5000, orderBy: { createdAt: 'desc' } });
        headers = ['id','userId','requestedAmount','purpose','status','riskLevel','tenantId','createdAt'];
        rows = loans.map(l => ({ id: l.id, userId: l.userId, requestedAmount: String(l.requestedAmount), purpose: l.purpose, status: l.status, riskLevel: l.riskLevel, tenantId: l.tenantId, createdAt: l.createdAt.toISOString() }));
        break;
      }
      case 'audit': {
        const logs = await prisma.auditLog.findMany({ where: whereTenant ? { tenantId: whereTenant } : undefined, take: 5000, orderBy: { createdAt: 'desc' } });
        headers = ['id','userId','action','tenantId','createdAt'];
        rows = logs.map(a => ({ id: a.id, userId: a.userId, action: a.action, tenantId: a.tenantId, createdAt: a.createdAt.toISOString() }));
        break;
      }
      default: return res.status(400).json({ success: false, message: 'Unknown entity' });
    }

    if (format === 'csv') {
      const ws = XLSX.utils.json_to_sheet(rows, { header: headers });
      const csv = XLSX.utils.sheet_to_csv(ws);
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="${entity}-${new Date().toISOString().slice(0,10)}.csv"`);
      return res.send(csv);
    }
    if (format === 'json') return res.json({ success: true, data: rows });
    // xlsx default
    const ws = XLSX.utils.json_to_sheet(rows, { header: headers });
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, entity);
    const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${entity}-${new Date().toISOString().slice(0,10)}.xlsx"`);
    return res.send(buf);
  } catch (e) { next(e); }
});

export default router;
