@echo off
REM ============================================================
REM  FinGuard Fresh-DB Seed — wipes Postgres and repopulates
REM  from ground up using Prisma + project seeds.
REM  Assumes: Postgres running, DATABASE_URL in backend-node/.env
REM  Steps:
REM    1. Drop + recreate auth/public schemas (fresh DB)
REM    2. prisma migrate deploy (schema-abiding tables)
REM    3. prisma generate (client)
REM    4. npm run seed (tenants, users, KYC, loans, metrics,
REM       FinGuard LoanAssessment + NLU/chat demo rows)
REM    5. FinGuard demo loan cases (seed-finguard)
REM ============================================================
setlocal
cd /d "%~dp0"

echo [1/5] Resetting database schemas (DROP auth, public)...
pushd backend-node
call npx tsx scripts/reset-db.ts || (echo [WARN] reset-db script failed, continuing with migrate...)

echo [1b/5] Ensuring auth schema exists (older migrations need it)...
call npx tsx -e "import 'dotenv/config'; import {pool} from './src/db/pool'; pool.query('CREATE SCHEMA IF NOT EXISTS auth').then(()=>pool.end())" || (echo [ERROR] schema creation failed. & popd & pause & exit /b 1)

echo [2/5] Deploying Prisma migrations...
call npx prisma migrate deploy --schema prisma/schema.prisma || (echo [ERROR] migrate deploy failed. & popd & pause & exit /b 1)

echo [3/5] Generating Prisma client...
call npx prisma generate --schema prisma/schema.prisma || (echo [ERROR] prisma generate failed. & popd & pause & exit /b 1)

echo [4/5] Running main seed (tenants/users/KYC/loans/metrics/FinGuard)...
call npm run seed || (echo [ERROR] main seed failed. & popd & pause & exit /b 1)

echo [5/5] Running FinGuard demo loan cases...
call npx tsx src/seed-finguard.ts || (echo [WARN] finguard seed reported an issue, check log above.)
popd

echo.
echo ============================================================
echo  Fresh DB seed complete. Verify with:
echo    npx prisma studio  (run inside backend-node)
echo  Demo logins (password for all: Password@123):
echo    admin@finguard.local / reviewer@finguard.local / user@finguard.local
echo    customer1@acme.finguard.test  (tenant demo)
echo ============================================================
endlocal
