import { Request, Response } from "express";
import { createUser, listUsers } from "@services/userService";
import { writeAuditLog } from "@services/auditService";
import { parsePagination } from "@utils/pagination";

export const listUsersController = async (req: Request, res: Response) => {
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
};

export const createUserController = async (req: Request, res: Response) => {
  const { email, role } = req.body as { email: string; role: string };
  const user = await createUser(email, role);

  if (req.user) {
    await writeAuditLog(req.user.id, "user.create", { userId: user.id });
  }

  return res.status(201).json({
    success: true,
    data: user
  });
};
