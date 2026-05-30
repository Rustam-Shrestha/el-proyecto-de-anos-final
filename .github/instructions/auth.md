# Auth Contract & Patterns

Token contract:
- Backend returns `{ accessToken, refreshToken, user }` in API envelope on successful login/register.
- Access tokens: short-lived (recommend ~15m). Refresh tokens: longer (recommend 7d).

Token payload shape (TypeScript):
```ts
type TokenPayload = { sub: string; email: string; role: string };
```

`requireAuth` middleware (Node example):
```ts
import jwt from 'jsonwebtoken';
import { env } from '@config/env';

export const requireAuth = (req, res, next) => {
	const token = req.headers.authorization?.split(' ')[1];
	if (!token) return res.status(401).json({ success: false, message: 'Unauthorized' });
	try {
		const payload = jwt.verify(token, env.JWT_SECRET) as TokenPayload;
		req.user = payload; next();
	} catch (err) { return res.status(401).json({ success: false, message: 'Invalid token' }); }
}
```

`requireRole` RBAC helper:
```ts
export const requireRole = (allowed: string[]) => (req, res, next) => {
	const user = req.user;
	if (!user || !allowed.includes(user.role)) return res.status(403).json({ success: false, message: 'Forbidden' });
	next();
}
```

Frontend contract & behavior:
- `VITE_API_BASE_URL` must include `/api/v1` (e.g. `http://localhost:4000/api/v1`).
- On 401 from `apiClient` interceptors: remove tokens, dispatch `logout`, redirect to `/auth`.

Endpoints (documented):
- `POST /api/v1/auth/login` — body `{ email, password }` → returns `{ success:true, data:{ accessToken, refreshToken, user } }`
- `POST /api/v1/auth/register` — body `{ email, password }` → returns created user + tokens
- `POST /api/v1/auth/refresh` — body `{ refreshToken }` → returns new accessToken

Security rules:
- Hash passwords with `bcryptjs`
- Use httpOnly cookies for refresh tokens in production when possible
- Enforce CORS origins and secure headers (helmet)

