import { prisma } from '@/config/database';
import { logger } from '@/config/logger';
import bcryptjs from 'bcryptjs';
import process from 'node:process';

async function main() {
  try {
    logger.info('Seeding database...');

    const roles = await Promise.all([
      prisma.role.upsert({ where: { name: 'USER' }, update: {}, create: { name: 'USER' } }),
      prisma.role.upsert({ where: { name: 'REVIEWER' }, update: {}, create: { name: 'REVIEWER' } }),
      prisma.role.upsert({ where: { name: 'ADMIN' }, update: {}, create: { name: 'ADMIN' } }),
    ]);

    const [userRole, reviewerRole, adminRole] = roles;
    logger.info('Roles created');

    // Tenant + RBAC definitions (soft tenancy)
    const defaultTenant = await prisma.tenant.upsert({
      where: { slug: 'default' },
      update: {},
      create: { slug: 'default', name: 'Default Tenant', status: 'active' },
    });
    logger.info({ tenantId: defaultTenant.id }, 'Default tenant ensured');

    const roleDefsData = [
      { name: 'Admin', description: 'System admin', hierarchyLevel: 0 },
      { name: 'LoanApprover', description: 'Loan approver', hierarchyLevel: 1 },
      { name: 'Validator', description: 'KYC/Documents validator', hierarchyLevel: 2 },
      { name: 'Customer', description: 'End customer', hierarchyLevel: 3 },
    ];
    for (const rd of roleDefsData) {
      await prisma.roleDefinition.upsert({ where: { id: 0 } as never, update: {}, create: rd }).catch(async () => {
        const existing = await prisma.roleDefinition.findFirst({ where: { name: rd.name } });
        if (!existing) await prisma.roleDefinition.create({ data: rd });
      });
    }
    const permsData = [
      { name: 'loans.read', resource: 'loans', action: 'read' },
      { name: 'loans.write', resource: 'loans', action: 'write' },
      { name: 'loans.approve', resource: 'loans', action: 'approve' },
      { name: 'loans.reject', resource: 'loans', action: 'reject' },
      { name: 'users.read', resource: 'users', action: 'read' },
      { name: 'users.write', resource: 'users', action: 'write' },
      { name: 'admin.access', resource: 'admin', action: 'access' },
    ];
    for (const p of permsData) {
      await prisma.permissionDefinition.upsert({ where: { name: p.name }, update: {}, create: p as never });
    }
    // map permissions to roleDefinitions
    const permMap = await prisma.permissionDefinition.findMany();
    const permByName = new Map(permMap.map((p) => [p.name, p.id]));
    const roleMap = await prisma.roleDefinition.findMany();
    const roleByName = new Map(roleMap.map((r) => [r.name, r.id]));
    const mappings: Record<string, string[]> = {
      Admin: ['admin.access', 'users.read', 'users.write', 'loans.read', 'loans.write', 'loans.approve', 'loans.reject'],
      LoanApprover: ['loans.read', 'loans.approve', 'loans.reject', 'users.read'],
      Validator: ['loans.read', 'users.read'],
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
    logger.info('RoleDefinitions & permissions seeded');

    const hash = (pw: string) => bcryptjs.hash(pw, 12);

    const users = [
      {
        email: 'admin@finguard.local',
        password: await hash('Admin@123456'),
        roleId: adminRole.id,
        profile: { fullName: 'System Admin', phone: '+1-555-0100' },
      },
      {
        email: 'reviewer@finguard.local',
        password: await hash('Reviewer@123456'),
        roleId: reviewerRole.id,
        profile: { fullName: 'KYC Reviewer', phone: '+1-555-0101' },
      },
      {
        email: 'user@finguard.local',
        password: await hash('User@123456'),
        roleId: userRole.id,
        profile: { fullName: 'John Doe', phone: '+1-555-0102', address: '123 Main St, Springfield' },
      },
    ];

    for (const u of users) {
      const existing = await prisma.user.findUnique({ where: { email: u.email } });
      if (!existing) {
        await prisma.user.create({
          data: {
            tenantId: defaultTenant.id,
            email: u.email,
            passwordHash: u.password,
            isVerified: true,
            roleId: u.roleId,
            profile: { create: u.profile },
          },
        });
        logger.info({ email: u.email }, 'User created');
      } else {
        logger.info({ email: u.email }, 'User already exists');
      }
    }

    logger.info('Seeding complete');
  } catch (error) {
    logger.error({ err: error }, 'Seeding failed');
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
