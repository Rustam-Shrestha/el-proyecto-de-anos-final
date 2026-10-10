import { env } from "@/config/env";
import { logger } from "@/config/logger";

export type RedisLike = {
  get(key: string): Promise<string | null>;
  set(key: string, value: string): Promise<string>;
  setex(key: string, ttl: number, value: string): Promise<string>;
  del(...keys: string[]): Promise<number>;
  keys(pattern: string): Promise<string[]>;
  mget(...keys: string[]): Promise<(string | null)[]>;
  mset(entries: Record<string, string>): Promise<string>;
  incr(key: string): Promise<number>;
  expire(key: string, ttlSeconds: number): Promise<number>;
  ttl(key: string): Promise<number>;
  exists(...keys: string[]): Promise<number>;
  on(event: string, cb: (...args: any[]) => void): void;
};

interface CacheEntry {
  v: string;
  exp?: number;
}

export class InMemoryFallback implements RedisLike {
  private store = new Map<string, CacheEntry>();
  private readonly maxEntries: number;
  private sweepTimer: NodeJS.Timeout | null = null;

  constructor(maxEntries = 10000) {
    this.maxEntries = maxEntries;
    // Active TTL sweep every 30s; unref so it does not keep Node/Jest process alive
    this.sweepTimer = setInterval(() => this.purgeExpired(), 30000);
    if (this.sweepTimer && typeof this.sweepTimer.unref === "function") {
      this.sweepTimer.unref();
    }
  }

  private purgeExpired(): void {
    const now = Date.now();
    for (const [k, e] of this.store.entries()) {
      if (e.exp && now > e.exp) {
        this.store.delete(k);
      }
    }
  }

  private evictIfFull(): void {
    while (this.store.size >= this.maxEntries) {
      // First key is oldest accessed (LRU eviction)
      const oldestKey = this.store.keys().next().value;
      if (oldestKey !== undefined) {
        this.store.delete(oldestKey);
      } else {
        break;
      }
    }
  }

  async get(k: string): Promise<string | null> {
    const e = this.store.get(k);
    if (!e) return null;
    if (e.exp && Date.now() > e.exp) {
      this.store.delete(k);
      return null;
    }
    // LRU touch: re-insert so it becomes the newest
    this.store.delete(k);
    this.store.set(k, e);
    return e.v;
  }

  async set(k: string, v: string): Promise<string> {
    this.store.delete(k);
    this.evictIfFull();
    this.store.set(k, { v });
    return "OK";
  }

  async setex(k: string, ttl: number, v: string): Promise<string> {
    this.store.delete(k);
    this.evictIfFull();
    this.store.set(k, { v, exp: Date.now() + ttl * 1000 });
    return "OK";
  }

  async del(...keys: string[]): Promise<number> {
    let c = 0;
    for (const k of keys) {
      if (this.store.delete(k)) c++;
    }
    return c;
  }

  async keys(pattern: string): Promise<string[]> {
    const regex = new RegExp("^" + pattern.replace(/([.+?^=!:${}()|[\]/\\])/g, "\\$1").replace(/\*/g, ".*") + "$");
    const now = Date.now();
    const result: string[] = [];
    for (const [k, e] of this.store.entries()) {
      if (e.exp && now > e.exp) {
        this.store.delete(k);
        continue;
      }
      if (regex.test(k)) {
        result.push(k);
      }
    }
    return result;
  }

  async mget(...keys: string[]): Promise<(string | null)[]> {
    const out: (string | null)[] = [];
    for (const k of keys) {
      out.push(await this.get(k));
    }
    return out;
  }

  async mset(entries: Record<string, string>): Promise<string> {
    for (const [k, v] of Object.entries(entries)) {
      await this.set(k, v);
    }
    return "OK";
  }

  async incr(key: string): Promise<number> {
    const current = await this.get(key);
    const parsed = current ? parseInt(current, 10) : 0;
    const nextVal = (isNaN(parsed) ? 0 : parsed) + 1;
    const existing = this.store.get(key);
    if (existing && existing.exp) {
      const remainingSeconds = Math.max(1, Math.round((existing.exp - Date.now()) / 1000));
      await this.setex(key, remainingSeconds, String(nextVal));
    } else {
      await this.set(key, String(nextVal));
    }
    return nextVal;
  }

  async expire(key: string, ttlSeconds: number): Promise<number> {
    const e = this.store.get(key);
    if (!e) return 0;
    if (e.exp && Date.now() > e.exp) {
      this.store.delete(key);
      return 0;
    }
    e.exp = Date.now() + ttlSeconds * 1000;
    this.store.set(key, e);
    return 1;
  }

  async ttl(key: string): Promise<number> {
    const e = this.store.get(key);
    if (!e) return -2;
    if (e.exp && Date.now() > e.exp) {
      this.store.delete(key);
      return -2;
    }
    if (!e.exp) return -1;
    return Math.max(0, Math.round((e.exp - Date.now()) / 1000));
  }

  async exists(...keys: string[]): Promise<number> {
    let count = 0;
    for (const k of keys) {
      const val = await this.get(k);
      if (val !== null) count++;
    }
    return count;
  }

  on(): void {}

  destroy(): void {
    if (this.sweepTimer) {
      clearInterval(this.sweepTimer);
      this.sweepTimer = null;
    }
    this.store.clear();
  }
}

class RedisConnection {
  private client: RedisLike;
  private fallback: InMemoryFallback;
  private isReal = false;
  private isConnected = false;

  constructor() {
    this.fallback = new InMemoryFallback();
    this.client = this.fallback;

    if (!env.REDIS_HOST) {
      return;
    }

    try {
      // Dynamic require to prevent crash if ioredis is absent
      const Redis = require("ioredis");
      const c = new Redis({
        host: env.REDIS_HOST,
        port: env.REDIS_PORT,
        password: env.REDIS_PASSWORD || undefined,
        retryStrategy: (times: number) => Math.min(times * 50, 2000),
        enableReadyCheck: false,
        maxRetriesPerRequest: 1,
        lazyConnect: true,
        connectTimeout: 2000,
      });

      c.on("error", (err: Error) => {
        logger.warn({ err }, "Redis error (in-memory fallback active)");
        this.isConnected = false;
      });

      c.on("connect", () => {
        logger.info("Redis connected successfully");
        this.isConnected = true;
      });

      c.on("close", () => {
        this.isConnected = false;
      });

      // Best-effort connect without blocking application boot
      c.connect()
        .then(() => {
          this.isReal = true;
          this.isConnected = true;
          this.client = c as RedisLike;
        })
        .catch(() => {
          logger.warn("Redis connection refused, running with in-memory fallback");
          this.client = this.fallback;
        });
    } catch {
      logger.warn("ioredis initialization failed, using in-memory fallback");
      this.client = this.fallback;
    }
  }

  getInstance(): RedisLike {
    // If real Redis disconnected, transparently route calls through in-memory fallback
    if (this.isReal && !this.isConnected) {
      return this.fallback;
    }
    return this.client;
  }

  isRealRedis(): boolean {
    return this.isReal && this.isConnected;
  }
}

export const redisConnection = new RedisConnection();

