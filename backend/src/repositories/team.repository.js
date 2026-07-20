import Team from '../models/Team.model.js';

const teamRepository = {
  async create(data) {
    return Team.create(data);
  },
  async findById(id) {
    return Team.findById(id);
  },
  async findByOrganization(organizationId) {
    return Team.find({ organizationId }).sort({ name: 1 });
  },
  async findByDepartment(departmentId) {
    return Team.find({ departmentId }).sort({ name: 1 });
  },
  async updateById(id, update) {
    return Team.findByIdAndUpdate(id, update, { new: true });
  },
  async deleteById(id) {
    return Team.findByIdAndDelete(id);
  },
};

export default teamRepository;
