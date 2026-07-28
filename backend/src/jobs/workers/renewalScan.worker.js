import { Worker } from 'bullmq';
import redis from '../../config/redis.js';
import Contract from '../../models/Contract.model.js';
import notificationService from '../../services/notification.service.js';
import logger from '../../utils/logger.js';

const renewalWorker = new Worker(
  'renewal-scan',
  async (job) => {
    logger.info(`[Renewal Scan] Starting scan job ${job.id}`);

    const now = new Date();
    const in30 = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
    const in60 = new Date(now.getTime() + 60 * 24 * 60 * 60 * 1000);
    const in90 = new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000);

    const expiringContracts = await Contract.find({
      status: 'published',
      endDate: { $gte: now, $lte: in90 },
    }).select('title endDate organizationId ownerId');

    let notificationsSent = 0;

    for (const contract of expiringContracts) {
      const end = new Date(contract.endDate);
      const daysUntilEnd = Math.ceil((end - now) / (1000 * 60 * 60 * 24));

      const intervals = [
        { days: 30, label: '30 days' },
        { days: 60, label: '60 days' },
        { days: 90, label: '90 days' },
      ];

      for (const interval of intervals) {
        if (daysUntilEnd <= interval.days && daysUntilEnd > interval.days - 3) {
          try {
            await notificationService.createNotification({
              organizationId: contract.organizationId,
              userId: contract.ownerId,
              type: 'contract_expiring',
              title: `Contract expiring in ${interval.label}`,
              message: `"${contract.title}" expires on ${end.toLocaleDateString()} (${daysUntilEnd} days remaining)`,
              relatedContractId: contract._id,
            });
            notificationsSent++;
          } catch (err) {
            logger.error(`[Renewal Scan] Failed to send notification for contract ${contract._id}: ${err.message}`);
          }
        }
      }
    }

    const expiredContracts = await Contract.find({
      status: 'published',
      endDate: { $lt: now },
    }).select('title endDate organizationId ownerId');

    for (const contract of expiredContracts) {
      try {
        await Contract.findByIdAndUpdate(contract._id, { status: 'archived' });

        await notificationService.createNotification({
          organizationId: contract.organizationId,
          userId: contract.ownerId,
          type: 'contract_expired',
          title: 'Contract has expired',
          message: `"${contract.title}" expired on ${new Date(contract.endDate).toLocaleDateString()}. Status moved to archived.`,
          relatedContractId: contract._id,
        });
        notificationsSent++;
      } catch (err) {
        logger.error(`[Renewal Scan] Failed to archive contract ${contract._id}: ${err.message}`);
      }
    }

    logger.info(`[Renewal Scan] Completed. ${expiringContracts.length} expiring, ${expiredContracts.length} expired, ${notificationsSent} notifications sent.`);
    return { expiring: expiringContracts.length, expired: expiredContracts.length, notificationsSent };
  },
  { connection: redis, concurrency: 1 },
);

renewalWorker.on('completed', (job) => {
  logger.info(`[Renewal Scan] Job ${job.id} completed`);
});

renewalWorker.on('failed', (job, err) => {
  logger.error(`[Renewal Scan] Job ${job?.id} failed: ${err.message}`);
});

export default renewalWorker;
