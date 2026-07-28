import notificationService from '../services/notification.service.js';
import { successResponse } from '../utils/apiResponse.js';
import asyncHandler from '../utils/asyncHandler.js';

const notificationController = {
  getNotifications: asyncHandler(async (req, res) => {
    const { limit, skip } = req.query;
    const result = await notificationService.getNotifications(
      req.organizationId,
      req.user.id,
      { limit: limit ? parseInt(limit) : 50, skip: skip ? parseInt(skip) : 0 }
    );
    return successResponse(res, result);
  }),

  getUnreadCount: asyncHandler(async (req, res) => {
    const count = await notificationService.getUnreadCount(req.organizationId, req.user.id);
    return successResponse(res, { count });
  }),

  markAsRead: asyncHandler(async (req, res) => {
    const result = await notificationService.markAsRead(req.params.id, req.user.id);
    if (!result) {
      return res.status(404).json({ success: false, error: { message: 'Notification not found' } });
    }
    return successResponse(res, result, 'Notification marked as read');
  }),

  markAllAsRead: asyncHandler(async (req, res) => {
    await notificationService.markAllAsRead(req.organizationId, req.user.id);
    return successResponse(res, null, 'All notifications marked as read');
  }),
};

export default notificationController;
