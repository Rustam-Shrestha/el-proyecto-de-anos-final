import { prisma } from "../src/config/database";

const KYC_ID = "cmuim9rxi000j4cv6zd7xmvjs";
const TEST_LOAN_ID = "cmuja4c2v0002j8v6pbi7zfue";

async function main() {
  const kyc = await prisma.kycApplication.update({
    where: { id: KYC_ID },
    data: { status: "PENDING", reviewedAt: null, reviewerId: null, rejectionReason: null },
  });
  console.log("kyc reset ->", kyc.status);

  const docs = await prisma.document.updateMany({
    where: { kycId: KYC_ID },
    data: { verificationStatus: "PENDING", verificationNotes: null, verifiedAt: null, verifiedBy: null },
  });
  console.log("documents reset:", docs.count);

  const loans = await prisma.loanApplication.deleteMany({ where: { id: TEST_LOAN_ID } });
  console.log("test loans deleted:", loans.count);

  const notif = await prisma.notification.deleteMany({
    where: { relatedEntityId: KYC_ID, type: "KYC_APPROVED" },
  });
  console.log("approval notifications deleted:", notif.count);

  const remaining = await prisma.loanApplication.findMany({
    select: { id: true, tenantId: true, requestedAmount: true, status: true },
  });
  console.log("loans now:", JSON.stringify(remaining));

  await prisma.$disconnect();
}

main();
