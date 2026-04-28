import { app } from "./app";
import { env } from "@config/env";
import { logger } from "@config/logger";
import { initializeDatabase } from "@db/init";

const startServer = async () => {
  await initializeDatabase();

  app.listen(env.PORT, () => {
    logger.info(`Backend listening on port ${env.PORT}`);
  });
};

void startServer();
