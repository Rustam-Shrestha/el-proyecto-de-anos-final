# Backend Patterns — Node.js/Express/Prisma

> Project: `backend-node/` — Express REST API with Prisma ORM + PostgreSQL, TypeScript.
> Secondary microservice: `backend-fastapi/` — Python FastAPI for KYC/OCR/Face Verification (not covered here).

---

## Services

### Prisma Client
- Initialized in `src/config/database.ts` as a global singleton to avoid hot-reload duplication.
- Uses `@prisma/adapter-pg` for connection pooling.
- Imported throughout services as `import { prisma } from '@/config/database'`.

```ts
// src/config/database.ts
const globalForPrisma = globalThis as unknown as { prisma?: any };
export const prisma = globalForPrisma.prisma || new PrismaClient({ adapter, log: ['warn', 'error'] });
if (NODE_ENV !== 'production') globalForPrisma.prisma = prisma;
```

### Error Handling
- Custom `AppError` class (`src/utils/AppError.ts`) with `message`, `statusCode`, and optional `details`.
- Every service function wraps logic in `try/catch`.
- Expected errors (e.g. "not found", "already exists") throw `new AppError(message, statusCode)`.
- Unexpected errors are logged with `logger.error(...)` then re-thrown as generic `AppError('Failed to ...', 500)`.
- **Re-throw pattern**: `if (error instanceof AppError) throw error;` — known errors pass through; unknown ones get wrapped.

```ts
async function getUserById(userId: string): Promise<UserDetail> {
  try {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new AppError('User not found', 404);
    return user;
  } catch (error) {
    if (error instanceof AppError) throw error;
    logger.error({ err: error, userId }, 'Failed to get user');
    throw new AppError('Failed to fetch user', 500);
  }
}
```

### Function Signatures
- Services export object literals (`export const userService = { ... }`) with async methods.
- Input parameters are typed via inline or dedicated interfaces.
- Return types are explicit (often `Promise<T>`).
- Common patterns: paginated queries use `Promise.all([prisma.findMany(...), prisma.count(...)])`.

---

## Controllers

### Style
- Each controller file exports named async handler functions: `export const handlerName = async (req, res, next): Promise<void> => { ... }`.
- Handlers receive `(req: Request, res: Response, next: NextFunction)`.
- Always wrapped in `try/catch`; errors are forwarded via `next(error)` — never caught inline.

```ts
export const getMe = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const user = await userService.getUserProfile(req.user!.id);
    res.json(apiResponse.success('Profile retrieved', user));
  } catch (error) {
    next(error);
  }
};
```

### Calling Services
- Controllers call services, never Prisma directly.
- Audit logging is done at the controller level (not in services) via `auditService.log(...)`.
- `req.user` is checked for presence (`if (!req.user) { res.status(401).json(...); return; }`) on protected handlers.
- File cleanup on error is handled in controllers (e.g., deleting uploaded files if the service call fails).

---

## Routes

### Registration
- Routes are defined in `src/routes/*Routes.ts`, each exporting a `Router()`.
- Sub-routers are mounted in `src/routes/index.ts` under `/api/v1`:
  ```ts
  apiRouter.use('/auth', authRouter);
  apiRouter.use('/users', userRouter);
  apiRouter.use('/kyc', kycRouter);
  apiRouter.use('/documents', documentRouter);
  apiRouter.use('/admin', adminRouter);
  ```

### Middleware Order
Always: **`authenticate` → `authorize(...)` → `validate(schema)` → handler**.

```ts
router.get('/', authenticate, authorize('ADMIN'), validate(listUsersSchema), listUsers);
router.patch('/me', authenticate, validate(updateUserSchema), updateMe);
router.get('/dashboard', authenticate, authorize('ADMIN'), getDashboard);
```

- `authenticate` — JWT verification, attaches `req.user`.
- `authorize(...)` — RBAC role check.
- `validate(schema)` — Zod body/params/query validation.
- Handler — controller function.

Multer upload middleware is placed between auth and handler, wrapped inline to catch errors:
```ts
router.post('/upload', authenticate, (req, res, next) => {
  upload.single('file')(req, res, (err) => { if (err) return next(err); next(); });
}, uploadDocument);
```

---

## Schemas / Validators (Zod)

### Structure
- Each schema defines which parts of the request to validate: `body`, `params`, and/or `query`.
- Stored in dedicated schema files (`src/routes/*Schemas.ts`) co-located with route files, or inline in route files for simple cases.
- Exported as named constants: `export const updateUserSchema = z.object({ ... })`.

