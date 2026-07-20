import { Worker } from 'bullmq';
import redis from '../../config/redis.js';
import logger from '../../utils/logger.js';

const renewalWorker = new Worker(
  'renewal-scan',
  async (job) => {
    logger.info(`Processing renewal scan job ${job.id}`);
    return { status: 'completed' };
  },
  { connection: redis }
);

renewalWorker.on('completed', (job) => {
  logger.info(`Renewal scan job ${job.id} completed`);
});

renewalWorker.on('failed', (job, err) => {
  logger.error(`Renewal scan job ${job?.id} failed: ${err.message}`);
});

export default renewalWorker;
