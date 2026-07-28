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
    return Obligation.find({ organizationId, ...filters })
      .populate('contractId', 'title')
      .sort({ createdAt: -1 });
  },
  async updateById(id, update) {
    return Obligation.findByIdAndUpdate(id, update, { new: true });
  },
  async deleteById(id) {
    return Obligation.findByIdAndDelete(id);
  },
  async countByOrganization(organizationId) {
    return Obligation.countDocuments({ organizationId });
  },
  async countByStatus(organizationId, status) {
    return Obligation.countDocuments({ organizationId, status });
  },
  async countOverdue(organizationId) {
    return Obligation.countDocuments({
      organizationId,
      status: 'pending',
      dueDate: { $lt: new Date() },
    });
  },
  async countUpcoming(organizationId, days = 30) {
    const now = new Date();
    const future = new Date();
    future.setDate(future.getDate() + days);
    return Obligation.countDocuments({
      organizationId,
      status: 'pending',
      dueDate: { $gte: now, $lte: future },
    });
  },
  async findOverdue(organizationId) {
    return Obligation.find({
      organizationId,
      status: 'pending',
      dueDate: { $lt: new Date() },
    }).populate('contractId', 'title');
  },
  async markOverdueBulk(organizationId) {
    return Obligation.updateMany(
      { organizationId, status: 'pending', dueDate: { $lt: new Date() } },
      { $set: { status: 'overdue' } },
    );
  },
};

export default obligationRepository;
