import axiosClient from '../../lib/axiosClient.js';

export const obligationApi = {
  getObligations: (params) => axiosClient.get('/obligations', { params }),
  getObligation: (id) => axiosClient.get(`/obligations/${id}`),
  createObligation: (data) => axiosClient.post('/obligations', data),
  updateObligation: (id, data) => axiosClient.patch(`/obligations/${id}`, data),
  deleteObligation: (id) => axiosClient.delete(`/obligations/${id}`),
  getStats: () => axiosClient.get('/obligations/stats'),
  getUpcoming: (days) => axiosClient.get('/obligations/upcoming', { params: { days } }),
  getOverdue: () => axiosClient.get('/obligations/overdue'),
};
