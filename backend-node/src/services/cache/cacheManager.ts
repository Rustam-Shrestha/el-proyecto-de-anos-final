import { redisConnection } from "./redisClient";

export class CacheManager {
  private redis = redisConnection.getInstance();
  async get(key: string): Promise<string | null> {
    try { return await this.redis.get(key); } catch { return null; }
  }
  async set(key: string, value: string, ttlSeconds?: number): Promise<void> {
    try {
      if (ttlSeconds) await this.redis.setex(key, ttlSeconds, value);
      else await this.redis.set(key, value);
    } catch { /* ignore */ }
  }
  async delete(key: string): Promise<void> {
    try { await this.redis.del(key); } catch { /* ignore */ }
  }
  async invalidatePattern(pattern: string): Promise<void> {
    try {
      const keys = await this.redis.keys(pattern);
      if (keys.length) await this.redis.del(...keys);
    } catch { /* ignore */ }
  }
  async getOrSet<T>(key: string, fallback: () => Promise<T>, ttlSeconds = 3600): Promise<T> {
    const cached = await this.get(key);
    if (cached) {
      try { return JSON.parse(cached) as T; } catch { /* ignore */ }
    }
    const result = await fallback();
    await this.set(key, JSON.stringify(result), ttlSeconds);
    return result;
  }
}

export const cacheManager = new CacheManager();
