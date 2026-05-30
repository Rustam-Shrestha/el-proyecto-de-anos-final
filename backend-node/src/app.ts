import cors from "cors";
import express from "express";
import path from "path";
import helmet from "helmet";
import swaggerUi from "swagger-ui-express";
import pinoHttp from "pino-http";
import passport from "passport";
import { apiRouter } from "@routes/index";
import { env } from "@config/env";
import { logger } from "@config/logger";
import { errorHandler } from "@middleware/errorHandler";
import { notFoundHandler } from "@middleware/notFound";
import { openApiSpec } from "@docs/openapi";
import "@middleware/oauth2";

export const app = express();

const allowedOrigins = env.CORS_ORIGIN.split(",")
	.map((origin) => origin.trim())
	.filter(Boolean);

const corsOrigin = (origin: string | undefined, callback: (_error: Error | null, _allow?: boolean) => void) => {
	if (!origin) {
		return callback(null, true);
	}

	if (allowedOrigins.includes(origin)) {
		return callback(null, true);
	}

	if (env.NODE_ENV === "development" && /^https?:\/\/(localhost|127\.0\.0\.1):\d+$/.test(origin)) {
		return callback(null, true);
	}

	return callback(new Error(`CORS blocked for origin: ${origin}`));
};

// Security and request-parsing defaults suitable for API-first backends.
app.use(helmet());
app.use(cors({ origin: corsOrigin }));
app.use(express.json({ limit: "1mb" }));
app.use(pinoHttp({ logger }));
app.use(passport.initialize());
app.use("/uploads", express.static(path.join(process.cwd(), "uploads")));

app.use("/docs", swaggerUi.serve, swaggerUi.setup(openApiSpec));
app.use("/api/v1", apiRouter);

app.use(notFoundHandler);
app.use(errorHandler);
