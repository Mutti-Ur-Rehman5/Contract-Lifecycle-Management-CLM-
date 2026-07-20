import authService from '../services/auth.service.js';
import { successResponse } from '../utils/apiResponse.js';
import asyncHandler from '../utils/asyncHandler.js';

export const register = asyncHandler(async (req, res) => {
  const result = await authService.registerOrganization(req.body);
  return successResponse(res, result, 'Organization registered successfully', 201);
});

export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  const result = await authService.login(email, password);
  return successResponse(res, result, 'Login successful');
});

export const refreshToken = asyncHandler(async (req, res) => {
  const { refreshToken } = req.body;
  const result = await authService.refreshAccessToken(refreshToken);
  return successResponse(res, result, 'Token refreshed');
});

export const getMe = asyncHandler(async (req, res) => {
  const result = await authService.getMe(req.user.id);
  return successResponse(res, result);
});
