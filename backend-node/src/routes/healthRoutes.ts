import { Router } from "express";
import { fastapiPingController, healthController } from "@controllers/healthController";

export const healthRoutes = Router();

healthRoutes.get("/", healthController);
healthRoutes.get("/health", healthController);
healthRoutes.get("/integrations/fastapi/ping", fastapiPingController);
