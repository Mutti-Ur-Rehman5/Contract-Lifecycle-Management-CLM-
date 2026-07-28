import axiosClient from '../../lib/axiosClient.js';

export const notificationApi = {
  getNotifications: (limit = 50, skip = 0) =>
    axiosClient.get('/notifications', { params: { limit, skip } }),
  getUnreadCount: () => axiosClient.get('/notifications/unread-count'),
  markAsRead: (id) => axiosClient.put(`/notifications/${id}/read`),
  markAllAsRead: () => axiosClient.put('/notifications/read-all'),
};
