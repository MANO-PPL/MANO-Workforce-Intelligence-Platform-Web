import Redis from 'ioredis';
import '../../config/config.js'; // Ensure env variables are loaded

const REDIS_CONFIG = {
  host: process.env.REDIS_HOST || '127.0.0.1',
  port: Number(process.env.REDIS_PORT) || 6379,
  password: process.env.REDIS_PASSWORD || undefined,
};

let cacheRedis;

try {
  cacheRedis = new Redis(REDIS_CONFIG);
  cacheRedis.on('error', (err) => {
    console.error('⚠ [Cache] Redis connection error:', err.message);
  });
  cacheRedis.on('connect', () => {
    console.log('⚡ [Cache] Connected to Redis caching instance');
  });
} catch (err) {
  console.error('⚠ [Cache] Failed to initialize Redis client:', err);
  cacheRedis = null;
}

export const cacheService = {
  /**
   * Get parsed JSON value from cache
   */
  async get(key) {
    if (!cacheRedis || cacheRedis.status !== 'ready') return null;
    try {
      const data = await cacheRedis.get(key);
      return data ? JSON.parse(data) : null;
    } catch (err) {
      console.error(`[Cache] Get error for key "${key}":`, err);
      return null; // Fallback to DB query
    }
  },

  /**
   * Set JSON value in cache with a TTL (defaults to 24 hours)
   */
  async set(key, value, ttl = 86400) {
    if (!cacheRedis || cacheRedis.status !== 'ready') return;
    try {
      await cacheRedis.set(key, JSON.stringify(value), 'EX', ttl);
    } catch (err) {
      console.error(`[Cache] Set error for key "${key}":`, err);
    }
  },

  /**
   * Delete a key from cache (invalidation)
   */
  async del(key) {
    if (!cacheRedis || cacheRedis.status !== 'ready') return;
    try {
      await cacheRedis.del(key);
      console.log(`🧹 [Cache] Invalidated cache key "${key}"`);
    } catch (err) {
      console.error(`[Cache] Delete error for key "${key}":`, err);
    }
  }
};
