import { renewalScanQueue } from '../queues.js';
import logger from '../../utils/logger.js';

const scheduleRenewalScan = async () => {
  await renewalScanQueue.add(
    'renewal-scan-daily',
    {},
    {
      repeat: { cron: '0 8 * * *' },
      removeOnComplete: true,
    }
  );
  logger.info('Renewal scan job scheduled (daily at 8am UTC)');
};

export default scheduleRenewalScan;
