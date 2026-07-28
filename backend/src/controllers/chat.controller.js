import chatService from '../services/chat.service.js';
import { successResponse } from '../utils/apiResponse.js';
import asyncHandler from '../utils/asyncHandler.js';

const chatController = {
  getConversations: asyncHandler(async (req, res) => {
    const result = await chatService.getConversations(req.user.id);
    return successResponse(res, result);
  }),

  startConversation: asyncHandler(async (req, res) => {
    const result = await chatService.startConversation(req.user.id, req.body.userId);
    return successResponse(res, result);
  }),

  getMessages: asyncHandler(async (req, res) => {
    const { limit, before } = req.query;
    const result = await chatService.getMessages(
      req.params.id,
      req.user.id,
      { limit: limit ? parseInt(limit) : 50, before }
    );
    return successResponse(res, result);
  }),

  sendMessage: asyncHandler(async (req, res) => {
    const result = await chatService.sendMessage(
      req.params.id,
      req.user.id,
      req.body.text
    );
    return successResponse(res, result);
  }),

  markRead: asyncHandler(async (req, res) => {
    await chatService.markRead(req.params.id, req.user.id);
    return successResponse(res, null, 'Marked as read');
  }),

  getOrgUsers: asyncHandler(async (req, res) => {
    const result = await chatService.getOrgUsers(req.user.id, req.organizationId);
    return successResponse(res, result);
  }),
};

export default chatController;
