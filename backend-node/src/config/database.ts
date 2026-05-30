/* eslint-disable @typescript-eslint/no-explicit-any */
import * as PrismaPkg from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { env } from '@/config/env';

const PrismaClient = (PrismaPkg as any).PrismaClient;
const adapter = new PrismaPg({ connectionString: env.DATABASE_URL });

const globalForPrisma = globalThis as unknown as { prisma?: any };

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    adapter,
    log: ['warn', 'error'],
  });

// Use globalThis to access process in a way that avoids editor/tsserver "process is not defined" errors
if ((globalThis as any).process?.env?.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}
