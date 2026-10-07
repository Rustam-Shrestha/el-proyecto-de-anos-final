# Change Ledger

## Scope

This document records the current project state after the recent backend and frontend cleanup pass. It covers the source edits, config changes, newly added files, and the reasoning behind each change.

## File Ledger

### Backend Node - updated

- [backend-node/.env.example](backend-node/.env.example): expanded environment sample for the current backend/runtime setup.
- [backend-node/eslint.config.js](backend-node/eslint.config.js): updated lint rules and runtime globals for Node source files.
- [backend-node/package.json](backend-node/package.json): workspace dependency refresh and script alignment.
- [backend-node/src/app.ts](backend-node/src/app.ts): small Express typing cleanup for CORS callback parameters.
- [backend-node/src/config/env.ts](backend-node/src/config/env.ts): environment schema cleanup.
- [backend-node/src/config/logger.ts](backend-node/src/config/logger.ts): logger runtime cleanup.
- [backend-node/src/controllers/authController.ts](backend-node/src/controllers/authController.ts): removed unused imports and kept auth flow intact.
- [backend-node/src/controllers/healthController.ts](backend-node/src/controllers/healthController.ts): controller cleanup.
- [backend-node/src/controllers/userController.ts](backend-node/src/controllers/userController.ts): removed unused pagination/logger imports.
- [backend-node/src/db/init.ts](backend-node/src/db/init.ts): database bootstrap cleanup.
- [backend-node/src/db/pool.ts](backend-node/src/db/pool.ts): pool config cleanup.
- [backend-node/src/docs/openapi.ts](backend-node/src/docs/openapi.ts): removed unused logger import.
- [backend-node/src/middleware/auth.ts](backend-node/src/middleware/auth.ts): auth middleware cleanup.
- [backend-node/src/middleware/errorHandler.ts](backend-node/src/middleware/errorHandler.ts): unused parameter handling.
- [backend-node/src/middleware/notFound.ts](backend-node/src/middleware/notFound.ts): route fallback cleanup.
- [backend-node/src/middleware/oauth2.ts](backend-node/src/middleware/oauth2.ts): oauth bootstrap cleanup.
- [backend-node/src/middleware/rbac.ts](backend-node/src/middleware/rbac.ts): role-check cleanup.
- [backend-node/src/middleware/requestValidation.ts](backend-node/src/middleware/requestValidation.ts): validation middleware typing fix.
- [backend-node/src/models/userModel.ts](backend-node/src/models/userModel.ts): model cleanup.
- [backend-node/src/routes/authRoutes.ts](backend-node/src/routes/authRoutes.ts): route cleanup.
- [backend-node/src/routes/healthRoutes.ts](backend-node/src/routes/healthRoutes.ts): route cleanup.
- [backend-node/src/routes/index.ts](backend-node/src/routes/index.ts): route aggregation cleanup.
- [backend-node/src/routes/kycRoutes.ts](backend-node/src/routes/kycRoutes.ts): route cleanup.
- [backend-node/src/routes/schemas.ts](backend-node/src/routes/schemas.ts): schema cleanup.
- [backend-node/src/routes/userRoutes.ts](backend-node/src/routes/userRoutes.ts): route cleanup.
- [backend-node/src/seed.ts](backend-node/src/seed.ts): seed script lint/runtime cleanup.
- [backend-node/src/server.ts](backend-node/src/server.ts): startup cleanup.
- [backend-node/src/services/auditService.ts](backend-node/src/services/auditService.ts): service cleanup.
- [backend-node/src/services/authService.ts](backend-node/src/services/authService.ts): removed an unused refresh-token hash assignment.
- [backend-node/src/services/tokenService.ts](backend-node/src/services/tokenService.ts): token service cleanup.
- [backend-node/src/services/userService.ts](backend-node/src/services/userService.ts): service cleanup.
- [backend-node/src/types/express.d.ts](backend-node/src/types/express.d.ts): widened request locals typing for validation payloads.
- [backend-node/src/utils/apiResponse.ts](backend-node/src/utils/apiResponse.ts): utility cleanup.
- [backend-node/src/utils/pagination.ts](backend-node/src/utils/pagination.ts): utility cleanup.
- [backend-node/tests/auth.test.ts](backend-node/tests/auth.test.ts): test support cleanup.
- [backend-node/tests/setup-env.ts](backend-node/tests/setup-env.ts): test env cleanup.
- [backend-node/tests/users.test.ts](backend-node/tests/users.test.ts): test cleanup.
- [backend-node/tsconfig.json](backend-node/tsconfig.json): TypeScript 6 deprecation setting updated.

