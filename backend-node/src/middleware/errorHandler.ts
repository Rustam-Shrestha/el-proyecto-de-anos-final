import { NextFunction, Request, Response } from "express";
import { logger } from "@config/logger";

export const errorHandler = (
  error: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
) => {
  logger.error({ err: error }, "Unhandled error");

  return res.status(500).json({
    success: false,
    message: "Internal server error"
  });
};
