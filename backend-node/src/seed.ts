import { prisma } from '@/config/database';
import { logger } from '@/config/logger';
import bcryptjs from 'bcryptjs';
import process from 'node:process';

/**
 * Clean & Comprehensive Seed Script
 *
 * 1. Canonical Core Accounts (Unchanged & Clean):
 *    - santosh.787402@smc.tu.edu.np / SuperAdmin@123! — SUPERADMIN (Platform Owner)
 *    - shrestharama65@gmail.com     / AcmeAdmin@123!   — Acme Company ADMIN
 *    - bcasmc2078@gmail.com         / AcmeReviewer@123! — Acme Loan REVIEWER
 *    - shrestharama650@gmail.com    / Customer@123!    — Demo CUSTOMER (Clean profile & employment, 0 loans, ready for live testing)
 *
 * 2. Dedicated Demo Companies & Rich Datasets:
 *    - Apex Capital Microbank (slug: apex) — 3 customers (Approved, In-Review, Rejected loans & KYC)
 *    - Zenith Financial Services (slug: zenith) — 3 customers (Approved Education/Home loans, Pending KYC/loans)
 *    - Global Trust Co-op (slug: globaltrust) — 2 customers (Approved Business loan, Rejected KYC/loan)
 *
 * 3. Superadmin Company Requests:
 *    - Pending & Approved company onboarding requests for testing /admin/company-requests.
 */
