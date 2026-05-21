import { prisma } from '@/config/database';
import { logger } from '@/config/logger';
import bcryptjs from 'bcryptjs';
import process from 'node:process';

async function main() {
  try {
    logger.info('🌱 Seeding database...');

    // Seed roles
    await prisma.role.upsert({
      where: { name: 'USER' },
      update: {},
      create: { name: 'USER' },
    });

    await prisma.role.upsert({
      where: { name: 'REVIEWER' },
      update: {},
      create: { name: 'REVIEWER' },
    });

    const adminRole = await prisma.role.upsert({
      where: { name: 'ADMIN' },
      update: {},
      create: { name: 'ADMIN' },
    });

    logger.info('✅ Roles created/updated');

    // Seed default admin user
    const adminEmail = 'admin@finguard.local';
    const adminPassword = 'Admin@123456';

    const existingAdmin = await prisma.user.findUnique({
      where: { email: adminEmail },
    });

    if (!existingAdmin) {
      const passwordHash = await bcryptjs.hash(adminPassword, 12);

      await prisma.user.create({
        data: {
          email: adminEmail,
          passwordHash,
          isVerified: true,
          roleId: adminRole.id,
        },
      });

      logger.info({ email: adminEmail }, '✅ Default admin user created');
      logger.warn('⚠️  Change the default admin password immediately in production!');
    } else {
      logger.info({ email: adminEmail }, '✅ Admin user already exists');
    }

    logger.info('✅ Database seeding completed');
  } catch (error) {
    logger.error({ err: error }, '❌ Seeding failed');
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();