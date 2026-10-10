# Deploying backend-node to Render

Companion to `.env.render.example`. Read this once, then follow the steps.

## 1. Render service settings

| Setting | Value |
|---|---|
| Root Directory | `backend-node` |
| Runtime | Node 24 |
| Build Command | `npm ci && npm run build` |
| Start Command | `npm start` |
| Health Check Path | `/api/v1/health` |

`npm start` already runs `prisma generate` via `prestart`, so the client is
built after `npm run build` has compiled the TS.

## 2. Environment variables

Copy `.env.render.example` into the Render dashboard (Environment tab) and
replace every `<< REPLACE >>`. Then:

**Must have (boot fails without them — `src/config/env.ts` validates):**
- `NODE_ENV=production`
- `DATABASE_URL` — Render PostgreSQL **Internal Database URL**
- `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET`
- `FRONTEND_URL`, `CORS_ORIGIN`

**Should have:**
- `UPLOAD_DIR=uploads` (see the disk warning below)
- `SMTP_HOST` / `SMTP_PORT` / `SMTP_USER` / `SMTP_PASS` — without these the
  server still boots but prints a warning and no email is delivered.

**Do not set:** `PORT` (Render injects it), `DB_USER` / `DB_HOST` / `DB_PORT` /
`DB_NAME` / `DB_URL` (nothing in the code reads them — only `DATABASE_URL`).

## 3. Database

1. Render Dashboard → New → PostgreSQL.
2. Copy the **Internal Database URL** into `DATABASE_URL`.
3. This project uses Postgres schemas `auth` and `public`, not plain `public`.

Apply the schema once, from a machine that can reach the DB:

```bash
# from backend-node/, with DATABASE_URL pointed at the Render DB
npx prisma migrate deploy      # applies prisma/migrations/*
npx tsx scripts/apply-platform-tables.ts   # supercontroller + feature_toggles
npx tsx src/seed.ts            # optional demo data
```

`scripts/apply-platform-tables.ts` is required — the `supercontroller` and
`feature_toggles` tables are created outside the Prisma migrations, and the
superadmin login will fail without them.

## 4. Uploads are ephemeral — read this

Render's filesystem is wiped on every deploy and restart. Files land in
`uploads/` inside the container, so KYC documents, selfies and avatars
disappear on the next release.

To keep them, attach a Disk:
- Render Dashboard → your service → Disks → Add Disk
- Mount Path: `/opt/render/project/src/uploads`
- Size: 1 GB is enough to start

Then set `UPLOAD_DIR=uploads` (paths resolve against the repo root, so the
mount path above lines up). `src/app.ts` serves `/uploads` from
`<cwd>/uploads`, which is exactly that directory.

## 5. FastAPI / ML service

`FASTAPI_URL` and `ML_SERVICE_URL` only matter if you also deploy
`backend-fastapi` as its own Render service. If you don't:

- Leave them at their defaults (they will just fail to connect).
- Keep `FINANCIAL_OCR_ENABLED` unset/false.
- PDF and Excel bank statements still parse, because `pdf-parse` and `xlsx`
  run inside Node.
- Face verification will return HTTP 503 with a clear message rather than
  a 500 — that is the intended degradation.

## 6. Deploy and verify

```bash
curl https://<your-backend>.onrender.com/api/v1/health
```

Then smoke-test from the deployed frontend:
- login
- upload a bank statement (PDF with a text layer, and .xlsx)
- avatar upload and render
- KYC submit through to the confirmation screen

If avatar images are broken, the static route is fine but something is
setting `Cross-Origin-Resource-Policy: same-origin` in front of the service
(helmet is explicitly configured OFF for this in `src/app.ts`).