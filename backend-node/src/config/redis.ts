import { createClient } from "redis";
import { logger } from "@config/logger";
import { env } from "@config/env";

// Create Redis client
export const redisClient = createClient({
  url: env.REDIS_URL,
  socket: {
    reconnectStrategy: (retries) => {
      if (retries > 10) {
        logger.error("Redis max retries exceeded");
        return new Error("Redis max retries exceeded");
      }
      return retries * 100;
    }
  }
});

// Handle Redis errors
redisClient.on("error", (err) => {
  logger.error({ err }, "Redis client error");
});

redisClient.on("connect", () => {
  logger.info("Redis connected");
});

redisClient.on("ready", () => {
  logger.info("Redis ready");
});

redisClient.on("reconnecting", () => {
  logger.info("Redis reconnecting");
});

// Initialize Redis connection
export const initializeRedis = async () => {
  try {
    if (!redisClient.isOpen) {
      await redisClient.connect();
    }
    logger.info("Redis initialized successfully");
  } catch (error) {
    logger.error({ err: error }, "Failed to initialize Redis");
    throw error;
  }
};

// Close Redis connection
export const closeRedis = async () => {
  try {
    if (redisClient.isOpen) {
      await redisClient.quit();
    }
    logger.info("Redis connection closed");
  } catch (error) {
    logger.error({ err: error }, "Error closing Redis connection");
  }
};
