import { Queue } from 'bullmq';
import Redis from 'ioredis';
import './config.js'; // Ensure .env is loaded

const REDIS_CONFIG = {
  host: process.env.REDIS_HOST || '127.0.0.1',
  port: Number(process.env.REDIS_PORT) || 6379,
  password: process.env.REDIS_PASSWORD || undefined,
  maxRetriesPerRequest: null, // Critical setting for BullMQ
};

export const redisConnection = new Redis(REDIS_CONFIG);

export const reportQueue = new Queue('ReportQueue', { connection: redisConnection });
