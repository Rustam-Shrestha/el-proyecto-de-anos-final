import crypto from "crypto";
import { cacheManager } from "./cacheManager";
import { logger } from "@/config/logger";

export interface SocketUserPayload {
  id: string;
  email: string;
  role: string;
}

export interface CachedConversationMessage {
  role: "user" | "assistant" | "system";
  content: string;
  timestamp: string;
  senderId?: string;
  senderRole?: string;
}

export interface UserPresence {
  userId: string;
  socketIds: string[];
  online: boolean;
  lastSeen: string;
  email?: string;
  role?: string;
}

class SocketCacheService {
  private hashToken(token: string): string {
    return crypto.createHash("sha256").update(token).digest("hex").slice(0, 32);
  }

  // ==========================================
  // 1. Socket Authentication Token Cache
  // ==========================================

  /**
   * Fast-path retrieval of verified socket JWT payload.
   * Eliminates CPU-heavy crypto JWT verification during reconnect storms.
   */
  async getCachedTokenPayload(rawToken: string): Promise<SocketUserPayload | null> {
    try {
      const hash = this.hashToken(rawToken);
      return await cacheManager.getJson<SocketUserPayload>(`socket:auth:${hash}`);
    } catch {
      return null;
    }
  }

  /**
   * Cache verified token payload with short TTL (e.g. 120s)
   */
  async setCachedTokenPayload(rawToken: string, payload: SocketUserPayload, ttlSeconds = 120): Promise<void> {
    try {
      const hash = this.hashToken(rawToken);
      await cacheManager.setJson(`socket:auth:${hash}`, payload, ttlSeconds);
    } catch (err) {
      logger.warn({ err }, "Failed to cache socket token payload");
    }
  }

  // ==========================================
  // 2. User Presence & Socket Mapping Cache
  // ==========================================

  /**
   * Register an established socket connection for a user
   */
  async registerConnection(
    userId: string,
    socketId: string,
    meta?: { email?: string; role?: string }
  ): Promise<void> {
    try {
      const presenceKey = `socket:presence:${userId}`;
      const existing = await cacheManager.getJson<UserPresence>(presenceKey);

      const sockets = new Set<string>(existing?.socketIds ?? []);
      sockets.add(socketId);

      const presence: UserPresence = {
        userId,
        socketIds: Array.from(sockets),
        online: true,
        lastSeen: new Date().toISOString(),
        email: meta?.email || existing?.email,
        role: meta?.role || existing?.role,
      };

      // 24 hour TTL refreshed on every connection
      await cacheManager.setJson(presenceKey, presence, 86400);
      // Fast reverse index for socketId -> userId lookup
      await cacheManager.set(`socket:sid:${socketId}`, userId, 86400);
    } catch (err) {
      logger.warn({ err, userId, socketId }, "Failed to register socket connection in cache");
    }
  }

  /**
   * Unregister a disconnected socket. Updates presence to offline if no sockets remain.
   */
  async unregisterConnection(userId: string, socketId: string): Promise<{ remainingSockets: number }> {
    try {
      await cacheManager.delete(`socket:sid:${socketId}`);
      const presenceKey = `socket:presence:${userId}`;
      const existing = await cacheManager.getJson<UserPresence>(presenceKey);

      if (!existing) {
        return { remainingSockets: 0 };
      }

      const socketIds = existing.socketIds.filter((id) => id !== socketId);
      const isOnline = socketIds.length > 0;

      const updated: UserPresence = {
        ...existing,
        socketIds,
        online: isOnline,
        lastSeen: new Date().toISOString(),
      };

      if (isOnline) {
        await cacheManager.setJson(presenceKey, updated, 86400);
      } else {
        // Keep offline record with 1 hour TTL so peers can see "lastSeen"
        await cacheManager.setJson(presenceKey, updated, 3600);
      }

      return { remainingSockets: socketIds.length };
    } catch (err) {
      logger.warn({ err, userId, socketId }, "Failed to unregister socket connection in cache");
      return { remainingSockets: 0 };
    }
  }

  /**
   * Check if a specific user is currently online
   */
  async isUserOnline(userId: string): Promise<boolean> {
    try {
      const presence = await cacheManager.getJson<UserPresence>(`socket:presence:${userId}`);
      return Boolean(presence && presence.online && presence.socketIds.length > 0);
    } catch {
      return false;
    }
  }

