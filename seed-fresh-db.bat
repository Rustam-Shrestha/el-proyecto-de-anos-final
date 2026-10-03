@echo off
REM ============================================================
REM  FinGuard Fresh-DB Sync & Seed
REM  Wipes/syncs PostgreSQL and repopulates clean canonical data
REM  Assumes: PostgreSQL running, DATABASE_URL in backend-node/.env
REM ============================================================
setlocal
cd /d "%~dp0"

echo ============================================================
echo  [1/3] Syncing PostgreSQL database with Prisma schema...
echo ============================================================
pushd backend-node
call npx prisma db push --schema prisma/schema.prisma || (
    echo [ERROR] prisma db push failed.
    popd
    pause
    exit /b 1
)

echo.
echo ============================================================
echo  [2/3] Generating Prisma Client...
echo ============================================================
call npx prisma generate --schema prisma/schema.prisma || (
    echo [ERROR] prisma generate failed.
    popd
    pause
    exit /b 1
)

echo.
echo ============================================================
echo  [3/3] Running Comprehensive Multi-Tenant Seed...
echo ============================================================
call npm run seed || (
    echo [ERROR] Seed failed.
    popd
    pause
    exit /b 1
)
popd

echo.
echo ============================================================
echo  Fresh DB Repopulation Complete!
echo ============================================================
echo  Canonical Baseline Logins (Clean Baseline):
echo   * Superadmin (Platform): santosh.787402@smc.tu.edu.np / SuperAdmin@123!
echo   * Company Admin (Acme):   shrestharama65@gmail.com     / AcmeAdmin@123!
echo   * Loan Reviewer (Acme):   bcasmc2078@gmail.com         / AcmeReviewer@123!
echo   * Live Customer (Acme):   shrestharama650@gmail.com    / Customer@123!
echo.
echo  Demo Company Logins (Rich Variations & History):
echo   * Apex Capital:    admin@apexcapital.local   / ApexAdmin@123!
echo                      reviewer@apexcapital.local / ApexReviewer@123!
echo   * Zenith Finance:  admin@zenithfinance.local / ZenithAdmin@123!
echo                      reviewer@zenithfinance.local / ZenithReviewer@123!
echo   * Global Trust:    admin@globaltrust.local   / GlobalAdmin@123!
echo                      reviewer@globaltrust.local / GlobalReviewer@123!
echo   * Demo Borrowers:  Password for all demo users is: DemoUser@123!
echo ============================================================
echo  Tip: To inspect the database visually, run:
echo    cd backend-node ^&^& npx prisma studio
echo ============================================================
endlocal
pause
