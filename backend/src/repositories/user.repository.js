import User from '../models/User.model.js';

const userRepository = {
  async create(data) {
    return User.create(data);
  },
  async findById(id) {
    return User.findById(id);
  },
  async findByEmail(email) {
    return User.findOne({ email });
  },
  async findByOrganization(organizationId) {
    return User.find({ organizationId });
  },
  async updateById(id, update) {
    return User.findByIdAndUpdate(id, update, { new: true });
  },
};

export default userRepository;
