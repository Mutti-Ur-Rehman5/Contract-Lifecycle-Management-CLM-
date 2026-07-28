import eventBus from '../eventBus.js';
import logger from '../../utils/logger.js';

eventBus.on('workflow.submitted', (data) => {
  logger.info(`Contract ${data.contractId} submitted for approval, stage: ${data.stageKey}`);
});

eventBus.on('workflow.stage_changed', (data) => {
  logger.info(`Contract ${data.contractId} moved: ${data.previousStage} -> ${data.newStage}`);
});

eventBus.on('workflow.completed', (data) => {
  logger.info(`Contract ${data.contractId} fully approved`);
});

eventBus.on('workflow.rejected', (data) => {
  logger.info(`Contract ${data.contractId} rejected at stage: ${data.stageKey}`);
});

eventBus.on('workflow.requested_changes', (data) => {
  logger.info(`Contract ${data.contractId} changes requested`);
});

eventBus.on('signature.requests_created', (data) => {
  logger.info(`Signature requests created for contract ${data.contractId} (${data.count} signatories)`);
});

eventBus.on('contract.signed', (data) => {
  logger.info(`Contract ${data.contractId} signed by ${data.signerName || data.signerId}`);
});

eventBus.on('signature.declined', (data) => {
  logger.info(`Contract ${data.contractId} signature declined by user ${data.signerId}`);
});

eventBus.on('contract.signatures_completed', (data) => {
  logger.info(`All signatures complete for contract ${data.contractId} — auto-advancing`);
});

eventBus.on('contract.expiring', (data) => {
  logger.info(`Contract ${data.contractId} is expiring on: ${data.endDate}`);
});
