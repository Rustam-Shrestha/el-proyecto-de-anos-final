import 'dotenv/config';
import { Pool } from 'pg';

// Drops + recreates the finguard database, then ensures the auth schema
// exists (older hand-written migrations need it before prisma deploy).
async function main() {
  const admin = new Pool({ connectionString: 'postgresql://postgres:admin@localhost:5432/postgres' });
  await admin.query(
    "SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname = 'finguard' AND pid <> pg_backend_pid()",
  );
  await admin.query('DROP DATABASE IF EXISTS finguard');
  await admin.query('CREATE DATABASE finguard');
  await admin.end();
  console.log('RECREATED finguard');

  const db = new Pool({ connectionString: process.env.DATABASE_URL });
  await db.query('CREATE SCHEMA IF NOT EXISTS "auth"');
  await db.end();
  console.log('SCHEMA_OK');
}

main().catch((e) => {
  console.error('RECREATE_FAIL', (e as Error).message);
  process.exit(1);
});