```ts
// src/routes/schemas.ts
export const updateUserSchema = z.object({
  body: z.object({
    email: z.string().email('Invalid email').optional(),
    fullName: z.string().min(2, 'Full name must be at least 2 characters').optional(),
  }),
});

export const getUserByIdSchema = z.object({
  params: z.object({
    id: z.string().uuid('Invalid user ID format'),
  }),
});
```

### Validation Middleware
- `validate(schema)` in `src/middleware/requestValidation.ts` calls `schema.parseAsync({ body, params, query })`.
- On success, stores validated data on `req.validated` and `res.locals.validated` (does **not** overwrite `req.body` to avoid Express getter issues).
- On `ZodError`, passes `new AppError('Validation error', 400, formatted)` with the flattened error details.

---

## Middleware

### Auth (`src/middleware/auth.ts`)
- Extracts `Bearer <token>` from `Authorization` header.
- Verifies with `jwt.verify(token, JWT_ACCESS_SECRET)`.
- Decodes `{ sub, email, role }` and attaches to `req.user` as `{ id, email, role }` (string fields).
- On failure (missing header, expired, invalid) calls `next(new AppError('...', 401))`.

### RBAC (`src/middleware/rbac.ts`)
- Factory function: `authorize(...allowedRoles: string[])` returns middleware.
- Checks `req.user.role` against allowed roles (`allowedRoles.includes(req.user.role)`).
- Returns `401` if no `req.user`, `403` if role not allowed.
- Role strings are used directly (no numeric IDs involved):
  ```ts
  authorize('ADMIN')
  authorize('ADMIN', 'REVIEWER')
  ```

### Error Handler (`src/middleware/errorHandler.ts`)
- Global Express error handler (4-arg signature).
- Distinguishes `AppError`, `SyntaxError` (bad JSON), and unknown errors.
- Returns `apiResponse.error(message, statusCode, details)`.
- Only exposes `details` in development mode.

---

## Utils

### `apiResponse.ts` — Response Format

```ts
// Success
apiResponse.success('Profile retrieved', data)
// → { success: true, message: 'Profile retrieved', data: {...}, statusCode: 200 }

// Error
apiResponse.error('Not found', 404, details?)
// → { success: false, message: 'Not found', statusCode: 404, details?: {...} }

// Paginated
apiResponse.paginated('Users listed', items, page, limit, total)
// → { success: true, message: 'Users listed', data: [...], meta: { page, limit, total, pages } }
```

Controllers respond with `res.json(apiResponse.success(...))` or `res.status(4xx).json(apiResponse.error(...))`.

### `pagination.ts`
- `paginate(query)` — extracts `page` (default 1) and `limit` (default 10, max 100, min 1) from query params, returns `{ skip, take, page, limit }`.
- `paginationMeta(total, limit, page)` — computes `pages: Math.ceil(total / limit)`.

### `AppError.ts`
```ts
export class AppError extends Error {
  constructor(public message: string, public statusCode: number = 500, public details?: unknown) { ... }
}
```

---

## Role Table Values

The `Role` model is seeded with three string-based names (the `name` field is `@unique` on the Prisma schema):

| Role String   | Used In                          |
|---------------|----------------------------------|
| `"USER"`      | Default registration role        |
| `"REVIEWER"`  | KYC document review access       |
| `"ADMIN"`     | Admin dashboard & user mgmt      |

Roles are matched by **string**, not by numeric ID. The `User.role` field stores the string directly (Prisma enum-like via the `Role` relation or direct string field on the `User` model).

```ts
authorize('ADMIN')                                  // middleware usage
authorize('ADMIN', 'REVIEWER')                      // multi-role
role: z.enum(['USER', 'ADMIN', 'REVIEWER'])          // Zod validation
```

---

## Key Conventions Summary

| Concern              | Convention                                                                 |
|----------------------|---------------------------------------------------------------------------|
| Imports              | Path aliases (`@/config/database`, `@/services/userService`)              |
| Service structure    | Object with async methods, Prisma via `prisma`, `AppError` for errors     |
| Controller structure | Named async exports, `try/catch` + `next(error)`                          |
| Route definition     | `authenticate` → `authorize(...)` → `validate(schema)` → handler          |
| Zod schemas          | Keys `body`, `params`, `query`; error messages as string literals         |
| Role checking        | String-based (not numeric) — `req.user.role` vs `allowedRoles`            |
| Response format      | `apiResponse.success/error/paginated` — consistent `{ success, message, data/meta }` |
| Pagination           | `paginate(query)`, `paginationMeta(total, limit, page)` from `@/utils/pagination` |
| Audit logging        | In controllers (not services) via `auditService.log({ userId, action, metadata, ip, userAgent })` |
| File uploads         | Multer middleware, wrapped inline in route definition, cleanup on error in controller |
