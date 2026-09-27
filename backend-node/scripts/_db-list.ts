import { Client } from "pg";

const url =
  process.env.DATABASE_URL ||
  "postgresql://postgres:admin@localhost:5432/finguard";
console.log("using:", url);

const base = url.replace(/\/[^/?]+(\?|$)/, "/postgres$1");

async function main() {
  const c = new Client({ connectionString: base });
  await c.connect();
  const dbs = await c.query(
    "select datname from pg_database where datistemplate = false order by datname",
  );
  for (const d of dbs.rows) {
    const n = await c.query(
      `select count(*)::int c from information_schema.tables where table_catalog = $1 and table_schema='public'`,
      [d.datname],
    ).catch(() => ({ rows: [{ c: -1 }] }));
    let users = "n/a";
    if (n.rows[0].c > 0) {
      const u = await c
        .query(`select count(*)::int c from "${d.datname}".public.users`)
        .catch(() => ({ rows: [{ c: "n/a" }] }));
      users = String(u.rows[0].c);
    }
    console.log(`  ${d.datname}: tables=${n.rows[0].c} users=${users}`);
  }
  await c.end();
}

main();
