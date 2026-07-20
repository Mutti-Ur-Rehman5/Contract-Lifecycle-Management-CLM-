import eventBus from '../events/eventBus.js';

const registerEventListeners = () => {
  import('../events/listeners/onContractApproved.js');
  import('../events/listeners/onContractSigned.js');
  import('../events/listeners/onContractExpiring.js');
};

export default registerEventListeners;
