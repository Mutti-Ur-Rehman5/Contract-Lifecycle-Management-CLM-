import { Worker } from 'bullmq';
import redis from '../../config/redis.js';
import logger from '../../utils/logger.js';

const notificationWorker = new Worker(
  'notifications',
  async (job) => {
    logger.info(`Processing notification job ${job.id}`);
    return { status: 'completed' };
  },
  { connection: redis }
);

notificationWorker.on('completed', (job) => {
  logger.info(`Notification job ${job.id} completed`);
});

notificationWorker.on('failed', (job, err) => {
  logger.error(`Notification job ${job?.id} failed: ${err.message}`);
});

export default notificationWorker;
