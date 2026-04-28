import { pool } from "@db/pool";
import bcrypt from "bcryptjs";
import { randomUUID } from "crypto";

const seedRoles = ["admin", "manager", "staff"];

const seedUsers = [
  { email: "admin@example.com", role: "admin", password: "Admin1234!" },
  { email: "manager@example.com", role: "manager", password: "Manager1234!" },
  { email: "staff@example.com", role: "staff", password: "Staff1234!" }
];

export const initializeDatabase = async () => {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS roles (
      id UUID PRIMARY KEY,
      name VARCHAR(50) UNIQUE NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id UUID PRIMARY KEY,
      email VARCHAR(255) UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      role_id UUID NOT NULL REFERENCES roles(id),
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS sessions (
      id UUID PRIMARY KEY,
      user_id UUID NOT NULL REFERENCES users(id),
      refresh_token TEXT NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      expires_at TIMESTAMPTZ
    )
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS audit_logs (
      id UUID PRIMARY KEY,
      actor_user_id UUID REFERENCES users(id),
      action VARCHAR(120) NOT NULL,
      metadata JSONB,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);

  for (const role of seedRoles) {
    const existingRole = await pool.query("SELECT id FROM roles WHERE name = $1 LIMIT 1", [role]);
    if (existingRole.rowCount === 0) {
      await pool.query("INSERT INTO roles (id, name, created_at) VALUES ($1, $2, NOW())", [randomUUID(), role]);
    }
  }

  for (const user of seedUsers) {
    const roleResult = await pool.query("SELECT id FROM roles WHERE name = $1 LIMIT 1", [user.role]);
    const passwordHash = await bcrypt.hash(user.password, 10);

    if (roleResult.rowCount === 0) {
      continue;
    }

    const existingUser = await pool.query("SELECT id FROM users WHERE email = $1 LIMIT 1", [user.email]);
    if (existingUser.rowCount > 0) {
      continue;
    }

    await pool.query(
      `
        INSERT INTO users (id, email, password_hash, role_id, created_at)
        VALUES ($1, $2, $3, $4, NOW())
      `,
      [randomUUID(), user.email, passwordHash, roleResult.rows[0].id]
    );
  }
};