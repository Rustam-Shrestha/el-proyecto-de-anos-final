import { redisConnection } from "./redisClient";
import { logger } from "@/config/logger";

export class CacheManager {
  private get redis() {
    return redisConnection.getInstance();
  }

  // Stampede protection: map of in-flight promises keyed by cache key
  private inFlight = new Map<string, Promise<unknown>>();

  /**
   * Fetch raw string from cache
   */
  async get(key: string): Promise<string | null> {
    try {
      return await this.redis.get(key);
    } catch (err) {
      logger.warn({ err, key }, "Cache get error");
      return null;
    }
  }

  /**
   * Fetch parsed JSON object from cache
   */
  async getJson<T>(key: string): Promise<T | null> {
    const raw = await this.get(key);
    if (!raw) return null;
    try {
      return JSON.parse(raw) as T;
    } catch {
      return null;
    }
  }

  /**
   * Set raw string value with optional TTL (in seconds)
   */
  async set(key: string, value: string, ttlSeconds?: number): Promise<void> {
    try {
      if (ttlSeconds && ttlSeconds > 0) {
        await this.redis.setex(key, ttlSeconds, value);
      } else {
        await this.redis.set(key, value);
      }
    } catch (err) {
      logger.warn({ err, key }, "Cache set error");
    }
  }

  /**
   * Set structured JSON value with optional TTL (in seconds)
   */
  async setJson<T>(key: string, value: T, ttlSeconds?: number): Promise<void> {
    try {
      const serialized = JSON.stringify(value);
      await this.set(key, serialized, ttlSeconds);
    } catch (err) {
      logger.warn({ err, key }, "Cache setJson serialization error");
    }
  }

  /**
   * Atomically increment key counter with optional expiration
   */
  async incr(key: string, ttlSeconds?: number): Promise<number> {
    try {
      const val = await this.redis.incr(key);
      if (ttlSeconds && ttlSeconds > 0) {
        await this.redis.expire(key, ttlSeconds);
      }
      return val;
    } catch (err) {
      logger.warn({ err, key }, "Cache incr error");
      return 1;
    }
  }

  /**
   * Check if a key exists
   */
  async exists(key: string): Promise<boolean> {
    try {
      const count = await this.redis.exists(key);
      return count > 0;
    } catch {
      return false;
    }
  }

  /**
   * Delete a key
   */
  async delete(key: string): Promise<void> {
    try {
      await this.redis.del(key);
    } catch (err) {
      logger.warn({ err, key }, "Cache delete error");
    }
  }

  /**
   * Delete multiple keys at once
   */
  async deleteMany(keys: string[]): Promise<void> {
    if (!keys || keys.length === 0) return;
    try {
      await this.redis.del(...keys);
    } catch (err) {
      logger.warn({ err, count: keys.length }, "Cache deleteMany error");
    }
  }

  /**
   * Invalidate all keys matching a wildcard pattern (e.g. "user:123:*")
   */
  async invalidatePattern(pattern: string): Promise<void> {
    try {
      const matched = await this.redis.keys(pattern);
      if (matched.length > 0) {
        await this.redis.del(...matched);
      }
    } catch (err) {
      logger.warn({ err, pattern }, "Cache invalidatePattern error");
    }
  }

  /**
   * Get cached value or compute and store it with single-flight stampede protection.
   * If 50 concurrent requests request the same key at the same instant,
   * only 1 execution of the fallback function occurs; the other 49 wait on the single promise.
   */
  async getOrSet<T>(key: string, fallback: () => Promise<T>, ttlSeconds = 3600): Promise<T> {
    const cached = await this.get(key);
    if (cached !== null) {
      try {
        return JSON.parse(cached) as T;
      } catch {
        // Corrupted cache data; ignore and fall through
      }
    }

    // Single-flight stampede protection
    const running = this.inFlight.get(key);
    if (running) {
      return running as Promise<T>;
    }

    const promise = (async () => {
      try {
        const result = await fallback();
        if (result !== undefined) {
          await this.set(key, JSON.stringify(result), ttlSeconds);
        }
        return result;
      } finally {
        this.inFlight.delete(key);
      }
    })();

    this.inFlight.set(key, promise);
    return promise;
  }
}

export const cacheManager = new CacheManager();

