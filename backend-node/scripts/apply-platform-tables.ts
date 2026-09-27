import { readFileSync } from "node:fs";
import path from "node:path";
import { prisma } from "../src/config/database";

async function main() {
  const sqlPath = path.join(
    process.cwd(),
    "prisma",
    "migrations",
    "20260927093000_platform_supercontroller_tables",
    "migration.sql",
  );
  const sql = readFileSync(sqlPath, "utf8");

  const statements = sql
    .split(";")
    .map((s) =>
      s
        .split("\n")
        .filter((line) => !line.trim().startsWith("--"))
        .join("\n")
        .trim(),
    )
    .filter((s) => s.length > 0);

  for (const stmt of statements) {
    const head = stmt.replace(/\s+/g, " ").slice(0, 70);
    try {
      await prisma.$executeRawUnsafe(stmt);
      console.log("OK  ", head);
    } catch (e) {
      console.log("FAIL", head, "->", (e as Error).message.split("\n")[0]);
    }
  }

  const check = await prisma.$queryRawUnsafe(
    `SELECT table_name FROM information_schema.tables
     WHERE table_schema = 'public' AND table_name IN
       ('supercontroller','feature_toggles','supercontroller_audit_logs','tenant_metrics')
     ORDER BY table_name`,
  );
  console.log("present:", JSON.stringify(check));

  await prisma.$disconnect();
}

main();
