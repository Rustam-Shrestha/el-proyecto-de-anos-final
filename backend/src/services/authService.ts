import { randomUUID } from "crypto";
import bcrypt from "bcryptjs";
import { pool } from "@db/pool";
import { signAccessToken, signRefreshToken } from "@services/tokenService";

export const loginUser = async (email: string, password: string) => {
  const query = `
    SELECT u.id, u.email, u.password_hash, r.name AS role_name
    FROM users u
    JOIN roles r ON r.id = u.role_id
    WHERE u.email = $1
    LIMIT 1
  `;

  const result = await pool.query(query, [email]);
  const user = result.rows[0];

  if (!user) {
    return null;
  }

  const matches = await bcrypt.compare(password, user.password_hash);
  if (!matches) {
    return null;
  }

  const payload = {
    sub: user.id,
    email: user.email,
    role: user.role_name
  };

  const accessToken = signAccessToken(payload);
  const refreshToken = signRefreshToken(payload);

  await pool.query(
    "INSERT INTO sessions (id, user_id, refresh_token, created_at) VALUES ($1, $2, $3, NOW())",
    [randomUUID(), user.id, refreshToken]
  );

  return {
    token: accessToken,
    refreshToken,
    user: {
      id: user.id,
      email: user.email,
      role: user.role_name
    }
  };
};
