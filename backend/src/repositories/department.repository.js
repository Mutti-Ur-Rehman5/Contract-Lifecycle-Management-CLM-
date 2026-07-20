import Department from '../models/Department.model.js';

const departmentRepository = {
  async create(data) {
    return Department.create(data);
  },
  async findById(id) {
    return Department.findById(id);
  },
  async findByOrganization(organizationId) {
    return Department.find({ organizationId }).sort({ name: 1 });
  },
  async updateById(id, update) {
    return Department.findByIdAndUpdate(id, update, { new: true });
  },
  async deleteById(id) {
    return Department.findByIdAndDelete(id);
  },
};

export default departmentRepository;
