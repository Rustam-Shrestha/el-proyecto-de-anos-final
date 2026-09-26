import 'dotenv/config';
import { prisma } from '../src/config/database';

async function main() {
  const counts: Record<string, number> = {
    tenants: await prisma.tenant.count(),
    users: await prisma.user.count(),
    kycApplications: await prisma.kycApplication.count(),
    loanApplications: await prisma.loanApplication.count(),
    loanAssessments: await prisma.loanAssessment.count(),
    loanAccounts: await prisma.loanAccount.count(),
    nluQueries: await prisma.nluQuery.count(),
    chatConversations: await prisma.chatConversation.count(),
    bankStatements: await prisma.bankStatement.count(),
    transactions: await prisma.transaction.count(),
    tenantMetrics: await (prisma as never as { tenantMetrics: { count: () => Promise<number> } }).tenantMetrics.count(),
  };
  console.log('DB_COUNTS ' + JSON.stringify(counts));
  await prisma.$disconnect();
}

main().catch(async (e) => {
  console.error('COUNT_FAIL', (e as Error).message);
  await prisma.$disconnect();
  process.exit(1);
});
