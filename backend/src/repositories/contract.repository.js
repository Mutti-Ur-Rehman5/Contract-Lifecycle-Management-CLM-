import Contract from '../models/Contract.model.js';

const contractRepository = {
  async create(data) {
    return Contract.create(data);
  },
  async findById(id) {
    return Contract.findById(id)
      .populate('ownerId', 'name email')
      .populate('currentVersionId')
      .populate('templateId', 'name');
  },
  async findByIdRaw(id) {
    return Contract.findById(id);
  },
  async findByOrganization(organizationId, filters = {}) {
    const query = { organizationId, ...filters };
    return Contract.find(query)
      .populate('ownerId', 'name email')
      .populate('currentVersionId', 'versionNumber')
      .sort({ updatedAt: -1 });
  },
  async findByOrganizationPaginated(organizationId, { type, status, search, page = 1, limit = 20 }) {
    const query = { organizationId };
    if (type) query.type = type;
    if (status) query.status = status;
    if (search) query.title = { $regex: search, $options: 'i' };

    const skip = (page - 1) * limit;
    const [data, total] = await Promise.all([
      Contract.find(query)
        .populate('ownerId', 'name email')
        .populate('currentVersionId', 'versionNumber')
        .sort({ updatedAt: -1 })
        .skip(skip)
        .limit(limit),
      Contract.countDocuments(query),
    ]);
    return { data, total, page, pages: Math.ceil(total / limit) };
  },
  async updateById(id, update) {
    return Contract.findByIdAndUpdate(id, update, { new: true });
  },
  async deleteById(id) {
    return Contract.findByIdAndDelete(id);
  },
};

export default contractRepository;
