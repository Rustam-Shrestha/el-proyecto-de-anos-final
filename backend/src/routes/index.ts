import { Router } from "express";
import { authRoutes } from "@routes/authRoutes";
import { userRoutes } from "@routes/userRoutes";
import { healthRoutes } from "@routes/healthRoutes";
import { healthController } from "@controllers/healthController";

export const apiRouter = Router();

apiRouter.get("/", healthController);
apiRouter.use("/auth", authRoutes);
apiRouter.use("/users", userRoutes);
apiRouter.use("/", healthRoutes);
