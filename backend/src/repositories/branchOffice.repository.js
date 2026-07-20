import BranchOffice from '../models/BranchOffice.model.js';

const branchOfficeRepository = {
  async create(data) {
    return BranchOffice.create(data);
  },
  async findById(id) {
    return BranchOffice.findById(id);
  },
  async findByOrganization(organizationId) {
    return BranchOffice.find({ organizationId }).sort({ name: 1 });
  },
  async updateById(id, update) {
    return BranchOffice.findByIdAndUpdate(id, update, { new: true });
  },
  async deleteById(id) {
    return BranchOffice.findByIdAndDelete(id);
  },
};

export default branchOfficeRepository;
