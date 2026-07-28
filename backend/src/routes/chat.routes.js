import { Router } from 'express';
import authMiddleware from '../middleware/auth.middleware.js';
import tenantMiddleware from '../middleware/tenant.middleware.js';
import chatController from '../controllers/chat.controller.js';
import validate from '../middleware/validate.middleware.js';
import Joi from 'joi';

const router = Router();

router.use(authMiddleware, tenantMiddleware);

const startConversationSchema = Joi.object({
  userId: Joi.string().required(),
});

const sendMessageSchema = Joi.object({
  text: Joi.string().trim().min(1).max(5000).required(),
});

router.get('/conversations', chatController.getConversations);
router.post('/conversations', validate(startConversationSchema), chatController.startConversation);
router.get('/conversations/:id/messages', chatController.getMessages);
router.post('/conversations/:id/messages', validate(sendMessageSchema), chatController.sendMessage);
router.put('/conversations/:id/read', chatController.markRead);
router.get('/users', chatController.getOrgUsers);

export default router;
