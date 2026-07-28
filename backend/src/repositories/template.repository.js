import ContractTemplate from '../models/ContractTemplate.model.js';

const templateRepository = {
  async create(data) {
    return ContractTemplate.create(data);
  },
  async findById(id) {
    return ContractTemplate.findById(id);
  },
  async findByOrganization(organizationId) {
    return ContractTemplate.find({ organizationId }).sort({ name: 1 });
  },
  async findByOrganizationAndType(organizationId, contractType) {
    return ContractTemplate.find({ organizationId, contractType }).sort({ name: 1 });
  },
  async updateById(id, update) {
    return ContractTemplate.findByIdAndUpdate(id, update, { new: true });
  },
  async deleteById(id) {
    return ContractTemplate.findByIdAndDelete(id);
  },
};

export default templateRepository;
