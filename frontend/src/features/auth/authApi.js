import axiosClient from '../../lib/axiosClient.js';

export const authApi = {
  login: (data) => axiosClient.post('/auth/login', data),
  register: (data) => axiosClient.post('/auth/register', data),
  refreshToken: (refreshToken) => axiosClient.post('/auth/refresh-token', { refreshToken }),
  getMe: () => axiosClient.get('/auth/me'),
  forgotPassword: (email) => axiosClient.post('/auth/forgot-password', { email }),
  verifyOTP: (email, code) => axiosClient.post('/auth/verify-otp', { email, code }),
  resetPassword: (resetToken, newPassword) => axiosClient.post('/auth/reset-password', { resetToken, newPassword }),
};
