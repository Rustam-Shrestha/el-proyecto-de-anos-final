import { randomUUID } from "crypto";
import { pool } from "@db/pool";

export const writeAuditLog = async (actorUserId: string, action: string, metadata?: unknown) => {
  await pool.query(
    `
      INSERT INTO audit_logs (id, actor_user_id, action, metadata, created_at)
      VALUES ($1, $2, $3, $4::jsonb, NOW())
    `,
    [randomUUID(), actorUserId, action, JSON.stringify(metadata ?? {})]
  );
};
