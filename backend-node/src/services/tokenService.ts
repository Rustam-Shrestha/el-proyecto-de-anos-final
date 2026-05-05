import jwt from "jsonwebtoken";
import type { SignOptions } from "jsonwebtoken";
import { env } from "@config/env";

export const signAccessToken = (payload: { sub: string; email: string; role: string }) => {
  const accessOptions: SignOptions = {
    expiresIn: env.JWT_ACCESS_TTL as SignOptions["expiresIn"]
  };

  return jwt.sign(payload, env.JWT_ACCESS_SECRET, {
    ...accessOptions
  });
};

export const signRefreshToken = (payload: { sub: string; email: string; role: string }) => {
  const refreshOptions: SignOptions = {
    expiresIn: env.JWT_REFRESH_TTL as SignOptions["expiresIn"]
  };

  return jwt.sign(payload, env.JWT_REFRESH_SECRET, {
    ...refreshOptions
  });
};
