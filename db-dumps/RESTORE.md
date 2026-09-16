# FinGuard DB Dumps — Restore Guide

**Generated:** 2026-09-16 | **DB:** `finguard` | **Postgres 18** | `localhost:5432` | `auth` + `public` schemas

## Contents of this folder

| File | Format | Size | What it is |
|------|--------|------|------------|
| `finguard_full.sql` | Plain SQL (`-F p --create --clean`) | ~131 KB | **RECOMMENDED for new device** — creates DB + all schemas + data, idempotent |
| `finguard_custom.dump` | Custom (`-F c`, compressed) | ~129 KB | Postgres-native binary, use with `pg_restore` — fastest, single file |
| `finguard_dir/` | Directory (`-F d` + `toc.dat`) | ~130 KB total | Parallel restore with `pg_restore -j` |
| `finguard_schema_only.sql` | Plain SQL schema-only | ~73 KB | Tables/enums/indexes only, no rows |
| `finguard_data_only.sql` | Plain SQL data-only (`--inserts`) | ~77 KB | Rows only — needs schema already created |
| `schema.prisma` + `prisma.config.ts` + `migrations/` | Prisma |  | Current schema + all 4 migrations (`20250916*_`, `20260722_init`) + `.env.example` |

---

## Prerequisites on NEW device

```bash
# 1. Install deps (Node >=20.11, Postgres >=16, npm)
# 2. Create postgres superuser `postgres` password `admin` OR edit DATABASE_URL

# 3. Copy .env — set DATABASE_URL
cp db-dumps/.env.example backend-node/.env
# edit DATABASE_URL=postgresql://postgres:admin@localhost:5432/finguard

# 4. Install npm deps
npm install
cd backend-node
npx prisma generate
```

## Option A — Restore from `finguard_full.sql` (simplest, plain SQL)

This file already contains `CREATE DATABASE finguard;` + `--clean --if-exists` + both schemas.

```bash
# Windows (PowerShell) — password via env
$env:PGPASSWORD="admin"
psql -U postgres -h localhost -p 5432 -d postgres -f db-dumps/finguard_full.sql

# Linux/Mac
PGPASSWORD=admin psql -U postgres -h localhost -p 5432 -d postgres -f db-dumps/finguard_full.sql

# Verify
PGPASSWORD=admin psql -U postgres -h localhost -p 5432 -d finguard -c "SELECT count(*) FROM auth.users; SELECT count(*) FROM auth.tenants; SELECT count(*) FROM public.tenant_metrics;"
# expect: users=21, tenants=6, tenant_metrics=180
```

> If `finguard` DB already exists on new device, the `--clean` in the dump will drop/recreate. No manual `DROP DATABASE` needed.

## Option B — Restore from Custom format (`finguard_custom.dump`) via `pg_restore`

```bash
# 1. Create empty DB (custom format will create objects, but needs DB to connect to)
$env:PGPASSWORD="admin"
psql -U postgres -h localhost -p 5432 -d postgres -c "DROP DATABASE IF EXISTS finguard; CREATE DATABASE finguard;"

# 2. Restore (clean + create objects)
pg_restore -U postgres -h localhost -p 5432 -d finguard --clean --if-exists --no-owner --no-privileges db-dumps/finguard_custom.dump

# 3. Verify
PGPASSWORD=admin psql -U postgres -h localhost -p 5432 -d finguard -c "SELECT 'users='||count(*) FROM auth.users UNION ALL SELECT 'kyc='||count(*) FROM auth.kyc_applications;"
```

## Option C — Directory format (fastest parallel)

```bash
$env:PGPASSWORD="admin"
psql -U postgres -h localhost -p 5432 -d postgres -c "DROP DATABASE IF EXISTS finguard; CREATE DATABASE finguard;"
pg_restore -U postgres -h localhost -p 5432 -d finguard --clean --if-exists -j 4 db-dumps/finguard_dir
```

## Option D — Prisma-only (no dump, rebuild from schema + seed)

Use if you just want latest schema + fresh seeded data, not the exact rows from this dump:

```bash
# Drops + recreates from schema.prisma (handles out-of-order migrations)
$env:PGPASSWORD="admin"
psql -U postgres -h localhost -p 5432 -d postgres -c "DROP DATABASE IF EXISTS finguard; CREATE DATABASE finguard;"
cd backend-node
npx prisma db push --force-reset
# OR if you want migration history (init is dated 20260722 in future, so db push is more reliable):
# npx prisma migrate deploy  # may fail due to migration order — prefer db push

# Seed
npm run seed
# OR: npx tsx src/seed.ts
```

After Prisma restore, mark migrations as applied (so future `migrate deploy` doesn't re-apply):

```bash
npx prisma migrate resolve --applied "20250916000000_add_tenant_rbac"
npx prisma migrate resolve --applied "20250916000001_supercontroller_hierarchy"
npx prisma migrate resolve --applied "20250916000002_fix_loan_ml_columns"
npx prisma migrate resolve --applied "20260722032719_init"
```

## Which to use?

- **Exact copy of current data on new device** → Option A (`finguard_full.sql`) or B (`finguard_custom.dump`). Both restore identical rows.
- **Fresh start, just schema + seed** → Option D.
- **Schema only** → `finguard_schema_only.sql`: `psql ... -f finguard_schema_only.sql`
- **Data only into existing schema** → `psql ... -f finguard_data_only.sql` (use `--disable-triggers` if FK errors due to circular `documents` FK).

## Notes

- DB uses two schemas: `auth` (app tables) and `public` (supercontroller, feature_toggles, tenant_metrics). All dumps include both.
- Default `DATABASE_URL=postgresql://postgres:admin@localhost:5432/finguard` — change user/pass/host in `backend-node/.env` if different on new device.
- Dump generated with `--clean --if-exists` — safe to re-run without manual drops.
- Original warnings: `--data-only` dump warns about circular FK on `auth.documents` — use full dump or `pg_restore --disable-triggers` to avoid.
