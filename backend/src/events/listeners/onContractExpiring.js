import eventBus from '../eventBus.js';
import logger from '../../utils/logger.js';

eventBus.on('contract.expiring', (data) => {
  logger.warn(`Contract ${data.contractId} expiring soon: ${data.endDate}`);
});
