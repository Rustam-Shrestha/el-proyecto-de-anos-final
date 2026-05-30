@echo off

REM UNINSTALL OLD/IRRELEVANT DEPENDENCIES
call npm uninstall pg pg-pool knex mongoose sequelize joi express-validator body-parser express-async-errors

REM INSTALL REQUIRED DEPENDENCIES
call npm install --save ^
  express@5.x ^
  typescript@5.x ^
  @types/express@5.x ^
  @types/node@20.x ^
  prisma@latest ^
  @prisma/client@latest ^
  jsonwebtoken@9.x ^
  @types/jsonwebtoken@9.x ^
  bcryptjs@2.x ^
  @types/bcryptjs@2.x ^
  zod@3.x ^
  multer@1.x ^
  @types/multer@1.x ^
  nodemailer@6.x ^
  @types/nodemailer@6.x ^
  express-rate-limit@7.x ^
  winston@3.x ^
  helmet@7.x ^
  cors@2.x ^
  dotenv@16.x

REM INSTALL DEV DEPENDENCIES
call npm install --save-dev ^
  @types/node@20.x ^
  ts-node@10.x ^
  tsx@4.x ^
  eslint@8.x ^
  @typescript-eslint/eslint-plugin@7.x ^
  @typescript-eslint/parser@7.x ^
  prettier@3.x ^
  jest@29.x ^
  @types/jest@29.x ^
  ts-jest@29.x ^
  @types/supertest@2.x ^
  supertest@6.x ^
  nodemon@3.x

echo.
echo ✅ Dependencies cleaned and updated
pause