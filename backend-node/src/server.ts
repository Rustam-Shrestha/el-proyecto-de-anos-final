import { app } from "./app";
import { env } from "@config/env";
import { logger } from "@config/logger";
import { initializeDatabase } from "@db/init";
import { initializeRedis, closeRedis } from "@config/redis";

const startServer = async () => {
  try {
    await initializeDatabase().catch(err => {
      logger.error({ err }, "Database initialization error");
      throw err;
    });
    await initializeRedis();

    const server = app.listen(env.PORT, () => {
      logger.info(`Backend listening on port ${env.PORT}`);
      logger.info(`Environment: ${env.NODE_ENV}`);
    });

    // Graceful shutdown
    const shutdown = async (signal: string) => {
      logger.info(`Received ${signal}, shutting down gracefully...`);
      server.close(async () => {
        await closeRedis();
        logger.info("Server closed");
        process.exit(0);
      });

      // Force shutdown after 10 seconds
      setTimeout(() => {
        logger.error("Forced shutdown");
        process.exit(1);
      }, 10000);
    };

    process.on("SIGTERM", () => shutdown("SIGTERM"));
    process.on("SIGINT", () => shutdown("SIGINT"));
  } catch (error) {
    logger.error({ err: error }, "Failed to start server");
    process.exit(1);
  }
};

void startServer();
