import { Client } from "pg";

const targets = [
  "postgresql://postgres:admin@127.0.0.1:5432/finguard",
  "postgresql://postgres:admin@[::1]:5432/finguard",
  "postgresql://postgres:admin@localhost:5432/finguard",
];

async function probe(url: string) {
  const c = new Client({ connectionString: url, connectionTimeoutMillis: 5000 });
  try {
    await c.connect();
    const cur = await c.query("select current_database() db, inet_server_addr()::text addr, inet_server_port() port");
    const sc = await c.query("select schema_name from information_schema.schemata order by 1");
    const t = await c.query(
      "select table_schema, table_name from information_schema.tables where table_schema not in ('pg_catalog','information_schema') order by 1,2",
    );
    let users = "n/a";
    if (t.rows.some((r: any) => r.table_name === "users")) {
      const u = await c.query('select count(*)::int c from public."users"').catch(() => ({ rows: [{ c: "err" }] }));
      users = String(u.rows[0].c);
    }
    console.log(`\n${url}`);
    console.log(`  server=${cur.rows[0].db} addr=${cur.rows[0].addr}:${cur.rows[0].port}`);
    console.log(`  schemas=${sc.rows.map((r: any) => r.schema_name).join(",")}`);
    console.log(`  tables=${t.rows.length} users=${users}`);
    console.log(`  ${t.rows.map((r: any) => `${r.table_schema}.${r.table_name}`).join(" ")}`);
  } catch (e: any) {
    console.log(`\n${url}\n  FAILED: ${e.message.slice(0, 90)}`);
  } finally {
    await c.end().catch(() => {});
  }
}

(async () => {
  for (const u of targets) await probe(u);
})();
