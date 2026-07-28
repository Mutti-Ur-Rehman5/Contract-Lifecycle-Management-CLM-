import Redis from 'ioredis';
import config from './env.js';
import logger from '../utils/logger.js';

const redis = new Redis({
  host: config.redis.host,
  port: config.redis.port,
  maxRetriesPerRequest: null,
  retryStrategy(times) {
    if (times > 3) return null;
    return Math.min(times * 2000, 10000);
  },
  enableReadyCheck: false,
});

redis.on('connect', () => {
  logger.info('Redis connected');
});

let lastErrorLog = 0;
redis.on('error', (err) => {
  const now = Date.now();
  if (now - lastErrorLog > 10000) {
    logger.error(`Redis error: ${err.message}`);
    lastErrorLog = now;
  }
});

redis.on('disconnected', () => {
  logger.warn('Redis disconnected');
});

export default redis;
