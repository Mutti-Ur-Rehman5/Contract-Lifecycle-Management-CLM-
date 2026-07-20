import Redis from 'ioredis';
import config from './env.js';
import logger from '../utils/logger.js';

const redis = new Redis({
  host: config.redis.host,
  port: config.redis.port,
  maxRetriesPerRequest: null,
});

redis.on('connect', () => {
  logger.info('Redis connected');
});

redis.on('error', (err) => {
  logger.error(`Redis error: ${err.message}`);
});

redis.on('disconnected', () => {
  logger.warn('Redis disconnected');
});

export default redis;
