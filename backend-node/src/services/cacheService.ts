import { redisClient } from "@config/redis";
import { logger } from "@config/logger";

// Cache key prefixes
const CACHE_KEYS = {
  REFRESH_TOKEN: "refresh_token",
  ACCESS_TOKEN_BLACKLIST: "access_token_blacklist",
  USER: "user",
  SESSION: "session",
  RATE_LIMIT: "rate_limit",
  EMAIL_VERIFICATION: "email_verification",
  PASSWORD_RESET: "password_reset"
};

/**
 * Store refresh token in Redis
 * @param userId User ID
 * @param token Refresh token
 * @param expiresInSeconds Token expiration time in seconds (default: 7 days)
 */
export const storeRefreshToken = async (
  userId: string,
  token: string,
  expiresInSeconds: number = 7 * 24 * 60 * 60
) => {
  try {
    const key = `${CACHE_KEYS.REFRESH_TOKEN}:${userId}`;
    await redisClient.setEx(key, expiresInSeconds, token);
    logger.debug({ userId }, "Refresh token stored");
  } catch (error) {
    logger.error({ err: error, userId }, "Error storing refresh token");
    throw error;
  }
};

/**
 * Get refresh token from Redis
 * @param userId User ID
 */
export const getRefreshToken = async (userId: string): Promise<string | null> => {
  try {
    const key = `${CACHE_KEYS.REFRESH_TOKEN}:${userId}`;
    const token = await redisClient.get(key);
    return token;
  } catch (error) {
    logger.error({ err: error, userId }, "Error getting refresh token");
    return null;
  }
};

/**
 * Invalidate refresh token
 * @param userId User ID
 */
export const invalidateRefreshToken = async (userId: string) => {
  try {
    const key = `${CACHE_KEYS.REFRESH_TOKEN}:${userId}`;
    await redisClient.del(key);
    logger.debug({ userId }, "Refresh token invalidated");
  } catch (error) {
    logger.error({ err: error, userId }, "Error invalidating refresh token");
  }
};

/**
 * Blacklist an access token
 * @param token Access token
 * @param expiresInSeconds Token expiration time in seconds
 */
export const blacklistAccessToken = async (token: string, expiresInSeconds: number) => {
  try {
    const key = `${CACHE_KEYS.ACCESS_TOKEN_BLACKLIST}:${token}`;
    await redisClient.setEx(key, expiresInSeconds, "1");
    logger.debug("Access token blacklisted");
  } catch (error) {
    logger.error({ err: error }, "Error blacklisting access token");
  }
};

/**
 * Check if access token is blacklisted
 * @param token Access token
 */
export const isAccessTokenBlacklisted = async (token: string): Promise<boolean> => {
  try {
    const key = `${CACHE_KEYS.ACCESS_TOKEN_BLACKLIST}:${token}`;
    const value = await redisClient.get(key);
    return value !== null;
  } catch (error) {
    logger.error({ err: error }, "Error checking token blacklist");
    return false;
  }
};

/**
 * Cache user data
 * @param userId User ID
 * @param userData User data object
 * @param expiresInSeconds Cache expiration time in seconds (default: 1 hour)
 */
export const cacheUser = async (
  userId: string,
  userData: Record<string, any>,
  expiresInSeconds: number = 60 * 60
) => {
  try {
    const key = `${CACHE_KEYS.USER}:${userId}`;
    await redisClient.setEx(key, expiresInSeconds, JSON.stringify(userData));
    logger.debug({ userId }, "User cached");
  } catch (error) {
    logger.error({ err: error, userId }, "Error caching user");
  }
};

/**
 * Get cached user data
 * @param userId User ID
 */
export const getCachedUser = async (
  userId: string
): Promise<Record<string, any> | null> => {
  try {
    const key = `${CACHE_KEYS.USER}:${userId}`;
    const data = await redisClient.get(key);
    return data ? JSON.parse(data) : null;
  } catch (error) {
    logger.error({ err: error, userId }, "Error getting cached user");
    return null;
  }
};

/**
 * Invalidate user cache
 * @param userId User ID
 */
export const invalidateUserCache = async (userId: string) => {
  try {
    const key = `${CACHE_KEYS.USER}:${userId}`;
    await redisClient.del(key);
    logger.debug({ userId }, "User cache invalidated");
  } catch (error) {
    logger.error({ err: error, userId }, "Error invalidating user cache");
  }
};

