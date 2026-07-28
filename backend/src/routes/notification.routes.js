import { Router } from 'express';
import authMiddleware from '../middleware/auth.middleware.js';
import tenantMiddleware from '../middleware/tenant.middleware.js';
import notificationController from '../controllers/notification.controller.js';

const { getNotifications, getUnreadCount, markAsRead, markAllAsRead } = notificationController;

const router = Router();

router.use(authMiddleware, tenantMiddleware);

router.get('/', getNotifications);
router.get('/unread-count', getUnreadCount);
router.put('/read-all', markAllAsRead);
router.put('/:id/read', markAsRead);

export default router;
