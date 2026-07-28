import axiosClient from '../../lib/axiosClient.js';

export const profileApi = {
  getProfile: () => axiosClient.get('/profile'),
  updateProfile: (data) => axiosClient.put('/profile', data),
  changePassword: (data) => axiosClient.put('/profile/password', data),
  uploadPicture: (file) => {
    const formData = new FormData();
    formData.append('picture', file);
    return axiosClient.post('/profile/picture', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  removePicture: () => axiosClient.delete('/profile/picture'),
};