### Backend Node - added

- [backend-node/postman/](backend-node/postman/): API collection and environment files.
- [backend-node/prisma.config.ts](backend-node/prisma.config.ts): Prisma CLI config.
- [backend-node/prisma/](backend-node/prisma/): Prisma schema and migration support.
- [backend-node/settings.json](backend-node/settings.json): backend settings file.
- [backend-node/setup.bat](backend-node/setup.bat): Windows bootstrap script.
- [backend-node/src/config/database.ts](backend-node/src/config/database.ts): Prisma adapter setup.
- [backend-node/src/controllers/adminController.ts](backend-node/src/controllers/adminController.ts): admin controller implementation.
- [backend-node/src/controllers/documentController.ts](backend-node/src/controllers/documentController.ts): document controller implementation.
- [backend-node/src/controllers/kycController.ts](backend-node/src/controllers/kycController.ts): KYC controller implementation.
- [backend-node/src/middleware/upload.ts](backend-node/src/middleware/upload.ts): file upload middleware.
- [backend-node/src/routes/adminRoutes.ts](backend-node/src/routes/adminRoutes.ts): admin routes.
- [backend-node/src/routes/authSchemas.ts](backend-node/src/routes/authSchemas.ts): auth schemas.
- [backend-node/src/routes/documentRoutes.ts](backend-node/src/routes/documentRoutes.ts): document routes.
- [backend-node/src/routes/documentSchemas.ts](backend-node/src/routes/documentSchemas.ts): document schemas.
- [backend-node/src/routes/kycSchemas.ts](backend-node/src/routes/kycSchemas.ts): KYC schemas.
- [backend-node/src/services/documentService.ts](backend-node/src/services/documentService.ts): document service implementation.
- [backend-node/src/services/kycService.ts](backend-node/src/services/kycService.ts): KYC service implementation.
- [backend-node/src/services/mailService.ts](backend-node/src/services/mailService.ts): nodemailer mail service.
- [backend-node/src/types/alias-declarations.d.ts](backend-node/src/types/alias-declarations.d.ts): alias declarations.
- [backend-node/src/types/custom.d.ts](backend-node/src/types/custom.d.ts): custom type declarations.
- [backend-node/src/utils/AppError.ts](backend-node/src/utils/AppError.ts): application error helper.

### Frontend - updated

- [frontend/eslint.config.js](frontend/eslint.config.js): browser/Node globals and unused-var policy for frontend linting.
- [frontend/package.json](frontend/package.json): React 18 alignment and type package alignment.
- [frontend/src/assets/data/icons.tsx](frontend/src/assets/data/icons.tsx): removed an unused icon prop.
- [frontend/src/auth/index.tsx](frontend/src/auth/index.tsx): unused catch parameter cleanup.
- [frontend/src/components/common/CustomRadioField/index.tsx](frontend/src/components/common/CustomRadioField/index.tsx): unused index cleanup.
- [frontend/src/components/common/Modal.tsx](frontend/src/components/common/Modal.tsx): removed an unused size mapping.
- [frontend/src/components/common/QuestionField/index.tsx](frontend/src/components/common/QuestionField/index.tsx): unused loop variable cleanup.
- [frontend/src/components/common/SelectField/index.tsx](frontend/src/components/common/SelectField/index.tsx): unused handler parameter and key cleanup.
- [frontend/src/features/kyc/api/kycApi.ts](frontend/src/features/kyc/api/kycApi.ts): removed a stale eslint disable directive.
- [frontend/src/features/kyc/components/KYCForm.tsx](frontend/src/features/kyc/components/KYCForm.tsx): KYC form typing cleanup and type import restore.
- [frontend/src/features/kyc/hooks/useKYC.ts](frontend/src/features/kyc/hooks/useKYC.ts): removed unused KYCStatus import.
- [frontend/src/features/kyc/index.ts](frontend/src/features/kyc/index.ts): fixed invalid module docstring syntax.
- [frontend/src/helper/index.tsx](frontend/src/helper/index.tsx): unused error parameter cleanup.
- [frontend/src/services/apiService.ts](frontend/src/services/apiService.ts): unused error parameter cleanup.
- [frontend/src/services/periodicService.ts](frontend/src/services/periodicService.ts): unused partial-update flag cleanup.
- [frontend/src/services/timesheetService.ts](frontend/src/services/timesheetService.ts): removed an unused workflow constant.
- [frontend/src/shared/components/converted/LegacyInputField.tsx](frontend/src/shared/components/converted/LegacyInputField.tsx): typed ReactNode import and renamed callback params.
- [frontend/src/shared/components/converted/LegacyTableView.tsx](frontend/src/shared/components/converted/LegacyTableView.tsx): renamed render callback params.
- [frontend/src/store/slices/authSlice.ts](frontend/src/store/slices/authSlice.ts): safer localStorage parsing.
- [frontend/vite.config.ts](frontend/vite.config.ts): added React dedupe.

