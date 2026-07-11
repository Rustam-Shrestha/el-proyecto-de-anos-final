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

    const hash = (pw: string) => bcryptjs.hash(pw, 12);
    const now = new Date();

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
        const user = await prisma.user.create({
          data: {
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
