import mongoose from 'mongoose';

const conversationSchema = new mongoose.Schema(
  {
    participants: [
      { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    ],
    lastMessage: { type: String, default: '' },
    lastMessageAt: { type: Date, default: null },
    lastMessageBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    unreadCount: {
      type: Map,
      of: Number,
      default: {},
    },
  },
  { timestamps: true }
);

conversationSchema.index({ participants: 1 });
conversationSchema.index({ lastMessageAt: -1 });

const Conversation = mongoose.model('Conversation', conversationSchema);

export default Conversation;
