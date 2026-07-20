import { Worker } from 'bullmq';
import redis from '../../config/redis.js';
import logger from '../../utils/logger.js';

const pdfWorker = new Worker(
  'pdf-generation',
  async (job) => {
    logger.info(`Processing PDF generation job ${job.id} for contract ${job.data.contractId}`);
    return { status: 'completed' };
  },
  { connection: redis }
);

pdfWorker.on('completed', (job) => {
  logger.info(`PDF job ${job.id} completed`);
});

pdfWorker.on('failed', (job, err) => {
  logger.error(`PDF job ${job?.id} failed: ${err.message}`);
});

export default pdfWorker;
