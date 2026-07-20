import eventBus from '../eventBus.js';
import logger from '../../utils/logger.js';

eventBus.on('contract.approved', (data) => {
  logger.info(`Contract ${data.contractId} approved at stage: ${data.stageKey}`);
});

eventBus.on('contract.rejected', (data) => {
  logger.info(`Contract ${data.contractId} rejected at stage: ${data.stageKey}`);
});

eventBus.on('contract.stage_changed', (data) => {
  logger.info(`Contract ${data.contractId} moved to stage: ${data.newStage}`);
});

eventBus.on('contract.signed', (data) => {
  logger.info(`Contract ${data.contractId} signed by user: ${data.signerId}`);
});

eventBus.on('contract.expiring', (data) => {
  logger.info(`Contract ${data.contractId} is expiring on: ${data.endDate}`);
});
