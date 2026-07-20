import Contract from '../models/Contract.model.js';

const contractRepository = {
  async create(data) {
    return Contract.create(data);
  },
  async findById(id) {
    return Contract.findById(id);
  },
  async findByOrganization(organizationId, filters = {}) {
    return Contract.find({ organizationId, ...filters });
  },
  async updateById(id, update) {
    return Contract.findByIdAndUpdate(id, update, { new: true });
  },
  async deleteById(id) {
    return Contract.findByIdAndDelete(id);
  },
};

export default contractRepository;
