import notificationRepository from '../repositories/notification.repository.js';
import { notificationsQueue } from '../jobs/queues.js';

const STAGE_LABELS = {
  draft: 'Draft',
  internal_review: 'Internal Review',
  legal_review: 'Legal Review',
  finance_approval: 'Finance Approval',
  executive_approval: 'Executive Approval',
  pending_signature: 'Pending Signature',
  published: 'Published',
  archived: 'Archived',
  rejected: 'Rejected',
};

const notificationService = {
  async enqueueNotification(data) {
    return notificationsQueue.add('send-notification', data, {
      removeOnComplete: true,
      removeOnFail: 100,
    });
  },

  async createNotification({ organizationId, userId, type, title, message, relatedContractId }) {
    const notification = await notificationRepository.create({
      organizationId,
      userId,
      type,
      title,
      message,
      relatedContractId: relatedContractId || null,
      isRead: false,
    });

    const populated = await notification.populate('relatedContractId', 'title status type');

    return populated;
  },

  async getNotifications(organizationId, userId, { limit, skip } = {}) {
    return notificationRepository.findByUser(userId, organizationId, { limit, skip });
  },

  async getUnreadCount(organizationId, userId) {
    return notificationRepository.countUnread(userId, organizationId);
  },

  async markAsRead(id, userId) {
    return notificationRepository.markAsRead(id, userId);
  },

  async markAllAsRead(organizationId, userId) {
    return notificationRepository.markAllAsRead(userId, organizationId);
  },
};

export default notificationService;
