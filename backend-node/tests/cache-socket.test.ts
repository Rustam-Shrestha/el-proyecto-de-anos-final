import { InMemoryFallback } from '@/services/cache/redisClient';
import { CacheManager } from '@/services/cache/cacheManager';
import { socketCache } from '@/services/cache/socketCache';

describe('Robust Caching & Socket-Level Cache Tests', () => {
  describe('InMemoryFallback Engine', () => {
    let memCache: InMemoryFallback;

    beforeEach(() => {
      // Small maxEntries for easy testing of LRU behavior
      memCache = new InMemoryFallback(3);
    });

    afterEach(() => {
      memCache.destroy();
    });

    it('sets and gets items with LRU eviction', async () => {
      await memCache.set('k1', 'v1');
      await memCache.set('k2', 'v2');
      await memCache.set('k3', 'v3');

      // All 3 present
      expect(await memCache.get('k1')).toBe('v1');
      expect(await memCache.get('k2')).toBe('v2');
      expect(await memCache.get('k3')).toBe('v3');

      // Accessing k1 makes it most recently used, so k2 is now the oldest
      await memCache.get('k1');

      // Insert k4, should evict k2 (oldest)
      await memCache.set('k4', 'v4');

      expect(await memCache.get('k2')).toBeNull();
      expect(await memCache.get('k1')).toBe('v1');
      expect(await memCache.get('k3')).toBe('v3');
      expect(await memCache.get('k4')).toBe('v4');
    });

    it('handles TTL expiration properly', async () => {
      // 1-second TTL
      await memCache.setex('expiring', 1, 'alive');
      expect(await memCache.get('expiring')).toBe('alive');

      // Wait 1.1s
      await new Promise((resolve) => setTimeout(resolve, 1100));
      expect(await memCache.get('expiring')).toBeNull();
    });

    it('supports mget and mset', async () => {
      await memCache.mset({ a: '1', b: '2' });
      const values = await memCache.mget('a', 'b', 'nonexistent');
      expect(values).toEqual(['1', '2', null]);
    });

    it('supports atomic incr', async () => {
      const v1 = await memCache.incr('counter');
      expect(v1).toBe(1);
      const v2 = await memCache.incr('counter');
      expect(v2).toBe(2);
    });

    it('supports pattern-based key lookup', async () => {
      await memCache.set('user:101:profile', 'p1');
      await memCache.set('user:102:profile', 'p2');
      await memCache.set('order:999', 'o1');

      const userKeys = await memCache.keys('user:*:profile');
      expect(userKeys.sort()).toEqual(['user:101:profile', 'user:102:profile'].sort());
    });
  });

  describe('CacheManager Stampede Protection', () => {
    it('executes fallback only once during concurrent stampede (single-flight)', async () => {
      const cache = new CacheManager();
      let executionCount = 0;

      const expensiveOperation = async () => {
        executionCount++;
        await new Promise((r) => setTimeout(r, 50));
        return { data: 'computed_result', count: executionCount };
      };

      // 10 concurrent requests to the exact same key
      const key = `stampede:test:${Date.now()}`;
      const promises = Array.from({ length: 10 }).map(() =>
        cache.getOrSet(key, expensiveOperation, 60)
      );

      const results = await Promise.all(promises);

      // Verify all 10 received the exact same result
      expect(results).toHaveLength(10);
      for (const res of results) {
        expect(res).toEqual({ data: 'computed_result', count: 1 });
      }

      // Verify expensiveOperation only executed 1 time!
      expect(executionCount).toBe(1);
    });

    it('stores and retrieves JSON objects safely', async () => {
      const cache = new CacheManager();
      const key = `json:test:${Date.now()}`;
      const payload = { userId: 'u1', flags: [true, false], score: 98.6 };

      await cache.setJson(key, payload, 60);
      const retrieved = await cache.getJson<typeof payload>(key);

      expect(retrieved).toEqual(payload);
      await cache.delete(key);
      expect(await cache.getJson(key)).toBeNull();
    });

    it('invalidates patterns cleanly', async () => {
      const cache = new CacheManager();
      const prefix = `inv:${Date.now()}`;
      await cache.set(`${prefix}:1`, 'v1', 60);
      await cache.set(`${prefix}:2`, 'v2', 60);
      await cache.set(`other:${Date.now()}`, 'keep', 60);

      await cache.invalidatePattern(`${prefix}:*`);

      expect(await cache.get(`${prefix}:1`)).toBeNull();
      expect(await cache.get(`${prefix}:2`)).toBeNull();
    });
  });

  describe('Socket-Level Caching (socketCache)', () => {
    const testUserId = `user_socket_test_${Date.now()}`;

    it('caches verified token payloads to bypass crypto overhead', async () => {
      const rawToken = 'header.payload.signature_xyz';
      const userPayload = {
        id: testUserId,
        email: 'test@finguard.com',
        role: 'ADMIN',
      };

      // Cache token
      await socketCache.setCachedTokenPayload(rawToken, userPayload, 60);

      // Fast-path read
      const cached = await socketCache.getCachedTokenPayload(rawToken);
      expect(cached).toEqual(userPayload);

      // Random non-cached token
      const miss = await socketCache.getCachedTokenPayload('random.unknown.token');
      expect(miss).toBeNull();
    });

    it('tracks user presence and socket registrations', async () => {
      const socket1 = 'socket_abc_1';
      const socket2 = 'socket_abc_2';

      // Connect socket 1
      await socketCache.registerConnection(testUserId, socket1, {
        email: 'test@finguard.com',
        role: 'ADMIN',
      });

      expect(await socketCache.isUserOnline(testUserId)).toBe(true);
      let sockets = await socketCache.getUserSockets(testUserId);
      expect(sockets).toContain(socket1);

      // Connect socket 2
      await socketCache.registerConnection(testUserId, socket2);
      sockets = await socketCache.getUserSockets(testUserId);
      expect(sockets).toContain(socket1);
      expect(sockets).toContain(socket2);

      // Disconnect socket 1
      const res1 = await socketCache.unregisterConnection(testUserId, socket1);
      expect(res1.remainingSockets).toBe(1);
      expect(await socketCache.isUserOnline(testUserId)).toBe(true);

      // Disconnect socket 2
      const res2 = await socketCache.unregisterConnection(testUserId, socket2);
      expect(res2.remainingSockets).toBe(0);
      expect(await socketCache.isUserOnline(testUserId)).toBe(false);
    });

    it('caches and appends conversation messages', async () => {
      const convId = `conv_${Date.now()}`;

      const initial = [
        { role: 'user' as const, content: 'Hello', timestamp: new Date().toISOString() },
      ];
      await socketCache.setRecentMessages(convId, initial, 60);

      const cached = await socketCache.getRecentMessages(convId);
      expect(cached).toEqual(initial);

      // Append new message
      const nextMessage = {
        role: 'assistant' as const,
        content: 'Hi! How can I help?',
        timestamp: new Date().toISOString(),
      };
      await socketCache.appendMessage(convId, nextMessage);

      const updated = await socketCache.getRecentMessages(convId);
      expect(updated).toHaveLength(2);
      expect(updated?.[1].content).toBe('Hi! How can I help?');

      // Invalidate
      await socketCache.invalidateConversation(convId);
      expect(await socketCache.getRecentMessages(convId)).toBeNull();
    });

    it('applies socket rate limiting', async () => {
      const rateUser = `rate_test_${Date.now()}`;

      // Max 3 messages per window
      const check1 = await socketCache.checkRateLimit(rateUser, 'test', 3, 10);
      expect(check1.allowed).toBe(true);
      expect(check1.remaining).toBe(2);

      const check2 = await socketCache.checkRateLimit(rateUser, 'test', 3, 10);
      expect(check2.allowed).toBe(true);
      expect(check2.remaining).toBe(1);

      const check3 = await socketCache.checkRateLimit(rateUser, 'test', 3, 10);
      expect(check3.allowed).toBe(true);
      expect(check3.remaining).toBe(0);

      // 4th request exceeds limit
      const check4 = await socketCache.checkRateLimit(rateUser, 'test', 3, 10);
      expect(check4.allowed).toBe(false);
      expect(check4.remaining).toBe(0);
    });

    it('caches and invalidates unread notification counts', async () => {
      const notifUser = `notif_user_${Date.now()}`;

      await socketCache.setCachedUnreadCount(notifUser, 5, 60);
      expect(await socketCache.getCachedUnreadCount(notifUser)).toBe(5);

      await socketCache.invalidateUnreadCount(notifUser);
      expect(await socketCache.getCachedUnreadCount(notifUser)).toBeNull();
    });
  });
});
