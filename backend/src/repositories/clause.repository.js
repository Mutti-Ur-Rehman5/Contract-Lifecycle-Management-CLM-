import Clause from '../models/Clause.model.js';

const clauseRepository = {
  async create(data) {
    return Clause.create(data);
  },
  async findById(id) {
    return Clause.findById(id);
  },
  async findByOrganization(organizationId) {
    return Clause.find({ organizationId }).sort({ title: 1 });
  },
  async findByCategory(organizationId, category) {
    return Clause.find({ organizationId, category }).sort({ title: 1 });
  },
  async updateById(id, update) {
    return Clause.findByIdAndUpdate(id, update, { new: true });
  },
  async deleteById(id) {
    return Clause.findByIdAndDelete(id);
  },
};

export default clauseRepository;
