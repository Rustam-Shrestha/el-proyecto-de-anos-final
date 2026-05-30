CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE IF NOT EXISTS roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(50) UNIQUE NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  role_id UUID NOT NULL REFERENCES roles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id),
  refresh_token TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_user_id UUID REFERENCES users(id),
  action VARCHAR(120) NOT NULL,
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO roles (name)
VALUES ('admin'), ('manager'), ('staff')
ON CONFLICT (name) DO NOTHING;

INSERT INTO users (email, password_hash, role_id)
SELECT
  'admin@example.com',
  crypt('Admin1234!', gen_salt('bf')),
  r.id
FROM roles r
WHERE r.name = 'admin'
ON CONFLICT (email) DO NOTHING;

INSERT INTO users (email, password_hash, role_id)
SELECT
  'manager@example.com',
  crypt('Manager1234!', gen_salt('bf')),
  r.id
FROM roles r
WHERE r.name = 'manager'
ON CONFLICT (email) DO NOTHING;

INSERT INTO users (email, password_hash, role_id)
SELECT
  'staff@example.com',
  crypt('Staff1234!', gen_salt('bf')),
  r.id
FROM roles r
WHERE r.name = 'staff'
ON CONFLICT (email) DO NOTHING;
