import { Worker } from 'bullmq';
import redis from '../../config/redis.js';
import notificationService from '../../services/notification.service.js';
import logger from '../../utils/logger.js';

let io = null;

export function setSocketIO(socketIO) {
  io = socketIO;
}

const notificationWorker = new Worker(
  'notifications',
  async (job) => {
    const { organizationId, userId, type, title, message, relatedContractId } = job.data;

    console.log(`[Redis/BullMQ] Processing notification job ${job.id} for user ${userId} — type: ${type}`);
    logger.info(`[Redis/BullMQ] Processing notification job ${job.id} for user ${userId} — type: ${type}`);

    const notification = await notificationService.createNotification({
      organizationId,
      userId,
      type,
      title,
      message,
      relatedContractId,
    });

    if (io) {
      const userRoom = `user:${userId}`;
      io.to(userRoom).emit('notification:new', {
        _id: notification._id,
        organizationId: notification.organizationId,
        userId: notification.userId,
        type: notification.type,
        title: notification.title,
        message: notification.message,
        relatedContractId: notification.relatedContractId,
        isRead: notification.isRead,
        createdAt: notification.createdAt,
      });
      console.log(`[Redis/BullMQ] Emitted notification:new to user ${userId}`);
      logger.info(`[Redis/BullMQ] Emitted notification:new to user ${userId}`);
    }

    return { status: 'completed', notificationId: notification._id };
  },
  { connection: redis }
);

notificationWorker.on('completed', (job) => {
  console.log(`[Redis/BullMQ] Notification job ${job.id} completed successfully`);
  logger.info(`[Redis/BullMQ] Notification job ${job.id} completed`);
});

notificationWorker.on('failed', (job, err) => {
  console.error(`[Redis/BullMQ] Notification job ${job?.id} FAILED: ${err.message}`);
  logger.error(`[Redis/BullMQ] Notification job ${job?.id} failed: ${err.message}`);
});

export default notificationWorker;
