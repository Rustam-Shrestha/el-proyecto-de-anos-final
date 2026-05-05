import { randomUUID } from "crypto";
import bcrypt from "bcryptjs";
import { pool } from "@db/pool";

export const listUsers = async (limit: number, offset: number) => {
  const dataResult = await pool.query(
    `
      SELECT u.id, u.email, r.name AS role
      FROM users u
      JOIN roles r ON r.id = u.role_id
      ORDER BY u.created_at DESC
      LIMIT $1 OFFSET $2
    `,
    [limit, offset]
  );

  const countResult = await pool.query("SELECT COUNT(*)::int AS total FROM users");

  return {
    users: dataResult.rows,
    total: countResult.rows[0].total as number
  };
};

export const createUser = async (email: string, role: string, password = "ChangeMe123!") => {
  const roleResult = await pool.query("SELECT id FROM roles WHERE name = $1 LIMIT 1", [role]);
  if (!roleResult.rows[0]) {
    throw new Error("Role not found");
  }

  const passwordHash = await bcrypt.hash(password, 10);

  const result = await pool.query(
    `
      INSERT INTO users (id, email, password_hash, role_id, created_at)
      VALUES ($1, $2, $3, $4, NOW())
      RETURNING id, email
    `,
    [randomUUID(), email, passwordHash, roleResult.rows[0].id]
  );

  return {
    id: result.rows[0].id,
    email: result.rows[0].email,
    role
  };
};
