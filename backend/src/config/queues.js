import { Queue } from 'bullmq';
import Redis from 'ioredis';
import './config.js'; // Ensure .env is loaded

const getRedisConnectionOptions = () => {
  const options = {
    maxRetriesPerRequest: null, // Critical setting for BullMQ
    retryStrategy(times) {
      // Back off retries to every 10 seconds to avoid spamming the console
      return 10000;
    }
  };

  // Auto-detect secure TLS connection
  const redisHost = process.env.REDIS_HOST || '';
  const redisUrl = process.env.REDIS_URL || '';
  const isSecurePort = Number(process.env.REDIS_PORT) === 6380;
  
  const isTls = process.env.REDIS_USE_TLS === 'true' || 
                redisUrl.startsWith('rediss://') ||
                redisHost.includes('cache.amazonaws.com') ||
                redisHost.includes('upstash.io') ||
                isSecurePort;

  if (isTls) {
    options.tls = {
      rejectUnauthorized: false
    };
  }

  return options;
};

const createRedisConnection = () => {
  const options = getRedisConnectionOptions();
  const redisUrl = process.env.REDIS_URL || '';

  if (redisUrl) {
    return new Redis(redisUrl, options);
  }

  return new Redis({
    host: process.env.REDIS_HOST || '127.0.0.1',
    port: Number(process.env.REDIS_PORT) || 6379,
    password: process.env.REDIS_PASSWORD || undefined,
    ...options
  });
};

export const redisConnection = createRedisConnection();

// Suppress unhandled connection error crash & log warning once
redisConnection.on('error', (err) => {
  if (err.code === 'ECONNREFUSED') {
    const now = Date.now();
    if (!redisConnection._lastLoggedError || now - redisConnection._lastLoggedError > 300000) {
      const host = process.env.REDIS_HOST || '127.0.0.1';
      const port = process.env.REDIS_PORT || 6379;
      console.warn(`⚠️ Redis is offline at ${host}:${port}. Background report queues will automatically connect once Redis is online.`);
      redisConnection._lastLoggedError = now;
    }
  } else {
    console.error('Redis connection error:', err);
  }
});

export const reportQueue = new Queue('ReportQueue', { connection: redisConnection });

// Handle BullMQ Queue error events to avoid process crashes
reportQueue.on('error', (err) => {
  // Silent fallback: redisConnection error handler manages console logging
});
