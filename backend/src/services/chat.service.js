import chatRepository from '../repositories/chat.repository.js';
import User from '../models/User.model.js';

const chatService = {
  async getConversations(userId) {
    const conversations = await chatRepository.getConversations(userId);
    return conversations.map((conv) => {
      const obj = conv.toObject();
      obj.unread = obj.unreadCount?.get(userId.toString()) || 0;
      delete obj.unreadCount;
      return obj;
    });
  },

  async startConversation(currentUserId, otherUserId) {
    if (currentUserId === otherUserId) {
      const err = new Error('Cannot start a conversation with yourself');
      err.statusCode = 400;
      throw err;
    }

    const otherUser = await User.findById(otherUserId).select('name email profilePicture role');
    if (!otherUser) {
      const err = new Error('User not found');
      err.statusCode = 404;
      throw err;
    }

    let conversation = await chatRepository.findConversation(currentUserId, otherUserId);

    if (!conversation) {
      conversation = await chatRepository.createConversation(currentUserId, otherUserId);
    }

    const populated = await chatRepository.getConversationById(conversation._id);
    const obj = populated.toObject();
    obj.unread = obj.unreadCount?.get(currentUserId.toString()) || 0;
    delete obj.unreadCount;
    return obj;
  },

  async getMessages(conversationId, userId, { limit, before } = {}) {
    const conv = await chatRepository.getConversationById(conversationId);
    if (!conv) {
      const err = new Error('Conversation not found');
      err.statusCode = 404;
      throw err;
    }

    const isParticipant = conv.participants.some(
      (p) => p._id.toString() === userId
    );
    if (!isParticipant) {
      const err = new Error('Access denied');
      err.statusCode = 403;
      throw err;
    }

    return chatRepository.getMessages(conversationId, { limit, before });
  },

  async sendMessage(conversationId, senderId, text) {
    const conv = await chatRepository.getConversationById(conversationId);
    if (!conv) {
      const err = new Error('Conversation not found');
      err.statusCode = 404;
      throw err;
    }

    const isParticipant = conv.participants.some(
      (p) => p._id.toString() === senderId
    );
    if (!isParticipant) {
      const err = new Error('Access denied');
      err.statusCode = 403;
      throw err;
    }

    const message = await chatRepository.createMessage(conversationId, senderId, text);

    const populated = await message.populate('senderId', 'name email profilePicture');

    const otherUserId = conv.participants
      .find((p) => p._id.toString() !== senderId)?._id?.toString();

    const convObj = conv.toObject();
    convObj.lastMessage = text;
    convObj.lastMessageAt = message.createdAt;
    convObj.unread = convObj.unreadCount?.get(senderId.toString()) || 0;
    delete convObj.unreadCount;

    return { message: populated, conversation: convObj, otherUserId };
  },

  async markRead(conversationId, userId) {
    return chatRepository.markRead(conversationId, userId);
  },

  async getOrgUsers(currentUserId, organizationId) {
    return User.find({ organizationId, isActive: true, _id: { $ne: currentUserId } })
      .select('name email profilePicture role')
      .sort({ name: 1 });
  },
};

export default chatService;
