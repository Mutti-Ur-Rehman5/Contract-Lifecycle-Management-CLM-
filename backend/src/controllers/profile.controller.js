import profileService from '../services/profile.service.js';
import { successResponse } from '../utils/apiResponse.js';
import asyncHandler from '../utils/asyncHandler.js';

const profileController = {
  getProfile: asyncHandler(async (req, res) => {
    const result = await profileService.getProfile(req.user.id);
    return successResponse(res, result);
  }),

  updateProfile: asyncHandler(async (req, res) => {
    const result = await profileService.updateProfile(req.user.id, req.user.organizationId, req.body);
    return successResponse(res, result, 'Profile updated');
  }),

  changePassword: asyncHandler(async (req, res) => {
    const { currentPassword, newPassword } = req.body;
    const result = await profileService.changePassword(req.user.id, currentPassword, newPassword);
    return successResponse(res, result);
  }),

  uploadPicture: asyncHandler(async (req, res) => {
    if (!req.file) {
      const err = new Error('No file uploaded');
      err.statusCode = 400;
      throw err;
    }
    const result = await profileService.uploadProfilePicture(req.user.id, req.user.organizationId, req.file);
    return successResponse(res, result, 'Profile picture uploaded');
  }),

  removePicture: asyncHandler(async (req, res) => {
    const result = await profileService.removeProfilePicture(req.user.id, req.user.organizationId);
    return successResponse(res, result, 'Profile picture removed');
  }),
};

export default profileController;
