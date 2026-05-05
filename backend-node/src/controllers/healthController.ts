import { Request, Response } from "express";

export const healthController = async (_req: Request, res: Response) => {
  return res.json({
    success: true,
    data: {
      service: "backend",
      status: "ok"
    }
  });
};

export const fastapiPingController = async (_req: Request, res: Response) => {
  return res.json({
    success: true,
    data: {
      note: "FastAPI integration placeholder",
      strategy: "Call FASTAPI_URL from this backend service in future module adapters"
    }
  });
};
