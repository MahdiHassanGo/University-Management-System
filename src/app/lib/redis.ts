import { Redis } from "ioredis";
import config from "../config/index.js";

let redisClient: Redis | null = null;
let isRedisConnected = false;

if (config.REDIS_URL) {
  try {
    redisClient = new Redis(config.REDIS_URL, {
      maxRetriesPerRequest: 1,
      retryStrategy: (times: number) => (times > 3 ? null : Math.min(times * 100, 2000)),
      lazyConnect: true,
    });

    redisClient.on("connect", () => {
      isRedisConnected = true;
    });

    redisClient.on("error", () => {
      isRedisConnected = false;
    });

    redisClient.connect().catch(() => {
      isRedisConnected = false;
    });
  } catch (_err) {
    isRedisConnected = false;
  }
}

// In-memory fallback cache when Redis server is unreachable or offline
const memoryCache = new Map<string, { value: string; expiresAt: number | null }>();

export const setCache = async (key: string, value: unknown, ttlSeconds?: number): Promise<void> => {
  const stringValue = JSON.stringify(value);

  if (redisClient && isRedisConnected) {
    try {
      if (ttlSeconds) {
        await redisClient.set(key, stringValue, "EX", ttlSeconds);
      } else {
        await redisClient.set(key, stringValue);
      }
      return;
    } catch (_err) {
      // Fallback to memory
    }
  }

  const expiresAt = ttlSeconds ? Date.now() + ttlSeconds * 1000 : null;
  memoryCache.set(key, { value: stringValue, expiresAt });
};

export const getCache = async <T>(key: string): Promise<T | null> => {
  if (redisClient && isRedisConnected) {
    try {
      const data = await redisClient.get(key);
      if (data) return JSON.parse(data) as T;
    } catch (_err) {
      // Fallback to memory
    }
  }

  const cached = memoryCache.get(key);
  if (!cached) return null;

  if (cached.expiresAt && Date.now() > cached.expiresAt) {
    memoryCache.delete(key);
    return null;
  }

  return JSON.parse(cached.value) as T;
};

export const clearCacheByPrefix = async (prefix: string): Promise<void> => {
  if (redisClient && isRedisConnected) {
    try {
      const keys = await redisClient.keys(`${prefix}*`);
      if (keys.length > 0) {
        await redisClient.del(...keys);
      }
    } catch (_err) {
      // Fallback to memory
    }
  }

  for (const key of memoryCache.keys()) {
    if (key.startsWith(prefix)) {
      memoryCache.delete(key);
    }
  }
};
