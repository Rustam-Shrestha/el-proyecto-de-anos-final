import { Request, Response, NextFunction } from "express";
import { redisClient } from "@config/redis";
import { logger } from "@config/logger";

export type CacheOptions = {
  ttl?: number; // Time to live in seconds
  keyPrefix?: string;
  condition?: (req: Request) => boolean; // Custom condition to cache
};

/**
 * Generic cache middleware for GET requests
 * Usage: app.get("/route", cacheMiddleware({ ttl: 300 }), controller);
 */
export const cacheMiddleware = (options: CacheOptions = {}) => {
  const { ttl = 600, keyPrefix = "cache", condition = () => true } = options;

  return async (req: Request, res: Response, next: NextFunction) => {
    // Only cache GET requests
    if (req.method !== "GET") {
      return next();
    }

    // Check custom condition
    if (!condition(req)) {
      return next();
    }

    try {
      const cacheKey = `${keyPrefix}:${req.originalUrl || req.url}`;

      // Try to get from cache
      const cachedData = await redisClient.get(cacheKey);

      if (cachedData) {
        logger.debug({ cacheKey }, "Cache hit");
        res.setHeader("X-Cache", "HIT");
        return res.json(JSON.parse(cachedData));
      }

      // Store original json method
      const originalJson = res.json.bind(res);

      // Override json method to cache response
      res.json = function (data: any) {
        try {
          // Cache the response
          redisClient.setEx(cacheKey, ttl, JSON.stringify(data)).catch((err) => {
            logger.error({ err, cacheKey }, "Failed to set cache");
          });

          res.setHeader("X-Cache", "MISS");
        } catch (error) {
          logger.error({ err: error }, "Error caching response");
        }

        return originalJson(data);
      };

      next();
    } catch (error) {
      logger.error({ err: error }, "Cache middleware error");
      // Don't fail the request, just skip caching
      next();
    }
  };
};

/**
 * Invalidate cache by key pattern
 * Usage: await invalidateCache("cache:users:*");
 */
export const invalidateCache = async (pattern: string) => {
  try {
    const keys = await redisClient.keys(pattern);
    if (keys.length > 0) {
      await redisClient.del(keys);
      logger.debug({ pattern, count: keys.length }, "Cache invalidated");
    }
  } catch (error) {
    logger.error({ err: error, pattern }, "Error invalidating cache");
  }
};

/**
 * Clear all cache
 * Usage: await clearAllCache();
 */
export const clearAllCache = async () => {
  try {
    await redisClient.flushDb();
    logger.info("All cache cleared");
  } catch (error) {
    logger.error({ err: error }, "Error clearing cache");
  }
};
