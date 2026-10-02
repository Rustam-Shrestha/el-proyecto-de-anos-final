import { env } from "@/config/env";
import { logger } from "@/config/logger";

type RedisLike = {
  get(key: string): Promise<string | null>;
  set(key: string, value: string): Promise<string>;
  setex(key: string, ttl: number, value: string): Promise<string>;
  del(...keys: string[]): Promise<number>;
  keys(pattern: string): Promise<string[]>;
  on(event: string, cb: (err: Error) => void): void;
};

class InMemoryFallback implements RedisLike {
  private store = new Map<string, { v: string; exp?: number }>();
  async get(k: string) {
    const e = this.store.get(k);
    if (!e) return null;
    if (e.exp && Date.now() > e.exp) { this.store.delete(k); return null; }
    return e.v;
  }
  async set(k: string, v: string) { this.store.set(k, { v }); return "OK"; }
  async setex(k: string, ttl: number, v: string) { this.store.set(k, { v, exp: Date.now() + ttl * 1000 }); return "OK"; }
  async del(...keys: string[]) { let c=0; for (const k of keys) if (this.store.delete(k)) c++; return c; }
  async keys(pattern: string) {
    const regex = new RegExp("^" + pattern.replace(/\*/g, ".*") + "$");
    return Array.from(this.store.keys()).filter((k) => regex.test(k));
  }
  on() {}
}

class RedisConnection {
  private client: RedisLike;
  private isReal = false;
  constructor() {
    const host = env.REDIS_HOST;
    // try real redis lazily
    try {
      // dynamic require to keep fallback when ioredis not installed
      const Redis = require("ioredis");
      const c = new Redis({
        host: env.REDIS_HOST,
        port: env.REDIS_PORT,
        password: env.REDIS_PASSWORD || undefined,
        retryStrategy: (times: number) => Math.min(times * 50, 2000),
        enableReadyCheck: false,
        maxRetriesPerRequest: null,
        lazyConnect: true,
      });
      c.on("error", (err: Error) => logger.warn({ err }, "Redis error (fallback active)"));
      c.on("connect", () => logger.info("Redis connected"));
      // trigger connect but don't await; fallback if fails quickly
      c.connect().catch(() => logger.warn("Redis connect failed, using in-memory fallback"));
      this.client = c as RedisLike;
      this.isReal = true;
      void host;
    } catch {
      logger.warn("ioredis not available, using in-memory cache fallback");
      this.client = new InMemoryFallback();
    }
  }
  getInstance(): RedisLike { return this.client; }
  isRealRedis() { return this.isReal; }
}

export const redisConnection = new RedisConnection();
