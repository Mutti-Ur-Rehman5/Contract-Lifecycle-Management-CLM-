import axiosClient from '../../lib/axiosClient.js';

export const chatApi = {
  getConversations: () => axiosClient.get('/chat/conversations'),
  startConversation: (userId) => axiosClient.post('/chat/conversations', { userId }),
  getMessages: (conversationId, limit = 50, before) =>
    axiosClient.get(`/chat/conversations/${conversationId}/messages`, {
      params: { limit, before },
    }),
  sendMessage: (conversationId, text) =>
    axiosClient.post(`/chat/conversations/${conversationId}/messages`, { text }),
  markRead: (conversationId) => axiosClient.put(`/chat/conversations/${conversationId}/read`),
  getOrgUsers: () => axiosClient.get('/chat/users'),
};
