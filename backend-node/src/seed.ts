import { prisma } from '@/config/database';
import { logger } from '@/config/logger';
import bcryptjs from 'bcryptjs';
import process from 'node:process';

async function main() {
  try {
    logger.info('Seeding database — SuperController hierarchy + ample tenants');

    const roles = await Promise.all([
      prisma.role.upsert({ where: { name: 'USER' }, update: {}, create: { name: 'USER' } }),
      prisma.role.upsert({ where: { name: 'REVIEWER' }, update: {}, create: { name: 'REVIEWER' } }),
      prisma.role.upsert({ where: { name: 'ADMIN' }, update: {}, create: { name: 'ADMIN' } }),
    ]);
    const [userRole, reviewerRole, adminRole] = roles;
    logger.info('Legacy Roles ensured');

    // Supercontroller (public schema)
    const scHash = await bcryptjs.hash('SuperAdmin@123', 12);
    try {
      await (prisma as unknown as Record<string, { upsert: (a: unknown) => Promise<unknown> }>).supercontroller.upsert({
        where: { email: 'admin@finguard.io' },
        update: {},
        create: { email: 'admin@finguard.io', passwordHash: scHash, fullName: 'FinGuard Super Admin', status: 'active' },
      } as never);
      logger.info('Supercontroller ensured: admin@finguard.io / SuperAdmin@123');
    } catch (e) {
      logger.warn({ err: e }, 'Supercontroller upsert skipped (public schema not yet migrated on this env)');
    }

    const COMMON_PW = 'Password@123';
    // Tenants — 5 real-world companies + default (PAN mandatory, logo emblem)
    const tenantsSeed = [
      { slug: 'default', name: 'Default Tenant', companyType: 'fintech', subscriptionTier: 'professional', maxUsers: 500, maxLoans: 10000, status: 'active' as const, domain: 'default.finguard.local', logoUrl: '/images/logo512.png', panNumber: 'AAAAA0000A' },
      { slug: 'finguard-acme', name: 'Acme Financial Corporation', companyType: 'bank', subscriptionTier: 'enterprise', maxUsers: 500, maxLoans: 10000, status: 'active' as const, domain: 'acme.finguard.local', logoUrl: '/images/tenants/acme.png', panNumber: 'ABCDE1234F' },
      { slug: 'finguard-globebank', name: 'GlobeBank', companyType: 'bank', subscriptionTier: 'enterprise', maxUsers: 1000, maxLoans: 50000, status: 'active' as const, domain: 'globebank.finguard.local', logoUrl: '/images/tenants/globe.png', panNumber: 'FGHIJ5678K' },
      { slug: 'finguard-fastcredit', name: 'FastCredit Fintech', companyType: 'fintech', subscriptionTier: 'basic', maxUsers: 100, maxLoans: 1000, status: 'active' as const, domain: 'fastcredit.finguard.local', logoUrl: '/images/tenants/fast.png', panNumber: 'KLMNO9012P' },
      { slug: 'finguard-everest', name: 'Everest Credit Union', companyType: 'credit-union', subscriptionTier: 'professional', maxUsers: 300, maxLoans: 5000, status: 'active' as const, domain: 'everest.finguard.local', logoUrl: '/images/tenants/everest.png', panNumber: 'QRSTU3456V' },
      { slug: 'finguard-himalayan', name: 'Himalayan Microfinance', companyType: 'microfinance', subscriptionTier: 'basic', maxUsers: 150, maxLoans: 2000, status: 'active' as const, domain: 'himalayan.finguard.local', logoUrl: '/images/tenants/hima.png', panNumber: 'WXYZA7890B' },
    ];
    const tenantMap = new Map<string, { id: number; slug: string }>();
    for (const t of tenantsSeed) {
      const tenant = await prisma.tenant.upsert({
        where: { slug: t.slug },
        update: {
          name: t.name,
          companyType: t.companyType,
          subscriptionTier: t.subscriptionTier,
          maxUsers: t.maxUsers,
          maxLoans: t.maxLoans,
          status: t.status,
          domain: t.domain,
          logoUrl: (t as any).logoUrl,
          panNumber: (t as any).panNumber,
        },
        create: {
          slug: t.slug,
          name: t.name,
          companyType: t.companyType,
          subscriptionTier: t.subscriptionTier,
          maxUsers: t.maxUsers,
          maxLoans: t.maxLoans,
          status: t.status,
          domain: t.domain,
          logoUrl: (t as any).logoUrl,
          panNumber: (t as any).panNumber,
        },
      });
      tenantMap.set(t.slug, tenant);
      logger.info({ tenantId: tenant.id, slug: t.slug }, 'Tenant ensured');
    }
    const defaultTenant = tenantMap.get('default')!;

    // RoleDefinitions with hierarchyLevel + colorCode/icon (spec)
    const roleDefsData: Array<{ name: string; description: string; hierarchyLevel: number; colorCode: string; icon: string }> = [
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
      else await prisma.roleDefinition.update({ where: { id: existing.id }, data: { hierarchyLevel: rd.hierarchyLevel, colorCode: rd.colorCode, icon: rd.icon } as never }).catch(() => {});
    }
    const permsData: Array<{ name: string; resource: string; action: string; category: string; hierarchyLevel: number; description: string }> = [
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
      await prisma.permissionDefinition.upsert({ where: { name: p.name }, update: { category: p.category, hierarchyLevel: p.hierarchyLevel, description: p.description } as never, create: p as never });
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
        }).catch(() => prisma.rolePermission.create({ data: { roleId, permissionId: pid } }).catch(() => {}));
      }
    }
    logger.info('RoleDefinitions & permissions seeded (hierarchy + colors)');

    // Feature toggles per tenant (public)
    const scRecord = await (prisma as unknown as { supercontroller: { findUnique: (a: unknown) => Promise<unknown> } }).supercontroller.findUnique({ where: { email: 'admin@finguard.io' } }).catch(() => null) as { id: number } | null;
    const featureNames = ['feature_ml_scoring', 'feature_audit_logs', 'feature_api_access', 'feature_custom_workflows'];
    for (const t of tenantsSeed) {
      const tenant = tenantMap.get(t.slug)!;
      for (const fn of featureNames) {
        const isEnabled = t.subscriptionTier !== 'basic' || fn === 'feature_ml_scoring';
        try {
          await (prisma as unknown as Record<string, { upsert: (a: unknown) => Promise<unknown> }>).featureToggle.upsert({
            where: { tenantId_featureName: { tenantId: tenant.id, featureName: fn } },
            update: { isEnabled, enabledBy: scRecord?.id ?? null, enabledAt: new Date() },
            create: { tenantId: tenant.id, featureName: fn, isEnabled, enabledBy: scRecord?.id ?? null, enabledAt: new Date() },
          } as never);
        } catch { /* ignore */ }
      }
    }

    const hash = (pw: string) => bcryptjs.hash(pw, 12);
    const commonHash = await hash(COMMON_PW);
    const legacyUsers = [
      { email: 'admin@finguard.local', password: commonHash, roleId: adminRole.id, profile: { fullName: 'System Admin', phone: '+1-555-0100' } },
      { email: 'reviewer@finguard.local', password: commonHash, roleId: reviewerRole.id, profile: { fullName: 'KYC Reviewer', phone: '+1-555-0101' } },
      { email: 'user@finguard.local', password: commonHash, roleId: userRole.id, profile: { fullName: 'John Doe', phone: '+1-555-0102', address: '123 Main St, Springfield' } },
    ];
    for (const u of legacyUsers) {
      const existing = await prisma.user.findUnique({ where: { email: u.email } });
      if (!existing) {
        await prisma.user.create({ data: { tenantId: defaultTenant.id, email: u.email, passwordHash: u.password, isVerified: true, roleId: u.roleId, profile: { create: u.profile } } });
        logger.info({ email: u.email }, 'Legacy user created');
      }
    }

    // Per-tenant users (5 tenants x 6 users)
    const tenantUserDefs: Array<{ tenantSlug: string; users: Array<{ email: string; roleName: string; legacyRole: string; fullName: string; phone: string }> }> = [
      {
        tenantSlug: 'finguard-acme',
        users: [
          { email: 'admin@acme.finguard.test', roleName: 'TenantAdmin', legacyRole: 'ADMIN', fullName: 'Acme Admin', phone: '+1-555-1001' },
          { email: 'approver@acme.finguard.test', roleName: 'LoanApprover', legacyRole: 'REVIEWER', fullName: 'Acme Approver', phone: '+1-555-1002' },
          { email: 'validator@acme.finguard.test', roleName: 'Validator', legacyRole: 'REVIEWER', fullName: 'Acme Validator', phone: '+1-555-1003' },
          { email: 'customer1@acme.finguard.test', roleName: 'Customer', legacyRole: 'USER', fullName: 'Alice Acme', phone: '+1-555-1004' },
          { email: 'customer2@acme.finguard.test', roleName: 'Customer', legacyRole: 'USER', fullName: 'Bob Acme', phone: '+1-555-1005' },
          { email: 'employee@acme.finguard.test', roleName: 'Employee', legacyRole: 'USER', fullName: 'Eve Acme', phone: '+1-555-1006' },
        ],
      },
      {
        tenantSlug: 'finguard-globebank',
        users: [
          { email: 'admin@globebank.finguard.test', roleName: 'TenantAdmin', legacyRole: 'ADMIN', fullName: 'Globe Admin', phone: '+1-555-2001' },
          { email: 'approver@globebank.finguard.test', roleName: 'LoanApprover', legacyRole: 'REVIEWER', fullName: 'Globe Approver', phone: '+1-555-2002' },
          { email: 'customer1@globebank.finguard.test', roleName: 'Customer', legacyRole: 'USER', fullName: 'Clara Globe', phone: '+1-555-2003' },
          { email: 'customer2@globebank.finguard.test', roleName: 'Customer', legacyRole: 'USER', fullName: 'David Globe', phone: '+1-555-2004' },
        ],
      },
      {
        tenantSlug: 'finguard-fastcredit',
        users: [
          { email: 'admin@fastcredit.finguard.test', roleName: 'TenantAdmin', legacyRole: 'ADMIN', fullName: 'FastCredit Admin', phone: '+1-555-3001' },
          { email: 'customer1@fastcredit.finguard.test', roleName: 'Customer', legacyRole: 'USER', fullName: 'Fiona Fast', phone: '+1-555-3002' },
        ],
      },
      {
        tenantSlug: 'finguard-everest',
        users: [
          { email: 'admin@everest.finguard.test', roleName: 'TenantAdmin', legacyRole: 'ADMIN', fullName: 'Everest Admin', phone: '+1-555-4001' },
          { email: 'approver@everest.finguard.test', roleName: 'LoanApprover', legacyRole: 'REVIEWER', fullName: 'Everest Approver', phone: '+1-555-4002' },
          { email: 'customer1@everest.finguard.test', roleName: 'Customer', legacyRole: 'USER', fullName: 'Eva Everest', phone: '+1-555-4003' },
          { email: 'customer2@everest.finguard.test', roleName: 'Customer', legacyRole: 'USER', fullName: 'Sam Everest', phone: '+1-555-4004' },
        ],
      },
      {
        tenantSlug: 'finguard-himalayan',
        users: [
          { email: 'admin@himalayan.finguard.test', roleName: 'TenantAdmin', legacyRole: 'ADMIN', fullName: 'Himalayan Admin', phone: '+1-555-5001' },
          { email: 'customer1@himalayan.finguard.test', roleName: 'Customer', legacyRole: 'USER', fullName: 'Hari Himalayan', phone: '+1-555-5002' },
        ],
      },
    ];
    const createdUsersByEmail = new Map<string, { id: string; tenantId: number }>();
    for (const group of tenantUserDefs) {
      const tenant = tenantMap.get(group.tenantSlug)!;
      for (const u of group.users) {
        const legacyRole = roles.find((r) => r.name === u.legacyRole) ?? adminRole;
        const pwHash = commonHash;
        let user = await prisma.user.findUnique({ where: { email: u.email } });
        if (!user) {
          user = await prisma.user.create({
            data: { tenantId: tenant.id, email: u.email, passwordHash: pwHash, isVerified: true, roleId: legacyRole.id, profile: { create: { fullName: u.fullName, phone: u.phone } } },
          });
          logger.info({ email: u.email, tenantId: tenant.id }, 'Tenant user created');
        } else if (user.tenantId !== tenant.id) {
          user = await prisma.user.update({ where: { id: user.id }, data: { tenantId: tenant.id } });
        }
        if (u.legacyRole === 'ADMIN' || u.roleName === 'TenantAdmin' || u.roleName === 'LoanApprover' || u.roleName === 'Validator') {
          await prisma.tenantAdmin.upsert({ where: { id: -1 } as any, update: {}, create: { tenantId: tenant.id, userId: user.id, email: u.email } } as never).catch(async () => {
            const exists = await prisma.tenantAdmin.findFirst({ where: { tenantId: tenant.id, userId: user.id } });
            if (!exists) await prisma.tenantAdmin.create({ data: { tenantId: tenant.id, userId: user.id, email: u.email } });
          });
        }
        createdUsersByEmail.set(u.email, { id: user.id, tenantId: tenant.id });
      }
    }

    // KYC + Loan + Profile sample per customer
    const customerEmails = Array.from(createdUsersByEmail.entries()).filter(([email]) => email.includes('customer'));
    for (const [email, info] of customerEmails) {
      const tenantId = info.tenantId;
      const kycExisting = await prisma.kycApplication.findFirst({ where: { userId: info.id, tenantId } });
      if (!kycExisting) {
        const kyc = await prisma.kycApplication.create({
          data: {
            tenantId,
            userId: info.id,
            status: 'APPROVED',
            submittedAt: new Date(Date.now() - 5 * 24 * 3600 * 1000),
            reviewedAt: new Date(Date.now() - 4 * 24 * 3600 * 1000),
            ocrCitizenshipNumber: `CIT-${Math.floor(100000000 + Math.random() * 900000000)}`,
            ocrFullName: email.split('@')[0],
            confirmedCitizenshipNumber: `CIT-${Math.floor(100000000 + Math.random() * 900000000)}`,
            confirmedFullName: email.split('@')[0],
            confirmedMonthlyIncome: 5000 + Math.floor(Math.random() * 5000),
            processingStatus: 'DONE',
            ocrFrontStatus: 'DONE',
            ocrBackStatus: 'DONE',
            faceStatus: 'DONE',
            workflowStage: 'COMPLETE',
            faceVerificationStatus: 'VERIFIED',
            ocrProcessingStatus: 'EXTRACTED',
          },
        });
        logger.info({ kycId: kyc.id, email }, 'KYC seeded');
      }
      // Pending KYC variant for one customer per tenant (second customer)
      if (email.includes('customer2')) {
        const pendingExists = await prisma.kycApplication.findFirst({ where: { userId: info.id, status: 'PENDING', tenantId } });
        if (!pendingExists) {
          await prisma.kycApplication.create({
            data: { tenantId, userId: info.id, status: 'PENDING', processingStatus: 'PENDING', faceVerificationStatus: 'PENDING', ocrProcessingStatus: 'PENDING' },
          });
        }
      }
      // EmploymentInfo + FinancialProfile + LoanFeatures
      await prisma.employmentInfo.upsert({
        where: { userId: info.id },
        update: { tenantId },
        create: {
          tenantId,
          userId: info.id,
          employmentStatus: 'EMPLOYED',
          occupationJobTitle: 'Engineer',
          employerName: tenantMap.get(customerEmails.find(([e]) => e === email)?.[0].split('@')[1]?.split('.')[0] ? '' : '') ? 'Acme Corp' : 'Employer Inc',
          monthlyGrossIncome: 5000,
          annualIncome: 60000,
          dependentsCount: 1,
          employmentTenureMonths: 36,
          employmentTenureDays: -1095,
          employmentStable: false,
        },
      }).catch(() => {});
      await prisma.financialProfile.upsert({
        where: { userId: info.id },
        update: { tenantId, avgMonthlyIncome: 5500, avgMonthlyExpense: 3200, totalIncome: 66000, totalExpense: 38400, savingsRate: 0.42, incomeStabilityScore: 78, creditScoreEstimate: 720 },
        create: { tenantId, userId: info.id, avgMonthlyIncome: 5500, avgMonthlyExpense: 3200, totalIncome: 66000, totalExpense: 38400, savingsRate: 0.42, incomeStabilityScore: 78, creditScoreEstimate: 720 } as never,
      }).catch(() => {});
      await prisma.portfolioVerification.upsert({
        where: { userId: info.id },
        update: { tenantId, verificationStatus: 'VERIFIED', documentsUploaded: 3, documentsVerified: 3, allDocumentsVerified: true, canProceedToLoan: true, overallRiskScore: 35, riskLevel: 'LOW' },
        create: { tenantId, userId: info.id, verificationStatus: 'VERIFIED', documentsUploaded: 3, documentsVerified: 3, allDocumentsVerified: true, canProceedToLoan: true, overallRiskScore: 35, riskLevel: 'LOW' } as never,
      }).catch(() => {});

      // Loan applications: 1 approved, 1 pending per customer (with P2022 fallback)
      let shouldCreateLoans = true;
      try {
        const existingLoans = await prisma.loanApplication.findMany({ where: { userId: info.id, tenantId } });
        shouldCreateLoans = existingLoans.length === 0;
      } catch (e) {
        const msg = String((e as Error)?.message ?? '');
        if (msg.includes('defaultProbability') || msg.includes('P2022')) {
          logger.warn({ email, err: msg.slice(0, 200) }, 'LoanApplication column missing — using raw check');
          const rows = (await prisma.$queryRawUnsafe(`SELECT COUNT(*)::int as cnt FROM "auth"."loan_applications" WHERE "userId" = $1 AND "tenantId" = $2`, info.id, tenantId)) as Array<{ cnt: number }>;
          shouldCreateLoans = (rows[0]?.cnt ?? 0) === 0;
          if (shouldCreateLoans) {
            try {
              await prisma.$executeRawUnsafe(
                `INSERT INTO "auth"."loan_applications" ("id","tenantId","userId","requestedAmount","tenureMonths","purpose","status","riskScore","riskLevel","createdAt","updatedAt") VALUES (gen_random_uuid()::text,$1,$2,15000,24,'PERSONAL','APPROVED',32,'LOW',NOW(),NOW())`,
                tenantId, info.id,
              );
              await prisma.$executeRawUnsafe(
                `INSERT INTO "auth"."loan_applications" ("id","tenantId","userId","requestedAmount","tenureMonths","purpose","status","riskScore","riskLevel","createdAt","updatedAt") VALUES (gen_random_uuid()::text,$1,$2,8000,12,'EDUCATION','SUBMITTED',58,'MEDIUM',NOW(),NOW())`,
                tenantId, info.id,
              );
            } catch (ie) { logger.warn({ err: ie }, 'Raw loan insert fallback failed'); }
            shouldCreateLoans = false;
          }
        } else throw e;
      }
      if (shouldCreateLoans) {
        const loanApproved = await prisma.loanApplication.create({
          data: { tenantId, userId: info.id, requestedAmount: 15000, tenureMonths: 24, purpose: 'PERSONAL', status: 'APPROVED', riskScore: 32, riskLevel: 'LOW', creditScore: 720, defaultProbability: 0.07, modelVersion: 'v1.0' },
        }).catch(async () => {
          await prisma.$executeRawUnsafe(
            `INSERT INTO "auth"."loan_applications" ("id","tenantId","userId","requestedAmount","tenureMonths","purpose","status","riskScore","riskLevel","createdAt","updatedAt") VALUES (gen_random_uuid()::text,$1,$2,15000,24,'PERSONAL','APPROVED',32,'LOW',NOW(),NOW())`,
            tenantId, info.id,
          ).catch(() => {});
          return prisma.loanApplication.findFirst({ where: { userId: info.id, tenantId, status: 'APPROVED' } }) as any;
        });
        await prisma.loanApplication.create({
          data: { tenantId, userId: info.id, requestedAmount: 8000, tenureMonths: 12, purpose: 'EDUCATION', status: 'SUBMITTED', riskScore: 58, riskLevel: 'MEDIUM' },
        }).catch(async () => {
          await prisma.$executeRawUnsafe(
            `INSERT INTO "auth"."loan_applications" ("id","tenantId","userId","requestedAmount","tenureMonths","purpose","status","riskScore","riskLevel","createdAt","updatedAt") VALUES (gen_random_uuid()::text,$1,$2,8000,12,'EDUCATION','SUBMITTED',58,'MEDIUM',NOW(),NOW())`,
            tenantId, info.id,
          ).catch(() => {});
        });
        // Strict isolation + centralized tracking: create active LoanAccount for approved loan
        try {
          const approvedId = (loanApproved as any)?.id || (await prisma.loanApplication.findFirst({ where: { userId: info.id, tenantId, status: 'APPROVED' } }))?.id;
          const existingAcct = await prisma.loanAccount.findFirst({ where: { userId: info.id, tenantId, loanId: approvedId } }).catch(()=>null);
          if (!existingAcct && approvedId) {
            await prisma.loanAccount.create({ data: { tenantId, userId: info.id, loanId: approvedId, principalAmount: 15000, outstandingBalance: 12000, monthlyEMI: 720, status: 'ACTIVE', startDate: new Date(Date.now() - 60*24*3600*1000), isActive: true } as never });
          }
        } catch {}
      }
      // Bank statement + transactions sample
      const stmt = await prisma.bankStatement.findFirst({ where: { userId: info.id, tenantId } });
      if (!stmt) {
        const bs = await prisma.bankStatement.create({
          data: { tenantId, userId: info.id, bankName: 'Demo Bank', accountNumber: `ACC${Math.floor(1000000000 + Math.random() * 9000000000)}`, parsingStatus: 'SUCCESS', openingBalance: 12000, closingBalance: 18500 } as never,
        });
        const now = new Date();
        for (let i = 0; i < 5; i++) {
          await prisma.transaction.create({
            data: {
              tenantId,
              userId: info.id,
              bankStatementId: bs.id,
              transactionDate: new Date(now.getTime() - i * 7 * 24 * 3600 * 1000),
              description: i % 2 === 0 ? 'Salary credit' : 'Grocery expense',
              credit: i % 2 === 0 ? 5000 : null,
              debit: i % 2 === 0 ? null : 1200,
              balance: 15000 + i * 500,
              category: i % 2 === 0 ? 'INCOME' : 'EXPENSE',
            } as never,
          });
        }
      }
    }

    // Tenant metrics — 30 days backfill per tenant
    for (const [_slug, tenant] of tenantMap.entries()) {
      for (let d = 0; d < 30; d++) {
        const date = new Date();
        date.setHours(0, 0, 0, 0);
        date.setDate(date.getDate() - d);
        const totalUsers = tenant.slug === 'finguard-globebank' ? 45 + Math.floor(Math.random() * 10) : 10 + Math.floor(Math.random() * 8);
        const totalLoans = 20 + Math.floor(Math.random() * 15);
        try {
          await (prisma as unknown as Record<string, { upsert: (a: unknown) => Promise<unknown> }>).tenantMetrics.upsert({
            where: { tenantId_metricDate: { tenantId: tenant.id, metricDate: date } },
            update: { totalUsers, totalLoans, totalRevenue: totalLoans * 1200, apiCalls: 500 + Math.floor(Math.random() * 300), errorRate: Number((Math.random() * 2).toFixed(2)), avgResponseTimeMs: 80 + Math.floor(Math.random() * 40) },
            create: { tenantId: tenant.id, metricDate: date, totalUsers, totalLoans, totalRevenue: totalLoans * 1200, apiCalls: 500 + Math.floor(Math.random() * 300), errorRate: Number((Math.random() * 2).toFixed(2)), avgResponseTimeMs: 80 + Math.floor(Math.random() * 40) },
          } as never);
        } catch { /* ignore */ }
      }
      // update usage counters
      const userCount = await prisma.user.count({ where: { tenantId: tenant.id } });
      const loanCount = await prisma.loanApplication.count({ where: { tenantId: tenant.id } });
      await prisma.tenant.update({ where: { id: tenant.id }, data: { usageUsers: userCount, usageLoans: loanCount, lastActivity: new Date() } });
    }
    logger.info('Tenant metrics seeded (30 days each)');

    logger.info('Seeding complete — tenants, users, KYC/loans, metrics ready');
  } catch (error) {
    logger.error({ err: error }, 'Seeding failed');
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
