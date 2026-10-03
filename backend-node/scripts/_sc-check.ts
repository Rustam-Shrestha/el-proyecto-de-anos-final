import { prisma } from "../src/config/database";

async function main() {
  const t: any = await prisma.$queryRawUnsafe(
    "select table_name from information_schema.tables where table_schema='public' order by table_name",
  );
  console.log("table count:", t.length);
  console.log(t.map((x: any) => x.table_name).join(", "));

  const m: any = await prisma.$queryRawUnsafe(
    "select count(*)::int c from information_schema.tables where table_schema='public' and table_name='_prisma_migrations'",
  );
  console.log("_prisma_migrations present:", m[0].c > 0);

  for (const tbl of ["users", "tenants", "kyc_applications", "loan_applications", "documents", "notifications"]) {
    try {
      const r: any = await prisma.$queryRawUnsafe(`select count(*)::int c from "${tbl}"`);
      console.log(`${tbl}: ${r[0].c}`);
    } catch (e: any) {
      console.log(`${tbl}: ERR ${e.message.slice(0, 80)}`);
    }
  }
  const k: any = await prisma.$queryRawUnsafe(
    "select id, status, \"tenantId\" from kyc_applications order by \"createdAt\" desc limit 3",
  );
  console.log("recent kyc:", JSON.stringify(k));
  await prisma.$disconnect();
}

main();
