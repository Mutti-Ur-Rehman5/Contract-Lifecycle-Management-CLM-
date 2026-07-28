import passwordResetService from '../services/passwordReset.service.js';
import { successResponse } from '../utils/apiResponse.js';
import asyncHandler from '../utils/asyncHandler.js';
import logger from '../utils/logger.js';

const passwordResetController = {
  requestOTP: asyncHandler(async (req, res) => {
    try {
      const result = await passwordResetService.requestOTP(req.body.email);
      return successResponse(res, result);
    } catch (err) {
      if (err.statusCode === 200) {
        return successResponse(res, { message: err.message });
      }
      logger.error(`requestOTP failed: ${err.message}`);
      throw err;
    }
  }),

  verifyOTP: asyncHandler(async (req, res) => {
    const { email, code } = req.body;
    const result = await passwordResetService.verifyOTP(email, code);
    return successResponse(res, result, 'OTP verified');
  }),

  resetPassword: asyncHandler(async (req, res) => {
    const { resetToken, newPassword } = req.body;
    const result = await passwordResetService.resetPassword(resetToken, newPassword);
    return successResponse(res, result);
  }),
};

export default passwordResetController;