  /**
   * Get all active socket IDs for a user
   */
  async getUserSockets(userId: string): Promise<string[]> {
    try {
      const presence = await cacheManager.getJson<UserPresence>(`socket:presence:${userId}`);
      return presence?.online ? presence.socketIds : [];
    } catch {
      return [];
    }
  }

  // ==========================================
  // 3. Conversation & Recent Chat History Cache
  // ==========================================

  /**
   * Get cached recent messages for a conversation
   */
  async getRecentMessages(conversationId: string): Promise<CachedConversationMessage[] | null> {
    try {
      return await cacheManager.getJson<CachedConversationMessage[]>(`socket:chat:recent:${conversationId}`);
    } catch {
      return null;
    }
  }

  /**
   * Set cached recent messages for a conversation (default TTL: 30 minutes)
   */
  async setRecentMessages(
    conversationId: string,
    messages: CachedConversationMessage[],
    ttlSeconds = 1800
  ): Promise<void> {
    try {
      await cacheManager.setJson(`socket:chat:recent:${conversationId}`, messages, ttlSeconds);
    } catch (err) {
      logger.warn({ err, conversationId }, "Failed to cache recent chat messages");
    }
  }

  /**
   * Append a message to the cached history without having to reload from DB
   */
  async appendMessage(
    conversationId: string,
    message: CachedConversationMessage,
    maxHistory = 50
  ): Promise<void> {
    try {
      const key = `socket:chat:recent:${conversationId}`;
      const existing = (await cacheManager.getJson<CachedConversationMessage[]>(key)) || [];
      const updated = [...existing, message].slice(-maxHistory);
      await cacheManager.setJson(key, updated, 1800);
    } catch (err) {
      logger.warn({ err, conversationId }, "Failed to append message to cache");
    }
  }

  /**
   * Invalidate conversation cache
   */
  async invalidateConversation(conversationId: string): Promise<void> {
    try {
      await cacheManager.delete(`socket:chat:recent:${conversationId}`);
    } catch (err) {
      logger.warn({ err, conversationId }, "Failed to invalidate conversation cache");
    }
  }

  // ==========================================
  // 4. Socket Rate Limiting & Anti-Spam Cache
  // ==========================================

  /**
   * Check rate limit for a socket/user using atomic sliding window counter.
   * Default: max 60 events per 60 seconds per user.
   */
  async checkRateLimit(
    identifier: string,
    action = "message",
    limit = 60,
    windowSeconds = 60
  ): Promise<{ allowed: boolean; remaining: number }> {
    try {
      const windowBucket = Math.floor(Date.now() / (windowSeconds * 1000));
      const key = `socket:ratelimit:${action}:${identifier}:${windowBucket}`;
      const current = await cacheManager.incr(key, windowSeconds + 5);

      const allowed = current <= limit;
      const remaining = Math.max(0, limit - current);

      return { allowed, remaining };
    } catch {
      // In case of cache error, fail open to avoid rejecting legitimate traffic
      return { allowed: true, remaining: 1 };
    }
  }

  // ==========================================
  // 5. Notification Unread Count Caching
  // ==========================================

  /**
   * Get cached unread notification count
   */
  async getCachedUnreadCount(userId: string): Promise<number | null> {
    try {
      const val = await cacheManager.get(`user:unread_notifs:${userId}`);
      return val !== null ? parseInt(val, 10) : null;
    } catch {
      return null;
    }
  }

  /**
   * Cache unread notification count
   */
  async setCachedUnreadCount(userId: string, count: number, ttlSeconds = 300): Promise<void> {
    try {
      await cacheManager.set(`user:unread_notifs:${userId}`, String(count), ttlSeconds);
    } catch (err) {
      logger.warn({ err, userId }, "Failed to cache unread notification count");
    }
  }

  /**
   * Invalidate unread notification count cache
   */
  async invalidateUnreadCount(userId: string): Promise<void> {
    try {
      await cacheManager.delete(`user:unread_notifs:${userId}`);
    } catch (err) {
      logger.warn({ err, userId }, "Failed to invalidate unread count cache");
    }
  }
}

export const socketCache = new SocketCacheService();
