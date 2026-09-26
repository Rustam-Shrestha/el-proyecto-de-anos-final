import { prisma } from '@/config/database';
import { logger } from '@/config/logger';

/**
 * FinGuard demo seed — 3 canonical risk cases (LOW / MEDIUM / HIGH).
 * Attaches to the first user in the default tenant so the
 * RiskAssessmentPanel + loan history have meaningful data.
 * Safe to re-run (idempotent via description marker).
 */
const CASES = [
  {
    marker: 'FINGUARD_DEMO_LOW',
    requestedAmount: 500000, tenureMonths: 24, purpose: 'PERSONAL',
    status: 'APPROVED', riskScore: 720, riskLevel: 'LOW',
    creditScore: 780, defaultProbability: 0.06, modelVersion: 'finguard_v1.3.0',
    features: { AMT_INCOME_TOTAL: 250000, AMT_CREDIT: 500000, DAYS_BIRTH: -14500, DAYS_EMPLOYED: -3000, EXT_SOURCE_2: 0.75 },
  },
  {
    marker: 'FINGUARD_DEMO_MEDIUM',
    requestedAmount: 800000, tenureMonths: 36, purpose: 'BUSINESS',
    status: 'SUBMITTED', riskScore: 520, riskLevel: 'MEDIUM',
    creditScore: 620, defaultProbability: 0.28, modelVersion: 'finguard_v1.3.0',
    features: { AMT_INCOME_TOTAL: 120000, AMT_CREDIT: 800000, DAYS_BIRTH: -11000, DAYS_EMPLOYED: -800, EXT_SOURCE_2: 0.45 },
  },
  {
    marker: 'FINGUARD_DEMO_HIGH',
    requestedAmount: 1500000, tenureMonths: 48, purpose: 'PERSONAL',
    status: 'REJECTED', riskScore: 280, riskLevel: 'HIGH',
    creditScore: 430, defaultProbability: 0.71, modelVersion: 'finguard_v1.3.0',
    features: { AMT_INCOME_TOTAL: 60000, AMT_CREDIT: 1500000, DAYS_BIRTH: -8500, DAYS_EMPLOYED: -100, EXT_SOURCE_2: 0.2 },
  },
];

async function main() {
  const tenant = await prisma.tenant.findFirst({ where: { slug: 'default' } });
  if (!tenant) throw new Error('default tenant missing — run main seed first');
  const user = await prisma.user.findFirst({ where: { tenantId: tenant.id } });
  if (!user) throw new Error('no user in default tenant — run main seed first');

  for (const c of CASES) {
    const existing = await prisma.loanApplication.findFirst({
      where: { userId: user.id, tenantId: tenant.id, purpose: c.purpose, requestedAmount: c.requestedAmount },
    });
    if (existing) {
      logger.info({ marker: c.marker }, 'demo case already exists, skipping');
      continue;
    }
    await prisma.loanApplication.create({
      data: {
        tenantId: tenant.id, userId: user.id,
        requestedAmount: c.requestedAmount, tenureMonths: c.tenureMonths,
        purpose: c.purpose, status: c.status,
        riskScore: c.riskScore, riskLevel: c.riskLevel,
        creditScore: c.creditScore, defaultProbability: c.defaultProbability,
        modelVersion: c.modelVersion,
      } as never,
    });
    logger.info({ marker: c.marker, risk: c.riskLevel }, 'FinGuard demo case seeded');
  }
  logger.info('FinGuard demo seed complete');
  await prisma.$disconnect();
}

main().catch(async (e) => { logger.error({ err: e }, 'finguard seed failed'); await prisma.$disconnect(); process.exit(1); });
