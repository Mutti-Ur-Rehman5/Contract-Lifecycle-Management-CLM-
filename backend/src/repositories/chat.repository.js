import Conversation from '../models/Conversation.model.js';
import Message from '../models/Message.model.js';

const chatRepository = {
  async findConversation(participantA, participantB) {
    return Conversation.findOne({
      participants: { $all: [participantA, participantB], $size: 2 },
    });
  },

  async createConversation(participantA, participantB) {
    return Conversation.create({
      participants: [participantA, participantB],
      unreadCount: { [participantA]: 0, [participantB]: 0 },
    });
  },

  async getConversations(userId) {
    return Conversation.find({ participants: userId })
      .sort({ lastMessageAt: -1, updatedAt: -1 })
      .populate('participants', 'name email profilePicture role');
  },

  async getConversationById(conversationId) {
    return Conversation.findById(conversationId)
      .populate('participants', 'name email profilePicture role');
  },

  async createMessage(conversationId, senderId, text) {
    const message = await Message.create({ conversationId, senderId, text });

    const senderKey = senderId.toString();
    const conv = await Conversation.findById(conversationId);

    const otherParticipant = conv.participants.find(
      (p) => p.toString() !== senderKey
    );
    const otherKey = otherParticipant.toString();

    const currentUnread = conv.unreadCount.get(otherKey) || 0;

    conv.lastMessage = text;
    conv.lastMessageAt = message.createdAt;
    conv.lastMessageBy = senderId;
    conv.unreadCount.set(otherKey, currentUnread + 1);
    await conv.save();

    return message;
  },

  async getMessages(conversationId, { limit = 50, before } = {}) {
    const query = { conversationId };
    if (before) {
      query.createdAt = { $lt: new Date(before) };
    }
    return Message.find(query)
      .sort({ createdAt: -1 })
      .limit(limit)
      .populate('senderId', 'name email profilePicture');
  },

  async markRead(conversationId, userId) {
    const conv = await Conversation.findById(conversationId);
    if (!conv) return null;

    conv.unreadCount.set(userId.toString(), 0);
    await conv.save();
    return conv;
  },
};

export default chatRepository;
