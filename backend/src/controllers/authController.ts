import { Request, Response } from "express";
import { loginUser } from "@services/authService";

export const loginController = async (req: Request, res: Response) => {
  const { email, password } = req.body as { email: string; password: string };

  const payload = await loginUser(email, password);
  if (!payload) {
    return res.status(401).json({ success: false, message: "Invalid credentials" });
  }

  return res.json({
    success: true,
    data: payload
  });
};
