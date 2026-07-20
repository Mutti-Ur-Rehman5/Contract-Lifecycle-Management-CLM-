import Organization from '../models/Organization.model.js';

const organizationRepository = {
  async create(data) {
    return Organization.create(data);
  },
  async findById(id) {
    return Organization.findById(id);
  },
  async findBySlug(slug) {
    return Organization.findOne({ slug });
  },
  async updateById(id, update) {
    return Organization.findByIdAndUpdate(id, update, { new: true });
  },
  async deleteById(id) {
    return Organization.findByIdAndDelete(id);
  },
};

export default organizationRepository;
