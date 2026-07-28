import { Worker } from 'bullmq';
import redis from '../../config/redis.js';
import pdfGeneratorService from '../../services/pdfGenerator.service.js';
import logger from '../../utils/logger.js';
import auditLogService from '../../services/auditLog.service.js';

const pdfWorker = new Worker(
  'pdf-generation',
  async (job) => {
    logger.info(`Processing PDF generation job ${job.id} for contract ${job.data.contractId}`);
    const result = await pdfGeneratorService.generatePdf(job.data.contractId);

    await auditLogService.log({
      organizationId: job.data.organizationId,
      userId: job.data.userId,
      action: 'pdf.generated',
      entityType: 'Contract',
      entityId: job.data.contractId,
      metadata: { versionNumber: result.versionNumber, pdfUrl: result.pdfUrl },
    });

    return { status: 'completed', ...result };
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
