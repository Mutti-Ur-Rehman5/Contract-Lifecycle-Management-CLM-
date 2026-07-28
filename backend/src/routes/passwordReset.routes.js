import { Router } from 'express';
import passwordResetController from '../controllers/passwordReset.controller.js';
import validate from '../middleware/validate.middleware.js';
import { authLimiter } from '../middleware/rateLimit.middleware.js';
import Joi from 'joi';

const router = Router();

const requestOTPSchema = Joi.object({
  email: Joi.string().email().required(),
});

const verifyOTPSchema = Joi.object({
  email: Joi.string().email().required(),
  code: Joi.string().length(6).required(),
});

const resetPasswordSchema = Joi.object({
  resetToken: Joi.string().required(),
  newPassword: Joi.string().min(8).max(128).required(),
});

router.post('/forgot-password', authLimiter, validate(requestOTPSchema), passwordResetController.requestOTP);
router.post('/verify-otp', authLimiter, validate(verifyOTPSchema), passwordResetController.verifyOTP);
router.post('/reset-password', authLimiter, validate(resetPasswordSchema), passwordResetController.resetPassword);

export default router;