### Frontend - added

- [frontend/vite.config.js](frontend/vite.config.js): ESM-compatible Vite config for legacy tooling.

### Other added files

- [backend-fastapi/.dockerignore](backend-fastapi/.dockerignore): Docker ignore rules.
- [docker-helper.ps1](docker-helper.ps1): Windows Docker helper.
- [docker-helper.sh](docker-helper.sh): shell Docker helper.
- [starter.bat](starter.bat): Windows startup script.
- [docs/backend-node/admin/](docs/backend-node/admin/): backend admin docs.
- [docs/backend-node/audit/](docs/backend-node/audit/): backend audit docs.
- [docs/backend-node/auth/](docs/backend-node/auth/): backend auth docs.
- [docs/backend-node/document/](docs/backend-node/document/): backend document docs.
- [docs/backend-node/kyc/KYC_IMPLEMENTATION.md](docs/backend-node/kyc/KYC_IMPLEMENTATION.md): KYC implementation notes.
- [docs/backend-node/kyc/KYC_SETUP.md](docs/backend-node/kyc/KYC_SETUP.md): KYC setup notes.
- [docs/backend-node/middleware/](docs/backend-node/middleware/): middleware docs.

## Exact Snippets Changed

### 1) Validation request payload typing

Why: `req.validated` and `res.locals.validated` needed a type that matched the middleware assignment.

What: widened the request/local property contract so validation middleware can store parsed payloads.

Before:

```ts
validated?: ValidatedRequestPayload;
```

After:

```ts
validated?: unknown;
```

### 2) Seed script cleanup

Why: unused variables and an unimported Node global were blocking lint.

What: kept the seed behavior the same while removing dead assignments and importing `process`.

Before:

```ts
const userRole = await prisma.role.upsert({
  where: { name: 'USER' },
  update: {},
  create: { name: 'USER' },
});

const reviewerRole = await prisma.role.upsert({
  where: { name: 'REVIEWER' },
  update: {},
  create: { name: 'REVIEWER' },
});

const admin = await prisma.user.create({
  data: {
    email: adminEmail,
    passwordHash,
    isVerified: true,
    roleId: adminRole.id,
  },
});
```

After:

```ts
await prisma.role.upsert({
  where: { name: 'USER' },
  update: {},
  create: { name: 'USER' },
});

await prisma.role.upsert({
  where: { name: 'REVIEWER' },
  update: {},
  create: { name: 'REVIEWER' },
});

await prisma.user.create({
  data: {
    email: adminEmail,
    passwordHash,
    isVerified: true,
    roleId: adminRole.id,
  },
});
```

### 3) Mail service

Why: the backend needed a single nodemailer-based service for verification, reset, and KYC mail flows.

What: centralized safe-send logic, HTML bodies, plain-text fallback, and warning-only failure handling.

Before:

```ts
export const mailService = {
  async sendVerificationMail(email: string, token: string): Promise<void> {
    try {
      await transporter.sendMail({
        from: 'noreply@finguard.local',
        to: email,
        subject: 'Verify Your FinGuard Email',
        html: htmlContent,
        text: `Verify your email: ${verificationUrl}\nThis link expires in 24 hours.`,
      });

      logger.info({ email }, 'Verification email sent');
    } catch (error) {
      logger.warn({ err: error, email }, 'Failed to send verification email');
    }
  },
};
```

After:

```ts
async function safeSendMail(
  to: string,
  subject: string,
  html: string,
  text: string,
  failureMessage: string
): Promise<void> {
  try {
    await transporter.sendMail({
      from: defaultFrom,
      to,
      subject,
      html,
      text,
    });

    logger.info({ email: to, subject }, 'Email sent');
  } catch (error) {
    logger.warn({ err: error, email: to, subject }, failureMessage);
  }
}
```

### 4) Frontend lint config

Why: the frontend was linting browser and Node globals as undefined and scanning build artifacts.

What: added globals, ignored `dist/` and declaration files, and normalized unused variable handling.

Before:

