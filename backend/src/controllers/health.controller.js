import { successResponse } from '../utils/apiResponse.js';
import asyncHandler from '../utils/asyncHandler.js';

export const healthCheck = asyncHandler(async (req, res) => {
  return successResponse(res, { status: 'ok', timestamp: new Date().toISOString() }, 'API is healthy');
});
