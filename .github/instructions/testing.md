# Testing Conventions

Status:
- Jest + Supertest used in `backend-node` (auth and users tests present).
- Playwright e2e: scaffold exists under `tests/e2e/` (not wired).
- Frontend tests: not yet standardized (Vitest + RTL preferred).

Example: Jest + Supertest auth test (tests/auth.test.ts)
```ts
import request from 'supertest';
import { app } from '../src/app';

describe('POST /api/v1/auth/login', () => {
	it('returns tokens on valid credentials', async () => {
		const res = await request(app).post('/api/v1/auth/login').send({ email: 'test@example.com', password: 'secret' });
		expect(res.status).toBe(200);
		expect(res.body.success).toBe(true);
		expect(res.body.data.accessToken).toBeDefined();
	});
});
```

Users test example with auth setup (tests/users.test.ts):
```ts
import request from 'supertest';
import { app } from '../src/app';
let token: string;
beforeAll(async () => {
	const res = await request(app).post('/api/v1/auth/login').send({ email: 'admin@example.com', password: 'admin' });
	token = res.body.data.accessToken;
});

test('GET /api/v1/users', async () => {
	const res = await request(app).get('/api/v1/users').set('Authorization', `Bearer ${token}`);
	expect(res.status).toBe(200);
});
```

Run commands:
```
npm run test -w backend-node
npm run test:watch -w backend-node
```

Playwright e2e:
- Tests live in `tests/e2e/specs/` and use Playwright config `playwright.config.ts`.
- This is scaffolded; wire browsers/CI before relying on it.

Frontend:
- Prefer `vitest` + `@testing-library/react` for components; implement when requested.

Do not generate test boilerplate without explicit request.