async function main() {
  try {
    logger.info('Seeding FinGuard — canonical platform baseline & demo company variations...');

    const hash = (pw: string) => bcryptjs.hash(pw, 12);
    const defaultPasswordHash = await hash('DemoUser@123!');

    // ==========================================
    // 1. Core Auth Roles
    // ==========================================
    const [superadminRole, adminRole, reviewerRole, userRole] = await Promise.all([
      prisma.role.upsert({ where: { name: 'SUPERADMIN' }, update: {}, create: { name: 'SUPERADMIN' } }),
      prisma.role.upsert({ where: { name: 'ADMIN' }, update: {}, create: { name: 'ADMIN' } }),
      prisma.role.upsert({ where: { name: 'REVIEWER' }, update: {}, create: { name: 'REVIEWER' } }),
      prisma.role.upsert({ where: { name: 'USER' }, update: {}, create: { name: 'USER' } }),
    ]);

    // ==========================================
    // 2. Tenants (Companies)
    // ==========================================
    const tenantsSeed = [
      // Core Platform & Canonical Tenants
      {
        slug: 'default',
        name: 'FinGuard Platform',
        companyType: 'platform',
        joinMode: 'code',
        domain: 'finguard.io',
        logoUrl: '/images/logo512.png',
      },
      {
        slug: 'acme',
        name: 'Acme Financial Corporation',
        companyType: 'bank',
        joinMode: 'open',
        domain: 'acme.finguard.local',
        logoUrl: '/images/logo512.png',
        panNumber: 'ACME000001A',
      },
      {
        slug: 'everest',
        name: 'Everest Credit Union',
        companyType: 'credit-union',
        joinMode: 'open',
        domain: 'everest.finguard.local',
        logoUrl: '/images/logo512.png',
        panNumber: 'EVEREST0002B',
      },
      {
        slug: 'himalayan',
        name: 'Himalayan Microfinance',
        companyType: 'microfinance',
        joinMode: 'code',
        domain: 'himalayan.finguard.local',
        logoUrl: '/images/logo512.png',
        panNumber: 'HIMALAYAN03C',
      },
      // Demo Companies with rich test data
      {
        slug: 'apex',
        name: 'Apex Capital Microbank',
        companyType: 'microfinance',
        joinMode: 'open',
        domain: 'apex.finguard.local',
        logoUrl: '/images/logo512.png',
        panNumber: 'APEX990001D',
      },
      {
        slug: 'zenith',
        name: 'Zenith Financial Services',
        companyType: 'bank',
        joinMode: 'open',
        domain: 'zenith.finguard.local',
        logoUrl: '/images/logo512.png',
        panNumber: 'ZENITH88002E',
      },
      {
        slug: 'globaltrust',
        name: 'Global Trust Co-operative',
        companyType: 'credit-union',
        joinMode: 'code',
        domain: 'globaltrust.finguard.local',
        logoUrl: '/images/logo512.png',
        panNumber: 'GLOBAL77003F',
      },
    ];

    const tenantMap = new Map<string, { id: number; slug: string }>();
    for (const t of tenantsSeed) {
      const tenant = await prisma.tenant.upsert({
        where: { slug: t.slug },
        update: {
          name: t.name,
          companyType: t.companyType,
          joinMode: t.joinMode,
          domain: t.domain,
          logoUrl: t.logoUrl,
          status: 'active',
          ...(t.panNumber ? { panNumber: t.panNumber } : {}),
        },
        create: {
          slug: t.slug,
          name: t.name,
          companyType: t.companyType,
          joinMode: t.joinMode,
          domain: t.domain,
          logoUrl: t.logoUrl,
          status: 'active',
          ...(t.panNumber ? { panNumber: t.panNumber } : {}),
        },
      });
      tenantMap.set(t.slug, tenant);
      logger.info({ tenantId: tenant.id, slug: t.slug }, 'Tenant ensured');
    }

    const defaultTenant = tenantMap.get('default')!;
    const acme = tenantMap.get('acme')!;
    const apex = tenantMap.get('apex')!;
    const zenith = tenantMap.get('zenith')!;
    const globaltrust = tenantMap.get('globaltrust')!;

    // ==========================================
    // 3. Platform Supercontroller Record
    // ==========================================
    const SUPERADMIN_EMAIL = 'santosh.787402@smc.tu.edu.np';
    let scRecord: { id: number } | null = null;
    try {
      scRecord = await (prisma as any).supercontroller.upsert({
        where: { email: SUPERADMIN_EMAIL },
        update: {},
        create: {
          email: SUPERADMIN_EMAIL,
          passwordHash: await hash('SuperAdmin@123!'),
          fullName: 'FinGuard Super Admin',
          status: 'active',
        },
      });
      logger.info('Supercontroller owner ensured in public.supercontroller');
    } catch {
      // ignore if supercontroller table is omitted
    }

    // ==========================================
    // 4. Platform RBAC Role Definitions & Permissions
    // ==========================================
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

    // ==========================================
    // 5. Canonical Core Accounts (Unchanged)
    // ==========================================
    const canonicalAccounts = [
      {
        email: SUPERADMIN_EMAIL,
        password: 'SuperAdmin@123!',
        roleId: superadminRole.id,
        tenantId: defaultTenant.id,
        fullName: 'FinGuard Super Admin',
        phone: '+977-9800000001',
        isSuperUser: true,
        tenantAdmin: false,
      },
      {
        email: 'shrestharama65@gmail.com',
        password: 'AcmeAdmin@123!',
        roleId: adminRole.id,
        tenantId: acme.id,
        fullName: 'Acme Admin',
        phone: '+977-9800000002',
        isSuperUser: false,
        tenantAdmin: true,
      },
      {
        email: 'bcasmc2078@gmail.com',
        password: 'AcmeReviewer@123!',
        roleId: reviewerRole.id,
        tenantId: acme.id,
        fullName: 'Acme Reviewer',
        phone: '+977-9800000003',
        isSuperUser: false,
        tenantAdmin: false,
      },
      {
        email: 'shrestharama650@gmail.com',
        password: 'Customer@123!',
        roleId: userRole.id,
        tenantId: acme.id,
        fullName: 'Rama Shrestha',
        phone: '+977-9801234567',
        isSuperUser: false,
        tenantAdmin: false,
      },
    ];

    const userIdByEmail = new Map<string, string>();
    for (const a of canonicalAccounts) {
      let user = await prisma.user.findUnique({ where: { email: a.email } });
      const passwordHash = await hash(a.password);
      if (!user) {
        user = await prisma.user.create({
          data: {
            tenantId: a.tenantId,
            email: a.email,
            passwordHash,
            isVerified: true,
            roleId: a.roleId,
            profile: {
              create: {
                fullName: a.fullName,
                phone: a.phone,
                dateOfBirth: a.email === 'shrestharama650@gmail.com' ? new Date('1995-06-15') : undefined,
              },
            },
          },
        });
      } else {
        user = await prisma.user.update({
          where: { id: user.id },
          data: {
            tenantId: a.tenantId,
            roleId: a.roleId,
            passwordHash,
            isVerified: true,
          },
        });
      }
      userIdByEmail.set(a.email, user.id);

      if (a.tenantAdmin) {
        const exists = await prisma.tenantAdmin.findFirst({ where: { tenantId: a.tenantId, userId: user.id } });
        if (!exists) {
          await prisma.tenantAdmin.create({
            data: { tenantId: a.tenantId, userId: user.id, email: a.email },
          });
        }
      }
    }

    // Clean baseline Employment Info for Customer (Rama Shrestha)
    const canonicalCustomerId = userIdByEmail.get('shrestharama650@gmail.com')!;
    await prisma.employmentInfo.upsert({
      where: { userId: canonicalCustomerId },
      update: {
        tenantId: acme.id,
        employmentStatus: 'EMPLOYED',
        occupationJobTitle: 'Senior Accountant',
        employerName: 'Shrestha Enterprises',
        monthlyGrossIncome: 85000,
        annualIncome: 1020000,
        employmentStartDate: new Date('2020-01-15'),
        dependentsCount: 1,
        incomeSourceType: 'SALARY',
        incomeStabilityScore: 85,
        employmentTenureMonths: 60,
        employmentStable: true,
      },
      create: {
        tenantId: acme.id,
        userId: canonicalCustomerId,
        employmentStatus: 'EMPLOYED',
        occupationJobTitle: 'Senior Accountant',
        employerName: 'Shrestha Enterprises',
        monthlyGrossIncome: 85000,
        annualIncome: 1020000,
        employmentStartDate: new Date('2020-01-15'),
        dependentsCount: 1,
        incomeSourceType: 'SALARY',
        incomeStabilityScore: 85,
        employmentTenureMonths: 60,
        employmentStable: true,
      },
    }).catch(() => {});

    // ==========================================
    // 6. Demo Accounts & Rich Variations
    // ==========================================
    const demoStaffAccounts = [
      // Apex Capital Staff
      {
        email: 'admin@apexcapital.local',
        password: 'ApexAdmin@123!',
        roleId: adminRole.id,
        tenantId: apex.id,
        fullName: 'Apex Admin',
        phone: '+977-9840001001',
        isSuperUser: false,
        tenantAdmin: true,
      },
      {
        email: 'reviewer@apexcapital.local',
        password: 'ApexReviewer@123!',
        roleId: reviewerRole.id,
        tenantId: apex.id,
        fullName: 'Apex Senior Reviewer',
        phone: '+977-9840001002',
        isSuperUser: false,
        tenantAdmin: false,
      },
      // Zenith Financial Staff
      {
        email: 'admin@zenithfinance.local',
        password: 'ZenithAdmin@123!',
        roleId: adminRole.id,
        tenantId: zenith.id,
        fullName: 'Zenith Admin',
        phone: '+977-9850002001',
        isSuperUser: false,
        tenantAdmin: true,
      },
      {
        email: 'reviewer@zenithfinance.local',
        password: 'ZenithReviewer@123!',
        roleId: reviewerRole.id,
        tenantId: zenith.id,
        fullName: 'Zenith Loan Officer',
        phone: '+977-9850002002',
        isSuperUser: false,
        tenantAdmin: false,
      },
      // Global Trust Co-op Staff
      {
        email: 'admin@globaltrust.local',
        password: 'GlobalAdmin@123!',
        roleId: adminRole.id,
        tenantId: globaltrust.id,
        fullName: 'Global Trust Admin',
        phone: '+977-9860003001',
        isSuperUser: false,
        tenantAdmin: true,
      },
      {
        email: 'reviewer@globaltrust.local',
        password: 'GlobalReviewer@123!',
        roleId: reviewerRole.id,
        tenantId: globaltrust.id,
        fullName: 'Global Trust Reviewer',
        phone: '+977-9860003002',
        isSuperUser: false,
        tenantAdmin: false,
      },
    ];

    for (const s of demoStaffAccounts) {
      let user = await prisma.user.findUnique({ where: { email: s.email } });
      const passwordHash = await hash(s.password);
      if (!user) {
        user = await prisma.user.create({
          data: {
            tenantId: s.tenantId,
            email: s.email,
            passwordHash,
            isVerified: true,
            roleId: s.roleId,
            profile: {
              create: {
                fullName: s.fullName,
                phone: s.phone,
              },
            },
          },
        });
      } else {
        user = await prisma.user.update({
          where: { id: user.id },
          data: {
            tenantId: s.tenantId,
            roleId: s.roleId,
            passwordHash,
            isVerified: true,
          },
        });
      }
      userIdByEmail.set(s.email, user.id);

      if (s.tenantAdmin) {
        const exists = await prisma.tenantAdmin.findFirst({ where: { tenantId: s.tenantId, userId: user.id } });
        if (!exists) {
          await prisma.tenantAdmin.create({
            data: { tenantId: s.tenantId, userId: user.id, email: s.email },
          });
        }
      }
    }

    const apexReviewerId = userIdByEmail.get('reviewer@apexcapital.local')!;
    const zenithReviewerId = userIdByEmail.get('reviewer@zenithfinance.local')!;
    const globalReviewerId = userIdByEmail.get('reviewer@globaltrust.local')!;

    // Demo Customers with Rich Variations
    const demoCustomers = [
      // APEX CUSTOMER 1: Approved KYC, Verified Portfolio, Approved Business Loan (Low Risk)
      {
        email: 'kiran.shrestha@apex.demo',
        fullName: 'Kiran Shrestha',
        phone: '+977-9841112233',
        address: 'Baneshwor, Kathmandu',
        dob: new Date('1990-04-12'),
        tenantId: apex.id,
        employment: {
          employmentStatus: 'EMPLOYED',
          occupationJobTitle: 'Senior Software Engineer',
          employerName: 'Leapfrog Technology Nepal',
          monthlyGrossIncome: 145000,
          annualIncome: 1740000,
          employmentStartDate: new Date('2020-03-01'),
          dependentsCount: 1,
          incomeSourceType: 'SALARY',
          incomeStabilityScore: 92,
          employmentTenureMonths: 48,
          employmentStable: true,
        },
        kyc: {
          status: 'APPROVED',
          processingStatus: 'DONE',
          workflowStage: 'COMPLETE',
          faceVerificationStatus: 'VERIFIED',
          ocrProcessingStatus: 'EXTRACTED',
          ocrCitizenshipNumber: '27-01-72-04921',
          ocrFullName: 'Kiran Shrestha',
          confirmedCitizenshipNumber: '27-01-72-04921',
          confirmedFullName: 'Kiran Shrestha',
          faceSimilarity: 0.96,
        },
        portfolio: {
          verificationStatus: 'VERIFIED',
          allDocumentsVerified: true,
          canProceedToLoan: true,
          loanToIncomeRatio: 37.35,
          emiToIncomeRatio: 14.82,
          overallRiskScore: 18,
          riskLevel: 'LOW',
          employmentStabilityScore: 92,
        },
        loan: {
          requestedAmount: 650000,
          tenureMonths: 36,
          purpose: 'BUSINESS' as const,
          calculatedEmi: 21500,
          status: 'APPROVED' as const,
          riskScore: 20,
          riskLevel: 'LOW' as const,
          creditScore: 765,
          defaultProbability: 0.038,
          mlDecision: 'APPROVE',
          loanOfficerNotes: 'Verified continuous software engineering salary, stable cash flows, and low debt obligations. Approved.',
          reviewedBy: apexReviewerId,
          reviewedAt: new Date(Date.now() - 3 * 86400000),
        },
      },
      // APEX CUSTOMER 2: Under-Review KYC, Pending Portfolio, Submitted Home Loan (Medium Risk)
      {
        email: 'aarav.joshi@apex.demo',
        fullName: 'Aarav Joshi',
        phone: '+977-9842223344',
        address: 'Jhamsikhel, Lalitpur',
        dob: new Date('1993-08-20'),
        tenantId: apex.id,
        employment: {
          employmentStatus: 'EMPLOYED',
          occupationJobTitle: 'Marketing Specialist',
          employerName: 'Chaudhary Group',
          monthlyGrossIncome: 65000,
          annualIncome: 780000,
          employmentStartDate: new Date('2022-06-15'),
          dependentsCount: 0,
          incomeSourceType: 'SALARY',
          incomeStabilityScore: 70,
          employmentTenureMonths: 22,
          employmentStable: false,
        },
        kyc: {
          status: 'UNDER_REVIEW',
          processingStatus: 'DONE',
          workflowStage: 'VALIDATING_FACE',
          faceVerificationStatus: 'PENDING',
          ocrProcessingStatus: 'EXTRACTED',
          ocrCitizenshipNumber: '28-02-75-11029',
          ocrFullName: 'Aarav Joshi',
          confirmedCitizenshipNumber: '28-02-75-11029',
          confirmedFullName: 'Aarav Joshi',
          faceSimilarity: 0.88,
        },
        portfolio: {
          verificationStatus: 'PENDING_REVIEW',
          allDocumentsVerified: false,
          canProceedToLoan: true,
          loanToIncomeRatio: 44.87,
          emiToIncomeRatio: 25.84,
          overallRiskScore: 46,
          riskLevel: 'MEDIUM',
          employmentStabilityScore: 70,
        },
        loan: {
          requestedAmount: 350000,
          tenureMonths: 24,
          purpose: 'HOME' as const,
          calculatedEmi: 16800,
          status: 'SUBMITTED' as const,
          riskScore: 48,
          riskLevel: 'MEDIUM' as const,
          creditScore: 660,
          defaultProbability: 0.125,
          mlDecision: null,
          loanOfficerNotes: null,
          reviewedBy: null,
          reviewedAt: null,
        },
      },
      // APEX CUSTOMER 3: Approved KYC, Rejected Portfolio & High Risk Personal Loan
      {
        email: 'anita.tamang@apex.demo',
        fullName: 'Anita Tamang',
        phone: '+977-9843334455',
        address: 'Suryabinayak, Bhaktapur',
        dob: new Date('1988-11-05'),
        tenantId: apex.id,
        employment: {
          employmentStatus: 'EMPLOYED',
          occupationJobTitle: 'Retail Sales Associate',
          employerName: 'Bhatbhateni Supermarket',
          monthlyGrossIncome: 32000,
          annualIncome: 384000,
          employmentStartDate: new Date('2023-08-01'),
          dependentsCount: 2,
          incomeSourceType: 'SALARY',
          incomeStabilityScore: 42,
          employmentTenureMonths: 8,
          employmentStable: false,
        },
        kyc: {
          status: 'APPROVED',
          processingStatus: 'DONE',
          workflowStage: 'COMPLETE',
          faceVerificationStatus: 'VERIFIED',
          ocrProcessingStatus: 'EXTRACTED',
          ocrCitizenshipNumber: '30-01-69-00912',
          ocrFullName: 'Anita Tamang',
          confirmedCitizenshipNumber: '30-01-69-00912',
          confirmedFullName: 'Anita Tamang',
          faceSimilarity: 0.94,
        },
        portfolio: {
          verificationStatus: 'REJECTED',
          allDocumentsVerified: false,
          canProceedToLoan: false,
          loanToIncomeRatio: 312.50,
          emiToIncomeRatio: 84.37,
          overallRiskScore: 84,
          riskLevel: 'HIGH',
          employmentStabilityScore: 42,
          adminNotes: 'Requested loan amount disproportionately high relative to monthly salary.',
        },
        loan: {
          requestedAmount: 1200000,
          tenureMonths: 12,
          purpose: 'PERSONAL' as const,
          calculatedEmi: 108000,
          status: 'REJECTED' as const,
          riskScore: 86,
          riskLevel: 'HIGH' as const,
          creditScore: 510,
          defaultProbability: 0.492,
          mlDecision: 'REJECT',
          loanOfficerNotes: 'Debt-to-income ratio exceeds 80%. Requested monthly EMI (NPR 108,000) exceeds total gross monthly income (NPR 32,000). Rejected.',
          reviewedBy: apexReviewerId,
          reviewedAt: new Date(Date.now() - 5 * 86400000),
        },
      },
      // ZENITH CUSTOMER 4: Approved Education Loan
      {
        email: 'roshan.gurung@zenith.demo',
        fullName: 'Roshan Gurung',
        phone: '+977-9851118899',
        address: 'Lakeside, Pokhara',
        dob: new Date('1992-02-18'),
        tenantId: zenith.id,
        employment: {
          employmentStatus: 'EMPLOYED',
          occupationJobTitle: 'Civil Engineer',
          employerName: 'Hydropower Nepal Ltd',
          monthlyGrossIncome: 95000,
          annualIncome: 1140000,
          employmentStartDate: new Date('2021-01-10'),
          dependentsCount: 1,
          incomeSourceType: 'SALARY',
          incomeStabilityScore: 88,
          employmentTenureMonths: 38,
          employmentStable: true,
        },
        kyc: {
          status: 'APPROVED',
          processingStatus: 'DONE',
          workflowStage: 'COMPLETE',
          faceVerificationStatus: 'VERIFIED',
          ocrProcessingStatus: 'EXTRACTED',
          ocrCitizenshipNumber: '42-01-73-05514',
          ocrFullName: 'Roshan Gurung',
          confirmedCitizenshipNumber: '42-01-73-05514',
          confirmedFullName: 'Roshan Gurung',
          faceSimilarity: 0.97,
        },
        portfolio: {
          verificationStatus: 'VERIFIED',
          allDocumentsVerified: true,
          canProceedToLoan: true,
          loanToIncomeRatio: 39.47,
          emiToIncomeRatio: 18.10,
          overallRiskScore: 22,
          riskLevel: 'LOW',
          employmentStabilityScore: 88,
        },
        loan: {
          requestedAmount: 450000,
          tenureMonths: 30,
          purpose: 'EDUCATION' as const,
          calculatedEmi: 17200,
          status: 'APPROVED' as const,
          riskScore: 22,
          riskLevel: 'LOW' as const,
          creditScore: 745,
          defaultProbability: 0.045,
          mlDecision: 'APPROVE',
          loanOfficerNotes: 'Valid educational sponsorship documents and steady engineering salary verified.',
          reviewedBy: zenithReviewerId,
          reviewedAt: new Date(Date.now() - 2 * 86400000),
        },
      },
      // ZENITH CUSTOMER 5: Pending KYC and Submitted Business Loan
      {
        email: 'sunita.adhikari@zenith.demo',
        fullName: 'Sunita Adhikari',
        phone: '+977-9852229900',
        address: 'Main Road, Biratnagar',
        dob: new Date('1996-09-14'),
        tenantId: zenith.id,
        employment: {
          employmentStatus: 'EMPLOYED',
          occupationJobTitle: 'Junior Architect',
          employerName: 'Eastern Design Studio',
          monthlyGrossIncome: 45000,
          annualIncome: 540000,
          employmentStartDate: new Date('2023-01-20'),
          dependentsCount: 0,
          incomeSourceType: 'SALARY',
          incomeStabilityScore: 62,
          employmentTenureMonths: 14,
          employmentStable: false,
        },
        kyc: {
          status: 'PENDING',
          processingStatus: 'PENDING',
          workflowStage: 'VALIDATING_FACE',
          faceVerificationStatus: 'PENDING',
          ocrProcessingStatus: 'PENDING',
          ocrCitizenshipNumber: null,
          ocrFullName: null,
          confirmedCitizenshipNumber: '12-01-78-00129',
          confirmedFullName: 'Sunita Adhikari',
          faceSimilarity: null,
        },
        portfolio: {
          verificationStatus: 'INCOMPLETE',
          allDocumentsVerified: false,
          canProceedToLoan: false,
          loanToIncomeRatio: 37.03,
          emiToIncomeRatio: 27.55,
          overallRiskScore: 50,
          riskLevel: 'MEDIUM',
          employmentStabilityScore: 62,
        },
        loan: {
          requestedAmount: 200000,
          tenureMonths: 18,
          purpose: 'BUSINESS' as const,
          calculatedEmi: 12400,
          status: 'SUBMITTED' as const,
          riskScore: 50,
          riskLevel: 'MEDIUM' as const,
          creditScore: 640,
          defaultProbability: 0.145,
          mlDecision: null,
          loanOfficerNotes: null,
          reviewedBy: null,
          reviewedAt: null,
        },
      },
      // ZENITH CUSTOMER 6: Approved Home Loan
      {
        email: 'prakash.karki@zenith.demo',
        fullName: 'Prakash Karki',
        phone: '+977-9853331122',
        address: 'Traffic Chowk, Butwal',
        dob: new Date('1985-07-30'),
        tenantId: zenith.id,
        employment: {
          employmentStatus: 'EMPLOYED',
          occupationJobTitle: 'Senior Plant Manager',
          employerName: 'Lumbini Beverage Industries',
          monthlyGrossIncome: 120000,
          annualIncome: 1440000,
          employmentStartDate: new Date('2018-04-10'),
          dependentsCount: 2,
          incomeSourceType: 'SALARY',
          incomeStabilityScore: 95,
          employmentTenureMonths: 72,
          employmentStable: true,
        },
        kyc: {
          status: 'APPROVED',
          processingStatus: 'DONE',
          workflowStage: 'COMPLETE',
          faceVerificationStatus: 'VERIFIED',
          ocrProcessingStatus: 'EXTRACTED',
          ocrCitizenshipNumber: '50-02-66-08192',
          ocrFullName: 'Prakash Karki',
          confirmedCitizenshipNumber: '50-02-66-08192',
          confirmedFullName: 'Prakash Karki',
          faceSimilarity: 0.98,
        },
        portfolio: {
          verificationStatus: 'VERIFIED',
          allDocumentsVerified: true,
          canProceedToLoan: true,
          loanToIncomeRatio: 55.55,
          emiToIncomeRatio: 17.33,
          overallRiskScore: 16,
          riskLevel: 'LOW',
          employmentStabilityScore: 95,
        },
        loan: {
          requestedAmount: 800000,
          tenureMonths: 48,
          purpose: 'HOME' as const,
          calculatedEmi: 20800,
          status: 'APPROVED' as const,
          riskScore: 18,
          riskLevel: 'LOW' as const,
          creditScore: 790,
          defaultProbability: 0.028,
          mlDecision: 'APPROVE',
          loanOfficerNotes: 'High tenure with current employer, excellent debt service record.',
          reviewedBy: zenithReviewerId,
          reviewedAt: new Date(Date.now() - 4 * 86400000),
        },
      },
      // GLOBAL TRUST CUSTOMER 7: Approved Business Loan
      {
        email: 'manish.shrestha@globaltrust.demo',
        fullName: 'Manish Shrestha',
        phone: '+977-9861114455',
        address: 'Bharatpur-10, Chitwan',
        dob: new Date('1991-03-25'),
        tenantId: globaltrust.id,
        employment: {
          employmentStatus: 'EMPLOYED',
          occupationJobTitle: 'Agro-Enterprise Manager',
          employerName: 'Chitwan Agro Products Pvt Ltd',
          monthlyGrossIncome: 75000,
          annualIncome: 900000,
          employmentStartDate: new Date('2021-08-01'),
          dependentsCount: 1,
          incomeSourceType: 'SALARY',
          incomeStabilityScore: 82,
          employmentTenureMonths: 32,
          employmentStable: true,
        },
        kyc: {
          status: 'APPROVED',
          processingStatus: 'DONE',
          workflowStage: 'COMPLETE',
          faceVerificationStatus: 'VERIFIED',
          ocrProcessingStatus: 'EXTRACTED',
          ocrCitizenshipNumber: '33-01-71-04192',
          ocrFullName: 'Manish Shrestha',
          confirmedCitizenshipNumber: '33-01-71-04192',
          confirmedFullName: 'Manish Shrestha',
          faceSimilarity: 0.95,
        },
        portfolio: {
          verificationStatus: 'VERIFIED',
          allDocumentsVerified: true,
          canProceedToLoan: true,
          loanToIncomeRatio: 33.33,
          emiToIncomeRatio: 18.93,
          overallRiskScore: 24,
          riskLevel: 'LOW',
          employmentStabilityScore: 82,
        },
        loan: {
          requestedAmount: 300000,
          tenureMonths: 24,
          purpose: 'BUSINESS' as const,
          calculatedEmi: 14200,
          status: 'APPROVED' as const,
          riskScore: 24,
          riskLevel: 'LOW' as const,
          creditScore: 730,
          defaultProbability: 0.052,
          mlDecision: 'APPROVE',
          loanOfficerNotes: 'Verified agricultural business enterprise cash flows.',
          reviewedBy: globalReviewerId,
          reviewedAt: new Date(Date.now() - 1 * 86400000),
        },
      },
      // GLOBAL TRUST CUSTOMER 8: Rejected KYC & Ineligible Loan
      {
        email: 'dikshya.pandey@globaltrust.demo',
        fullName: 'Dikshya Pandey',
        phone: '+977-9862225566',
        address: 'Hetauda-4, Makwanpur',
        dob: new Date('1997-12-10'),
        tenantId: globaltrust.id,
        employment: {
          employmentStatus: 'EMPLOYED',
          occupationJobTitle: 'Freelance Graphic Designer',
          employerName: 'Self Employed',
          monthlyGrossIncome: 30000,
          annualIncome: 360000,
          employmentStartDate: new Date('2023-09-01'),
          dependentsCount: 0,
          incomeSourceType: 'SALARY',
          incomeStabilityScore: 35,
          employmentTenureMonths: 7,
          employmentStable: false,
        },
        kyc: {
          status: 'REJECTED',
          processingStatus: 'DONE',
          workflowStage: 'COMPLETE',
          faceVerificationStatus: 'FAILED',
          ocrProcessingStatus: 'EXTRACTED',
          ocrCitizenshipNumber: '31-01-79-09871',
          ocrFullName: 'Dikshya Pandey',
          confirmedCitizenshipNumber: '31-01-79-09871',
          confirmedFullName: 'Dikshya Pandey',
          faceSimilarity: 0.42,
          rejectionReason: 'Citizenship card image blurred and selfie face similarity below acceptable confidence threshold (42%).',
        },
        portfolio: {
          verificationStatus: 'REJECTED',
          allDocumentsVerified: false,
          canProceedToLoan: false,
          loanToIncomeRatio: 138.88,
          emiToIncomeRatio: 45.00,
          overallRiskScore: 88,
          riskLevel: 'HIGH',
          employmentStabilityScore: 35,
          adminNotes: 'KYC failed verification and unverified freelance income statements.',
        },
        loan: {
          requestedAmount: 500000,
          tenureMonths: 12,
          purpose: 'PERSONAL' as const,
          calculatedEmi: 45000,
          status: 'REJECTED' as const,
          riskScore: 88,
          riskLevel: 'HIGH' as const,
          creditScore: 490,
          defaultProbability: 0.540,
          mlDecision: 'REJECT',
          loanOfficerNotes: 'KYC rejection and insufficient income verification.',
          reviewedBy: globalReviewerId,
          reviewedAt: new Date(Date.now() - 6 * 86400000),
        },
      },
    ];

    for (const c of demoCustomers) {
      let user = await prisma.user.findUnique({ where: { email: c.email } });
      if (!user) {
        user = await prisma.user.create({
          data: {
            tenantId: c.tenantId,
            email: c.email,
            passwordHash: defaultPasswordHash,
            isVerified: true,
            roleId: userRole.id,
            profile: {
              create: {
                fullName: c.fullName,
                phone: c.phone,
                address: c.address,
                dateOfBirth: c.dob,
              },
            },
          },
        });
      } else {
        user = await prisma.user.update({
          where: { id: user.id },
          data: {
            tenantId: c.tenantId,
            roleId: userRole.id,
            passwordHash: defaultPasswordHash,
            isVerified: true,
          },
        });
      }
      userIdByEmail.set(c.email, user.id);

      // Employment Info
      await prisma.employmentInfo.upsert({
        where: { userId: user.id },
        update: {
          tenantId: c.tenantId,
          ...c.employment,
        },
        create: {
          tenantId: c.tenantId,
          userId: user.id,
          ...c.employment,
        },
      });

      // KYC Application
      const kycApp = await prisma.kycApplication.upsert({
        where: { id: `kyc-${c.email.replace(/[@.]/g, '-')}` },
        update: {
          tenantId: c.tenantId,
          userId: user.id,
          status: c.kyc.status,
          processingStatus: c.kyc.processingStatus,
          workflowStage: c.kyc.workflowStage,
          faceVerificationStatus: c.kyc.faceVerificationStatus,
          ocrProcessingStatus: c.kyc.ocrProcessingStatus,
          ocrCitizenshipNumber: c.kyc.ocrCitizenshipNumber,
          ocrFullName: c.kyc.ocrFullName,
          confirmedCitizenshipNumber: c.kyc.confirmedCitizenshipNumber,
          confirmedFullName: c.kyc.confirmedFullName,
          rejectionReason: (c.kyc as any).rejectionReason || null,
        },
        create: {
          id: `kyc-${c.email.replace(/[@.]/g, '-')}`,
          tenantId: c.tenantId,
          userId: user.id,
          status: c.kyc.status,
          processingStatus: c.kyc.processingStatus,
          workflowStage: c.kyc.workflowStage,
          faceVerificationStatus: c.kyc.faceVerificationStatus,
          ocrProcessingStatus: c.kyc.ocrProcessingStatus,
          ocrCitizenshipNumber: c.kyc.ocrCitizenshipNumber,
          ocrFullName: c.kyc.ocrFullName,
          confirmedCitizenshipNumber: c.kyc.confirmedCitizenshipNumber,
          confirmedFullName: c.kyc.confirmedFullName,
          rejectionReason: (c.kyc as any).rejectionReason || null,
        },
      });

      if (c.kyc.faceSimilarity !== null && c.kyc.faceSimilarity !== undefined) {
        await prisma.faceVerification.upsert({
          where: { kycApplicationId: kycApp.id },
          update: {
            similarityScore: c.kyc.faceSimilarity,
            status: c.kyc.faceSimilarity > 0.8 ? 'MATCH' : 'MISMATCH',
            recommendation: c.kyc.faceSimilarity > 0.8 ? 'APPROVE' : 'REJECT',
            citizenshipPhotoPath: '/uploads/demo/citizenship.jpg',
            selfiePhotoPath: '/uploads/demo/selfie.jpg',
          },
          create: {
            kycApplicationId: kycApp.id,
            similarityScore: c.kyc.faceSimilarity,
            status: c.kyc.faceSimilarity > 0.8 ? 'MATCH' : 'MISMATCH',
            recommendation: c.kyc.faceSimilarity > 0.8 ? 'APPROVE' : 'REJECT',
            citizenshipPhotoPath: '/uploads/demo/citizenship.jpg',
            selfiePhotoPath: '/uploads/demo/selfie.jpg',
          },
        }).catch(() => {});
      }

      // Portfolio Verification
      await prisma.portfolioVerification.upsert({
        where: { userId: user.id },
        update: {
          tenantId: c.tenantId,
          verificationStatus: c.portfolio.verificationStatus,
          allDocumentsVerified: c.portfolio.allDocumentsVerified,
          canProceedToLoan: c.portfolio.canProceedToLoan,
          loanToIncomeRatio: c.portfolio.loanToIncomeRatio,
          emiToIncomeRatio: c.portfolio.emiToIncomeRatio,
          overallRiskScore: c.portfolio.overallRiskScore,
          riskLevel: c.portfolio.riskLevel,
          employmentStabilityScore: c.portfolio.employmentStabilityScore,
          adminNotes: (c.portfolio as any).adminNotes || null,
        },
        create: {
          tenantId: c.tenantId,
          userId: user.id,
          verificationStatus: c.portfolio.verificationStatus,
          allDocumentsVerified: c.portfolio.allDocumentsVerified,
          canProceedToLoan: c.portfolio.canProceedToLoan,
          loanToIncomeRatio: c.portfolio.loanToIncomeRatio,
          emiToIncomeRatio: c.portfolio.emiToIncomeRatio,
          overallRiskScore: c.portfolio.overallRiskScore,
          riskLevel: c.portfolio.riskLevel,
          employmentStabilityScore: c.portfolio.employmentStabilityScore,
          adminNotes: (c.portfolio as any).adminNotes || null,
        },
      });

      // Loan Application
      await prisma.loanApplication.upsert({
        where: { id: `loan-${c.email.replace(/[@.]/g, '-')}` },
        update: {
          tenantId: c.tenantId,
          userId: user.id,
          requestedAmount: c.loan.requestedAmount,
          tenureMonths: c.loan.tenureMonths,
          purpose: c.loan.purpose,
          calculatedEmi: c.loan.calculatedEmi,
          status: c.loan.status,
          riskScore: c.loan.riskScore,
          riskLevel: c.loan.riskLevel,
          creditScore: c.loan.creditScore,
          defaultProbability: c.loan.defaultProbability,
          mlDecision: c.loan.mlDecision,
          loanOfficerNotes: c.loan.loanOfficerNotes,
          reviewedBy: c.loan.reviewedBy,
          reviewedAt: c.loan.reviewedAt,
        },
        create: {
          id: `loan-${c.email.replace(/[@.]/g, '-')}`,
          tenantId: c.tenantId,
          userId: user.id,
          requestedAmount: c.loan.requestedAmount,
          tenureMonths: c.loan.tenureMonths,
          purpose: c.loan.purpose,
          calculatedEmi: c.loan.calculatedEmi,
          status: c.loan.status,
          riskScore: c.loan.riskScore,
          riskLevel: c.loan.riskLevel,
          creditScore: c.loan.creditScore,
          defaultProbability: c.loan.defaultProbability,
          mlDecision: c.loan.mlDecision,
          loanOfficerNotes: c.loan.loanOfficerNotes,
          reviewedBy: c.loan.reviewedBy,
          reviewedAt: c.loan.reviewedAt,
        },
      });
    }

    // ==========================================
    // 7. Demo Company Requests for Superadmin
    // ==========================================
    const companyRequestsSeed = [
      {
        slug: 'summit',
        companyName: 'Summit Microfinance Bank',
        panNumber: 'SUMMIT90001Z',
        companyType: 'microfinance',
        domain: 'summit.finguard.local',
        address: 'Pokhara-8, Kaski, Gandaki',
        requestedBy: 'summit.founder@summit.demo',
        status: 'PENDING',
      },
      {
        slug: 'lumbini',
        companyName: 'Lumbini Rural Co-operative',
        panNumber: 'LUMBINI80002Y',
        companyType: 'credit-union',
        domain: 'lumbini.finguard.local',
        address: 'Butwal-4, Rupandehi, Lumbini',
        requestedBy: 'lumbini.lead@lumbini.demo',
        status: 'PENDING',
      },
      {
        slug: 'apex-onboarding',
        companyName: 'Apex Capital Microbank',
        panNumber: 'APEX990001D-REQ',
        companyType: 'microfinance',
        domain: 'apex.finguard.local',
        address: 'Baneshwor, Kathmandu',
        requestedBy: 'admin@apexcapital.local',
        status: 'APPROVED',
        reviewedBy: SUPERADMIN_EMAIL,
        reviewedAt: new Date(Date.now() - 7 * 86400000),
      },
    ];

    for (const cr of companyRequestsSeed) {
      await prisma.companyRequest.upsert({
        where: { slug: cr.slug },
        update: {
          companyName: cr.companyName,
          panNumber: cr.panNumber,
          companyType: cr.companyType,
          domain: cr.domain,
          address: cr.address,
          requestedBy: cr.requestedBy,
          status: cr.status,
          reviewedBy: (cr as any).reviewedBy || null,
          reviewedAt: (cr as any).reviewedAt || null,
        },
        create: {
          slug: cr.slug,
          companyName: cr.companyName,
          panNumber: cr.panNumber,
          companyType: cr.companyType,
          domain: cr.domain,
          address: cr.address,
          requestedBy: cr.requestedBy,
          status: cr.status,
          reviewedBy: (cr as any).reviewedBy || null,
          reviewedAt: (cr as any).reviewedAt || null,
        },
      });
    }

    // ==========================================
    // 8. Feature Toggles & Usage Metrics
    // ==========================================
    for (const t of tenantsSeed) {
      const tenant = tenantMap.get(t.slug)!;
      for (const fn of ['feature_ml_scoring', 'feature_audit_logs', 'feature_api_access']) {
        try {
          await (prisma as any).featureToggle.upsert({
            where: { tenantId_featureName: { tenantId: tenant.id, featureName: fn } },
            update: { isEnabled: true },
            create: {
              tenantId: tenant.id,
              featureName: fn,
              isEnabled: true,
              enabledBy: scRecord?.id ?? null,
              enabledAt: new Date(),
            },
          } as never);
        } catch { /* ignore if table not mapped */ }
      }

      const userCount = await prisma.user.count({ where: { tenantId: tenant.id } });
      const loanCount = await prisma.loanApplication.count({ where: { tenantId: tenant.id } });
      await prisma.tenant.update({
        where: { id: tenant.id },
        data: { usageUsers: userCount, usageLoans: loanCount, lastActivity: new Date() },
      });
    }

    logger.info('Clean comprehensive seed completed successfully — canonical baseline preserved and demo companies populated!');
  } catch (error) {
    logger.error({ err: error }, 'Seeding failed');
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
