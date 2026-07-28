import axiosClient from '../../lib/axiosClient.js';

export const dashboardApi = {
  getDashboard: () => axiosClient.get('/dashboard'),
};
