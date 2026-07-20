import eventBus from '../eventBus.js';
import logger from '../../utils/logger.js';

eventBus.on('contract.signed', (data) => {
  logger.info(`Contract ${data.contractId} signed by ${data.signerId}`);
});