/**
 * Increment rate limit counter
 * @param identifier Unique identifier (IP, user ID, etc.)
 * @param windowSeconds Rate limit window in seconds (default: 60)
 * @param maxRequests Maximum requests allowed (default: 100)
 */
export const checkRateLimit = async (
  identifier: string,
  windowSeconds: number = 60,
  maxRequests: number = 100
): Promise<{ allowed: boolean; remaining: number; resetTime: number }> => {
  try {
    const key = `${CACHE_KEYS.RATE_LIMIT}:${identifier}`;
    const current = await redisClient.incr(key);

    if (current === 1) {
      await redisClient.expire(key, windowSeconds);
    }

    const ttl = await redisClient.ttl(key);

    return {
      allowed: current <= maxRequests,
      remaining: Math.max(0, maxRequests - current),
      resetTime: ttl || windowSeconds
    };
  } catch (error) {
    logger.error({ err: error, identifier }, "Error checking rate limit");
    return { allowed: true, remaining: maxRequests, resetTime: 0 };
  }
};

/**
 * Store email verification code
 * @param email Email address
 * @param code Verification code
 * @param expiresInSeconds Expiration time in seconds (default: 15 minutes)
 */
export const storeEmailVerification = async (
  email: string,
  code: string,
  expiresInSeconds: number = 15 * 60
) => {
  try {
    const key = `${CACHE_KEYS.EMAIL_VERIFICATION}:${email}`;
    await redisClient.setEx(key, expiresInSeconds, code);
    logger.debug({ email }, "Email verification code stored");
  } catch (error) {
    logger.error({ err: error, email }, "Error storing email verification");
    throw error;
  }
};

/**
 * Get and validate email verification code
 * @param email Email address
 * @param code Verification code to validate
 */
export const validateEmailVerification = async (
  email: string,
  code: string
): Promise<boolean> => {
  try {
    const key = `${CACHE_KEYS.EMAIL_VERIFICATION}:${email}`;
    const storedCode = await redisClient.get(key);

    if (storedCode === code) {
      await redisClient.del(key); // Delete after validation
      logger.debug({ email }, "Email verification successful");
      return true;
    }

    return false;
  } catch (error) {
    logger.error({ err: error, email }, "Error validating email verification");
    return false;
  }
};

/**
 * Store password reset token
 * @param email Email address
 * @param token Reset token
 * @param expiresInSeconds Expiration time in seconds (default: 1 hour)
 */
export const storePasswordResetToken = async (
  email: string,
  token: string,
  expiresInSeconds: number = 60 * 60
) => {
  try {
    const key = `${CACHE_KEYS.PASSWORD_RESET}:${email}`;
    await redisClient.setEx(key, expiresInSeconds, token);
    logger.debug({ email }, "Password reset token stored");
  } catch (error) {
    logger.error({ err: error, email }, "Error storing password reset token");
    throw error;
  }
};

/**
 * Get and validate password reset token
 * @param email Email address
 * @param token Reset token to validate
 */
export const validatePasswordResetToken = async (
  email: string,
  token: string
): Promise<boolean> => {
  try {
    const key = `${CACHE_KEYS.PASSWORD_RESET}:${email}`;
    const storedToken = await redisClient.get(key);

    if (storedToken === token) {
      await redisClient.del(key); // Delete after validation
      logger.debug({ email }, "Password reset token validated");
      return true;
    }

    return false;
  } catch (error) {
    logger.error({ err: error, email }, "Error validating password reset token");
    return false;
  }
};

/**
 * Generic cache get
 * @param key Cache key
 */
export const cacheGet = async (key: string): Promise<string | null> => {
  try {
    return await redisClient.get(key);
  } catch (error) {
    logger.error({ err: error, key }, "Error getting cache");
    return null;
  }
};

/**
 * Generic cache set
 * @param key Cache key
 * @param value Cache value
 * @param expiresInSeconds Expiration time in seconds
 */
export const cacheSet = async (
  key: string,
  value: string | Record<string, any>,
  expiresInSeconds: number = 600
) => {
  try {
    const stringValue = typeof value === "string" ? value : JSON.stringify(value);
    await redisClient.setEx(key, expiresInSeconds, stringValue);
  } catch (error) {
    logger.error({ err: error, key }, "Error setting cache");
  }
};

/**
 * Generic cache delete
 * @param key Cache key
 */
export const cacheDel = async (key: string) => {
  try {
    await redisClient.del(key);
  } catch (error) {
    logger.error({ err: error, key }, "Error deleting cache");
  }
};
