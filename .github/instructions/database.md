# Database Conventions

Node (Postgres via `pg`):
- Primary Node stack uses raw `pg` pool; avoid ORM unless explicitly adopted.

pool setup (src/db/pool.ts):
```ts
import { Pool } from 'pg';
import { env } from '@config/env';

export const pool = new Pool({ connectionString: env.DATABASE_URL });
```

Parameterized queries (always):
```ts
const { rows } = await pool.query('SELECT id, email FROM users WHERE id = $1', [id]);
```

Insert with RETURNING:
```ts
const res = await pool.query('INSERT INTO users (email, password) VALUES ($1,$2) RETURNING id, email', [email, pw]);
const user = res.rows[0];
```

Transactions pattern:
```ts
await pool.query('BEGIN');
try {
	await pool.query('UPDATE accounts SET balance = balance - $1 WHERE id = $2', [amt, from]);
	await pool.query('UPDATE accounts SET balance = balance + $1 WHERE id = $2', [amt, to]);
	await pool.query('COMMIT');
} catch (err) { await pool.query('ROLLBACK'); throw err; }
```

Pagination counting pattern:
```sql
SELECT id, email FROM users ORDER BY created_at DESC LIMIT $1 OFFSET $2;
SELECT COUNT(*)::int AS total FROM users;
```

Schema excerpts (DDL):
```sql
CREATE TABLE roles ( id serial PRIMARY KEY, name text UNIQUE NOT NULL );

CREATE TABLE users (
	id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	email text UNIQUE NOT NULL,
	password text NOT NULL,
	role_id int REFERENCES roles(id),
	created_at timestamptz DEFAULT now()
);

CREATE TABLE sessions (
	id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	user_id uuid REFERENCES users(id),
	refresh_token text NOT NULL,
	created_at timestamptz DEFAULT now()
);

CREATE TABLE audit_logs (
	id serial PRIMARY KEY,
	action text,
	meta jsonb,
	created_at timestamptz DEFAULT now()
);
```

Migrations:
- SQL migrations live under `backend-node/migrations/` and `prisma/migrations/`.

FastAPI note:
- FastAPI uses async SQLAlchemy; keep session usage in `app/db/` and services only.

Rules (short):
- Never interpolate user input into SQL; use `$1` style placeholders
- Use `RETURNING` for inserts