```js
export default [
  js.configs.recommended,
  {
    files: ["src/**/*.{ts,tsx}"],
    languageOptions: {
      parser: tsparser,
      parserOptions: {
        ecmaVersion: "latest",
        sourceType: "module"
      }
    },
    plugins: {
      "@typescript-eslint": tseslint
    },
    rules: {
      "@typescript-eslint/no-explicit-any": "warn"
    }
  }
];
```

After:

```js
export default [
  js.configs.recommended,
  {
    ignores: ["dist/**", "**/*.d.ts"]
  },
  {
    files: ["src/**/*.{ts,tsx}"],
    languageOptions: {
      parser: tsparser,
      globals: {
        clearInterval: "readonly",
        clearTimeout: "readonly",
        console: "readonly",
        document: "readonly",
        File: "readonly",
        FileReader: "readonly",
        HTMLFormElement: "readonly",
        HTMLInputElement: "readonly",
        localStorage: "readonly",
        navigator: "readonly",
        setInterval: "readonly",
        setTimeout: "readonly",
        URLSearchParams: "readonly",
        window: "readonly"
      },
      parserOptions: {
        ecmaVersion: "latest",
        sourceType: "module"
      }
    },
    plugins: {
      "@typescript-eslint": tseslint
    },
    rules: {
      "no-unused-vars": "off",
      "@typescript-eslint/no-unused-vars": [
        "error",
        {
          argsIgnorePattern: "^_",
          caughtErrorsIgnorePattern: "^_",
          varsIgnorePattern: "^_"
        }
      ],
      "@typescript-eslint/no-explicit-any": "warn"
    }
  }
];
```

### 5) Vite config

Why: `__dirname` was used in an ESM config.

What: derived `__dirname` from `import.meta.url` so the config works consistently.

Before:

```js
import path from "node:path";

export default defineConfig({
  resolve: {
    alias: {
      "@app": path.resolve(__dirname, "src/app"),
      ...
    }
  }
});
```

After:

```js
import { fileURLToPath } from "node:url";
import path from "node:path";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
```

### 6) Frontend KYC form typing

Why: the form used stale globals and an unused imported type.

What: restored the live `KYCStatus` type import and removed the redundant DOM annotation.

Before:

```ts
/* global HTMLInputElement, HTMLTextAreaElement */
import type { KYCStatus } from "../api/kycApi";

interface KYCFormProps {
  userId: string;
  onKYCComplete?: (kycApplicationId: string) => void;
}
```

After:

```ts
import type { KYCStatus } from "../api/kycApi";

interface KYCFormProps {
  userId: string;
  onKYCComplete?: (_kycApplicationId: string) => void;
}
```

## Narrative

The project moved from a partially aligned workspace into a consistent backend/frontend baseline. On the backend, validation middleware was made type-safe, Prisma and seed support were stabilized, the mail workflow was centralized, and lint/build friction was reduced so source checks can run without being drowned by generated output. On the frontend, the main work was eliminating false-positive lint failures from environment globals and legacy code patterns, then normalizing a handful of stale imports, unused variables, and ESM config issues.

The practical effect is that the repo is easier to reason about for the next change: backend source lint now passes cleanly, frontend source lint is reduced to one warning, and the generated mail, validation, and config paths are explicit enough for an intern to follow end to end.

## Intern Guide

1. Start in the feature service layer, not the controllers. Backend request flow is controller → service → database or external service.
2. Treat `backend-node/src/middleware/requestValidation.ts` as the entry point for request-shape validation and `backend-node/src/types/express.d.ts` as the place where request augmentation is declared.
3. Use `backend-node/src/services/mailService.ts` as the pattern for fire-and-forget side effects: send the email, log warnings on failure, never throw unless the caller must block.
4. For Prisma work, keep the schema, migration files, and generated client aligned; `schema.prisma` is the source of truth, but the database must actually contain the mapped table.
5. On the frontend, recognize that browser globals (`window`, `document`, `localStorage`) are legitimate in client code but must be declared to ESLint when the config does not load browser env defaults.
6. Prefer removing dead locals and stale imports over suppressing lint. Most of the cleanup here was mechanical and kept behavior unchanged.
7. For ESM configs like Vite, derive `__dirname` from `import.meta.url`; do not rely on CommonJS globals.

## Outcome

- Backend source lint passes with 0 errors.
- Frontend source lint passes with 0 errors and 1 warning.
- The validation and mail workflows are explicit and easier to extend.
- The repo now has a single reference file for the current state of the changes.