import { prisma } from '@/config/database';
import { logger } from '@/config/logger';
import bcryptjs from 'bcryptjs';
import process from 'node:process';

/**
 * Clean minimal seed — exactly 4 accounts, 3 companies:
 *
 *  santosh.787402@smc.tu.edu.np / SuperAdmin@123!  — FinGuard SUPERADMIN (platform owner, creates companies)
 *  shrestharama65@gmail.com        / AcmeAdmin@123!    — ADMIN of Acme Financial Corporation
 *  bcasmc2078@gmail.com            / AcmeReviewer@123! — REVIEWER at Acme (reviews KYC + loans)
 *  shrestharama650@gmail.com       / Customer@123!     — demo CUSTOMER at Acme (1 pending KYC + 1 pending loan)
 *
 *  Companies: acme (open join), everest (open join), himalayan (invitation-code join).
 *  Invite mails + join codes are sent from rustamshrestha619@gmail.com (SMTP in .env).
 */
async function main() {
  try {
    logger.info('Seeding FinGuard — minimal: 3 companies + 4 accounts');

    const hash = (pw: string) => bcryptjs.hash(pw, 12);

    // ---- legacy roles (used by JWT guards via normalizeRoleName) ----
    const [userRole, reviewerRole, adminRole] = await Promise.all([
      prisma.role.upsert({ where: { name: 'USER' }, update: {}, create: { name: 'USER' } }),
      prisma.role.upsert({ where: { name: 'REVIEWER' }, update: {}, create: { name: 'REVIEWER' } }),
      prisma.role.upsert({ where: { name: 'ADMIN' }, update: {}, create: { name: 'ADMIN' } }),
    ]);

    // ---- tenants ----
    const tenantsSeed = [
      { slug: 'default', name: 'Default Tenant', companyType: 'platform', joinMode: 'code', domain: 'default.finguard.local', logoUrl: '/images/logo512.png' },
      { slug: 'acme', name: 'Acme Financial Corporation', companyType: 'bank', joinMode: 'open', domain: 'acme.finguard.local', logoUrl: '/images/logo512.png', panNumber: 'ACME000001A' },
      { slug: 'everest', name: 'Everest Credit Union', companyType: 'credit-union', joinMode: 'open', domain: 'everest.finguard.local', logoUrl: '/images/logo512.png', panNumber: 'EVEREST0002B' },
      { slug: 'himalayan', name: 'Himalayan Microfinance', companyType: 'microfinance', joinMode: 'code', domain: 'himalayan.finguard.local', logoUrl: '/images/logo512.png', panNumber: 'HIMALAYAN03C' },
    ];
    const tenantMap = new Map<string, { id: number; slug: string }>();
    for (const t of tenantsSeed) {
      const tenant = await prisma.tenant.upsert({
        where: { slug: t.slug },
        update: { name: t.name, companyType: t.companyType, joinMode: t.joinMode, domain: t.domain, logoUrl: t.logoUrl, status: 'active', ...(t.panNumber ? { panNumber: t.panNumber } : {}) },
        create: { slug: t.slug, name: t.name, companyType: t.companyType, joinMode: t.joinMode, domain: t.domain, logoUrl: t.logoUrl, status: 'active', ...(t.panNumber ? { panNumber: t.panNumber } : {}) },
      });
      tenantMap.set(t.slug, tenant);
      logger.info({ tenantId: tenant.id, slug: t.slug, joinMode: t.joinMode }, 'Tenant ensured');
    }
    const defaultTenant = tenantMap.get('default')!;
    const acme = tenantMap.get('acme')!;

    // ---- platform owner (public.supercontroller) ----
    const SUPERADMIN_EMAIL = 'santosh.787402@smc.tu.edu.np';
    try {
      await (prisma as any).supercontroller.upsert({
        where: { email: SUPERADMIN_EMAIL },
        update: {},
        create: { email: SUPERADMIN_EMAIL, passwordHash: await hash('SuperAdmin@123!'), fullName: 'FinGuard Super Admin', status: 'active' },
      });
      logger.info('Supercontroller ensured: santosh.787402@smc.tu.edu.np / SuperAdmin@123!');
    } catch (e) {
      logger.warn({ err: e }, 'Supercontroller upsert skipped');
    }

    // ---- role definitions + permissions (platform RBAC tables) ----
    const roleDefsData = [
      { name: 'Supercontroller', description: 'Platform super admin', hierarchyLevel: 0, colorCode: '#000000', icon: 'shield-admin' },
      { name: 'TenantAdmin', description: 'Tenant administrator', hierarchyLevel: 1, colorCode: '#0066cc', icon: 'building' },
      { name: 'Admin', description: 'System admin (legacy)', hierarchyLevel: 0, colorCode: '#1a1a1a', icon: 'shield' },
      { name: 'LoanApprover', description: 'Loan approver', hierarchyLevel: 2, colorCode: '#0099cc', icon: 'check-circle' },
      { name: 'Validator', description: 'KYC/Documents validator', hierarchyLevel: 2, colorCode: '#6600cc', icon: 'briefcase' },
      { name: 'Employee', description: 'Tenant employee', hierarchyLevel: 2, colorCode: '#6600cc', icon: 'briefcase' },
      { name: 'Customer', description: 'End customer', hierarchyLevel: 3, colorCode: '#00cc66', icon: 'user' },
    ];
    for (const rd of roleDefsData) {
      const existing = await prisma.roleDefinition.findFirst({ where: { name: rd.name } });
      if (!existing) await prisma.roleDefinition.create({ data: rd as never });
    }
    const permsData = [
      { name: 'tenants.create', resource: 'tenants', action: 'create', category: 'tenants', hierarchyLevel: 0, description: 'Create new tenant' },
      { name: 'tenants.read', resource: 'tenants', action: 'read', category: 'tenants', hierarchyLevel: 0, description: 'Read tenant info' },
      { name: 'tenants.update', resource: 'tenants', action: 'update', category: 'tenants', hierarchyLevel: 0, description: 'Update tenant settings' },
      { name: 'tenants.delete', resource: 'tenants', action: 'delete', category: 'tenants', hierarchyLevel: 0, description: 'Delete tenant' },
      { name: 'loans.read', resource: 'loans', action: 'read', category: 'loans', hierarchyLevel: 2, description: 'Read loan details' },
      { name: 'loans.write', resource: 'loans', action: 'write', category: 'loans', hierarchyLevel: 3, description: 'Apply for loan' },
      { name: 'loans.approve', resource: 'loans', action: 'approve', category: 'loans', hierarchyLevel: 2, description: 'Approve loans' },
      { name: 'loans.reject', resource: 'loans', action: 'reject', category: 'loans', hierarchyLevel: 2, description: 'Reject loans' },
      { name: 'users.read', resource: 'users', action: 'read', category: 'users', hierarchyLevel: 1, description: 'Read users' },
      { name: 'users.write', resource: 'users', action: 'write', category: 'users', hierarchyLevel: 1, description: 'Create/update users' },
      { name: 'users.manage', resource: 'users', action: 'manage', category: 'users', hierarchyLevel: 1, description: 'Manage users in tenant' },
      { name: 'admin.access', resource: 'admin', action: 'access', category: 'audit', hierarchyLevel: 1, description: 'Access admin dashboard' },
      { name: 'features.toggle', resource: 'features', action: 'toggle', category: 'features', hierarchyLevel: 0, description: 'Enable/disable features' },
      { name: 'audit.view', resource: 'audit', action: 'view', category: 'audit', hierarchyLevel: 1, description: 'View audit logs' },
      { name: 'audit.export', resource: 'audit', action: 'export', category: 'audit', hierarchyLevel: 0, description: 'Export audit logs' },
    ];
    for (const p of permsData) {
      await prisma.permissionDefinition.upsert({ where: { name: p.name }, update: {}, create: p as never });
    }
    const permMap = await prisma.permissionDefinition.findMany();
    const permByName = new Map(permMap.map((p) => [p.name, p.id]));
    const roleMap = await prisma.roleDefinition.findMany();
    const roleByName = new Map(roleMap.map((r) => [r.name, r.id]));
    const mappings: Record<string, string[]> = {
      Supercontroller: ['tenants.create', 'tenants.read', 'tenants.update', 'tenants.delete', 'features.toggle', 'audit.view', 'audit.export', 'admin.access', 'users.read', 'users.write', 'users.manage', 'loans.read', 'loans.write', 'loans.approve', 'loans.reject'],
      TenantAdmin: ['tenants.read', 'tenants.update', 'users.read', 'users.write', 'users.manage', 'loans.read', 'loans.approve', 'loans.reject', 'audit.view', 'admin.access'],
      Admin: ['admin.access', 'users.read', 'users.write', 'loans.read', 'loans.write', 'loans.approve', 'loans.reject', 'audit.view'],
      LoanApprover: ['loans.read', 'loans.approve', 'loans.reject', 'users.read', 'audit.view'],
      Validator: ['loans.read', 'users.read', 'audit.view'],
      Employee: ['loans.read', 'users.read'],
      Customer: ['loans.read', 'loans.write', 'users.read'],
    };
    for (const [roleName, permNames] of Object.entries(mappings)) {
      const roleId = roleByName.get(roleName);
      if (!roleId) continue;
      for (const pn of permNames) {
        const pid = permByName.get(pn);
        if (!pid) continue;
        await prisma.rolePermission.upsert({
          where: { roleId_permissionId: { roleId, permissionId: pid } } as never,
          update: {},
          create: { roleId, permissionId: pid },
        }).catch(() => {});
      }
    }

    // ---- the 4 accounts ----
    const accounts = [
      { email: SUPERADMIN_EMAIL, password: 'SuperAdmin@123!', roleId: adminRole.id, tenantId: defaultTenant.id, fullName: 'FinGuard Super Admin', phone: '+977-9800000001', tenantAdmin: false },
      { email: 'shrestharama65@gmail.com', password: 'AcmeAdmin@123!', roleId: adminRole.id, tenantId: acme.id, fullName: 'Acme Admin', phone: '+977-9800000002', tenantAdmin: true },
      { email: 'bcasmc2078@gmail.com', password: 'AcmeReviewer@123!', roleId: reviewerRole.id, tenantId: acme.id, fullName: 'Acme Reviewer', phone: '+977-9800000003', tenantAdmin: false },
      { email: 'shrestharama650@gmail.com', password: 'Customer@123!', roleId: userRole.id, tenantId: acme.id, fullName: 'Demo Customer', phone: '+977-9800000004', tenantAdmin: false },
    ];
    const idsByEmail = new Map<string, string>();
    for (const a of accounts) {
      let user = await prisma.user.findUnique({ where: { email: a.email } });
      if (!user) {
        user = await prisma.user.create({
          data: { tenantId: a.tenantId, email: a.email, passwordHash: await hash(a.password), isVerified: true, roleId: a.roleId, profile: { create: { fullName: a.fullName, phone: a.phone } } },
        });
        logger.info({ email: a.email }, 'Account created');
      } else {
        user = await prisma.user.update({ where: { id: user.id }, data: { tenantId: a.tenantId, roleId: a.roleId, passwordHash: await hash(a.password), isVerified: true } });
      }
      idsByEmail.set(a.email, user.id);
      if (a.tenantAdmin) {
        const exists = await prisma.tenantAdmin.findFirst({ where: { tenantId: a.tenantId, userId: user.id } });
        if (!exists) await prisma.tenantAdmin.create({ data: { tenantId: a.tenantId, userId: user.id, email: a.email } });
      }
    }
    const adminId = idsByEmail.get('shrestharama65@gmail.com')!;
    const reviewerId = idsByEmail.get('bcasmc2078@gmail.com')!;
    const customerId = idsByEmail.get('shrestharama650@gmail.com')!;

    // ---- demo customer data: 1 PENDING KYC + 1 SUBMITTED loan (reviewer queue) ----
    const kycExisting = await prisma.kycApplication.findFirst({ where: { userId: customerId, tenantId: acme.id } });
    if (!kycExisting) {
      await prisma.kycApplication.create({
        data: {
          tenantId: acme.id, userId: customerId, status: 'PENDING',
          submittedAt: new Date(),
          ocrCitizenshipNumber: 'ACMEDEMO01', ocrFullName: 'Demo Customer',
          confirmedCitizenshipNumber: 'ACMEDEMO01', confirmedFullName: 'Demo Customer',
          confirmedMonthlyIncome: 85000,
          processingStatus: 'DONE', ocrFrontStatus: 'DONE', ocrBackStatus: 'DONE',
          faceStatus: 'DONE', workflowStage: 'COMPLETE',
          faceVerificationStatus: 'VERIFIED', ocrProcessingStatus: 'EXTRACTED',
        },
      });
      logger.info('Demo customer PENDING KYC created');
    }
    const loanExisting = await prisma.loanApplication.findFirst({ where: { userId: customerId, tenantId: acme.id } });
    if (!loanExisting) {
      await prisma.loanApplication.create({
        data: { tenantId: acme.id, userId: customerId, requestedAmount: 500000, tenureMonths: 36, purpose: 'PERSONAL', status: 'SUBMITTED', calculatedEmi: 16200, riskScore: 45, riskLevel: 'MEDIUM' } as never,
      });
      logger.info('Demo customer SUBMITTED loan created');
    }
    await prisma.employmentInfo.upsert({
      where: { userId: customerId },
      update: { tenantId: acme.id },
      create: { tenantId: acme.id, userId: customerId, employmentStatus: 'EMPLOYED', occupationJobTitle: 'Accountant', employerName: 'Acme Partners', monthlyGrossIncome: 85000, annualIncome: 1020000, dependentsCount: 2, employmentTenureMonths: 48, employmentTenureDays: -1460, employmentStable: true },
    }).catch(() => {});
    await prisma.financialProfile.upsert({
      where: { userId: customerId },
      update: { tenantId: acme.id },
      create: { tenantId: acme.id, userId: customerId, avgMonthlyIncome: 85000, avgMonthlyExpense: 45000, totalIncome: 1020000, totalExpense: 540000, savingsRate: 0.47, incomeStabilityScore: 82, creditScoreEstimate: 740 } as never,
    }).catch(() => {});

    // ---- chat: admin <-> reviewer can talk (seeded conversation) ----
    const convId = `conv_seed_acme_admin_reviewer`;
    const seeded = await prisma.chatConversation.findFirst({ where: { userId: adminId, sessionId: convId } });
    if (!seeded) {
      const context = { participants: [adminId, reviewerId], type: 'staff' };
      const messages = [
        { role: 'user', content: 'Welcome to Acme Financial Corporation. Please review the pending KYC queue today.', timestamp: new Date(Date.now() - 3600 * 1000).toISOString(), senderId: adminId },
        { role: 'user', content: 'On it — I will start with the demo customer application.', timestamp: new Date(Date.now() - 1800 * 1000).toISOString(), senderId: reviewerId },
      ];
      await prisma.$transaction([
        prisma.chatConversation.create({ data: { tenantId: acme.id, userId: adminId, sessionId: convId, messages: messages as never, context: context as never } }),
        prisma.chatConversation.create({ data: { tenantId: acme.id, userId: reviewerId, sessionId: convId, messages: messages as never, context: context as never } }),
      ]);
      logger.info('Seeded admin<->reviewer conversation');
    }

    // ---- feature toggles + usage counters ----
    const scRecord = await (prisma as any).supercontroller.findUnique({ where: { email: SUPERADMIN_EMAIL } }).catch(() => null) as { id: number } | null;
    for (const t of tenantsSeed) {
      const tenant = tenantMap.get(t.slug)!;
      for (const fn of ['feature_ml_scoring', 'feature_audit_logs', 'feature_api_access']) {
        try {
          await (prisma as any).featureToggle.upsert({
            where: { tenantId_featureName: { tenantId: tenant.id, featureName: fn } },
            update: { isEnabled: true },
            create: { tenantId: tenant.id, featureName: fn, isEnabled: true, enabledBy: scRecord?.id ?? null, enabledAt: new Date() },
          } as never);
        } catch { /* ignore */ }
      }
      const userCount = await prisma.user.count({ where: { tenantId: tenant.id } });
      const loanCount = await prisma.loanApplication.count({ where: { tenantId: tenant.id } });
      await prisma.tenant.update({ where: { id: tenant.id }, data: { usageUsers: userCount, usageLoans: loanCount, lastActivity: new Date() } });
    }

    logger.info('Seeding complete — 3 companies, 4 accounts, reviewer queue + staff chat ready');
  } catch (error) {
    logger.error({ err: error }, 'Seeding failed');
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
