import Obligation from '../models/Obligation.model.js';

const obligationRepository = {
  async create(data) {
    return Obligation.create(data);
  },
  async findById(id) {
    return Obligation.findById(id);
  },
  async findByContract(contractId) {
    return Obligation.find({ contractId });
  },
  async findByOrganization(organizationId, filters = {}) {
    return Obligation.find({ organizationId, ...filters });
  },
  async updateById(id, update) {
    return Obligation.findByIdAndUpdate(id, update, { new: true });
  },
};

export default obligationRepository;
