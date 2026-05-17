import { Request, Response } from "express";
import { createUser, listUsers } from "@services/userService";
import { writeAuditLog } from "@services/auditService";
import { parsePagination } from "@utils/pagination";
import { logger } from "@config/logger";

export const listUsersController = async (req: Request, res: Response) => {
  try {
    const { page, limit, offset } = parsePagination(req);
    const { users, total } = await listUsers(limit, offset);

    return res.json({
      success: true,
      data: users,
      meta: {
        page,
        limit,
        total
      }
    });
  } catch (error) {
    logger.error({ err: error }, "List users error");
    return res.status(500).json({ success: false, message: "Failed to list users" });
  }
};

export const createUserController = async (req: Request, res: Response) => {
  try {
    const { email, role } = req.body as { email: string; role: string };
    const user = await createUser(email, role);

    if (req.user) {
      await writeAuditLog(req.user.id, "user.create", { userId: user.id });
    }

    return res.status(201).json({
      success: true,
      data: user
    });
  } catch (error) {
    logger.error({ err: error }, "Create user error");
    return res.status(500).json({ success: false, message: "Failed to create user" });
  }
};
