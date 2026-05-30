# Backend Node (Express + TypeScript)

Folder structure (full):
```
backend-node/
├─ src/
│  ├─ app.ts
│  ├─ server.ts
│  ├─ config/
│  │  └─ env.ts
│  ├─ controllers/
│  │  └─ authController.ts
│  ├─ services/
│  │  └─ authService.ts
│  ├─ db/
│  │  └─ pool.ts
│  ├─ middleware/
│  │  └─ auth.ts
│  ├─ routes/
│  │  └─ index.ts
│  └─ utils/
└─ migrations/
```

Path aliases (tsconfig):
```json
"@config/*": ["./src/config/*"],
"@controllers/*": ["./src/controllers/*"],
"@services/*": ["./src/services/*"],
"@routes/*": ["./src/routes/*"],
"@db/*": ["./src/db/*"]
```

Controller → Service → DB (example implementations)

// src/controllers/authController.ts
```ts
import { Request, Response } from 'express';
import { registerUser } from '@services/authService';

export const registerController = async (req: Request, res: Response) => {
  const { email, password } = req.body;
  const user = await registerUser({ email, password });
  return res.status(201).json({ success: true, data: user });
}
```

// src/services/authService.ts
```ts
import { pool } from '@db/pool';
import bcrypt from 'bcryptjs';

export async function registerUser({ email, password }) {
  const hashed = await bcrypt.hash(password, 10);
  const result = await pool.query(
    'INSERT INTO users (email, password) VALUES ($1, $2) RETURNING id, email',
    [email, hashed]
  );
  return result.rows[0];
}
```

// src/db/pool.ts
```ts
import { Pool } from 'pg';
import { env } from '@config/env';

export const pool = new Pool({ connectionString: env.DATABASE_URL });
```

Route organization:
- `src/routes/index.ts` aggregates feature routers and prefixes with `/api/v1`.

Middleware patterns (implementations):

// src/middleware/auth.ts
```ts
import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '@config/env';

export const requireAuth = (req: Request, res: Response, next: NextFunction) => {
  const auth = req.headers.authorization?.split(' ')[1];
  if (!auth) return res.status(401).json({ success: false, message: 'Unauthorized' });
  try {
    const payload = jwt.verify(auth, env.JWT_SECRET) as any;
    (req as any).user = payload;
    return next();
  } catch (err) {
    return res.status(401).json({ success: false, message: 'Invalid token' });
  }
}

export const requireRole = (roles: string[]) => (req: Request, res: Response, next: NextFunction) => {
  const user = (req as any).user;
  if (!user || !roles.includes(user.role)) return res.status(403).json({ success: false, message: 'Forbidden' });
  next();
}
```

Validation middleware (Zod):
```ts
import { ZodSchema } from 'zod';
export const validateRequest = (schema: ZodSchema<any>) => (req, res, next) => {
  const result = schema.safeParse({ body: req.body, query: req.query, params: req.params });
  if (!result.success) return res.status(400).json({ success: false, message: 'Invalid request', errors: result.error.flatten() });
  next();
}
```

Error handler and notFound:
```ts
export const notFound = (req, res) => res.status(404).json({ success: false, message: 'Not Found' });

export const errorHandler = (err, req, res, next) => {
  console.error(err);
  res.status(500).json({ success: false, message: 'Internal Server Error' });
}
```

API response envelope (TypeScript):
```ts
export type ApiResponse<T> = { success: boolean; data?: T; meta?: any; message?: string };
```

Execution pipeline:
route -> validateRequest(schema) -> requireAuth? -> controller -> service -> db -> res(apiResponse)

Route families (present):
- `auth`, `users`, `kyc`, `document`, `admin`

Ports & dev commands:
- local dev: `PORT=3000`
- docker mapping: `4000` (frontend expects `http://localhost:4000/api/v1`)
- Dev commands (monorepo):
```
npm run dev -w backend-node
npm run build -w backend-node
npm run test -w backend-node
```

New feature checklist:
- create migration SQL → update migrations/
- add DB queries in services
- add service tests
- add controller + route and register in `routes/index.ts`
- update `.github/instructions/backend-node.md` route table (SELF-ADAPTATION)

