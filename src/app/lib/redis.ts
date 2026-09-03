// In-memory fallback cache when Redis server is unreachable or offline
const memoryCache = new Map<string, { value: string; expiresAt: number | null }>();

export const setCache = async (key: string, value: unknown, ttlSeconds?: number): Promise<void> => {
  try {
    const stringValue = JSON.stringify(value);
    const expiresAt = ttlSeconds ? Date.now() + ttlSeconds * 1000 : null;
    memoryCache.set(key, { value: stringValue, expiresAt });
  } catch (_err) {
    // Silent fallback
  }
};

export const getCache = async <T>(key: string): Promise<T | null> => {
  try {
    const cached = memoryCache.get(key);
    if (!cached) return null;

    if (cached.expiresAt && Date.now() > cached.expiresAt) {
      memoryCache.delete(key);
      return null;
    }

    return JSON.parse(cached.value) as T;
  } catch (_err) {
    return null;
  }
};

export const clearCacheByPrefix = async (prefix: string): Promise<void> => {
  try {
    for (const key of memoryCache.keys()) {
      if (key.startsWith(prefix)) {
        memoryCache.delete(key);
      }
    }
  } catch (_err) {
    // Silent fallback
  }
};
