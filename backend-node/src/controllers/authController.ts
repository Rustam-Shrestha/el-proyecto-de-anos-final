import { Request, Response } from "express";
import { loginUser } from "@services/authService";
import { logger } from "@config/logger";

export const loginController = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body as { email: string; password: string };

    const payload = await loginUser(email, password);
    if (!payload) {
      return res.status(401).json({ success: false, message: "Invalid credentials" });
    }

    return res.json({
      success: true,
      data: payload
    });
  } catch (error) {
    logger.error({ err: error }, "Login error");
    return res.status(500).json({ success: false, message: "Login failed" });
  }
};
