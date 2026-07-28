import Notification from '../models/Notification.model.js';

const notificationRepository = {
  async create(data) {
    return Notification.create(data);
  },

  async createMany(notifications) {
    return Notification.insertMany(notifications);
  },

  async findByUser(userId, organizationId, { limit = 50, skip = 0 } = {}) {
    return Notification.find({ userId, organizationId })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('relatedContractId', 'title status type');
  },

  async countUnread(userId, organizationId) {
    return Notification.countDocuments({ userId, organizationId, isRead: false });
  },

  async markAsRead(id, userId) {
    return Notification.findOneAndUpdate(
      { _id: id, userId },
      { isRead: true },
      { new: true }
    );
  },

  async markAllAsRead(userId, organizationId) {
    return Notification.updateMany(
      { userId, organizationId, isRead: false },
      { isRead: true }
    );
  },
};

export default notificationRepository;
