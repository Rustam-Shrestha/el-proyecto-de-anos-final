import { Router } from "express";
import { createUserController, listUsersController } from "@controllers/userController";
import { requireAuth } from "@middleware/auth";
import { requireRole } from "@middleware/rbac";
import { validateRequest } from "@middleware/requestValidation";
import { createUserSchema, paginationSchema } from "@routes/schemas";

export const userRoutes = Router();

/**
 * @openapi
 * /api/v1/users:
 *   get:
 *     tags:
 *       - Users
 *     summary: List users with pagination.
 *     responses:
 *       200:
 *         description: Paginated users
 */
userRoutes.get("/", requireAuth, validateRequest(paginationSchema), listUsersController);

/**
 * @openapi
 * /api/v1/users:
 *   post:
 *     tags:
 *       - Users
 *     summary: Create a user.
 *     responses:
 *       201:
 *         description: Created user
 */
userRoutes.post(
  "/",
  requireAuth,
  requireRole(["admin", "manager"]),
  validateRequest(createUserSchema),
  createUserController
);
