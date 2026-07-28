import crypto from 'crypto';
import PasswordResetOTP from '../models/PasswordResetOTP.model.js';
import userRepository from '../repositories/user.repository.js';
import emailService from './email.service.js';
import auditLogService from './auditLog.service.js';
import logger from '../utils/logger.js';

const OTP_LENGTH = 6;
const OTP_EXPIRY_MINUTES = 10;
const MAX_ATTEMPTS = 5;

function generateOTP() {
  const buffer = crypto.randomBytes(OTP_LENGTH);
  let code = '';
  for (let i = 0; i < OTP_LENGTH; i++) {
    code += buffer[i] % 10;
  }
  return code;
}

function hashOTP(code) {
  return crypto.createHash('sha256').update(code).digest('hex');
}

const passwordResetService = {
  async requestOTP(email) {
    const user = await userRepository.findByEmail(email);

    if (!user) {
      const err = new Error('If an account with that email exists, an OTP has been sent.');
      err.statusCode = 200;
      throw err;
    }

    await PasswordResetOTP.updateMany(
      { email, purpose: 'password_reset', used: false },
      { used: true }
    );

    const rawCode = generateOTP();
    const hashedCode = hashOTP(rawCode);

    const expiresAt = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);

    await PasswordResetOTP.create({
      email,
      code: hashedCode,
      purpose: 'password_reset',
      expiresAt,
    });

    await emailService.sendOTPEmail(email, rawCode, user.name);

    if (user.organizationId) {
      await auditLogService.log({
        organizationId: user.organizationId,
        userId: user._id,
        action: 'auth.password_reset_requested',
        entityType: 'User',
        entityId: user._id,
        metadata: { email },
      });
    }

    logger.info(`OTP requested for ${email}`);

    return { message: 'If an account with that email exists, an OTP has been sent.' };
  },

  async verifyOTP(email, code) {
    const hashedCode = hashOTP(code);

    const otpRecord = await PasswordResetOTP.findOne({
      email,
      purpose: 'password_reset',
      used: false,
      expiresAt: { $gt: new Date() },
    }).sort({ createdAt: -1 });

    if (!otpRecord) {
      const err = new Error('Invalid or expired OTP. Please request a new one.');
      err.statusCode = 400;
      throw err;
    }

    if (otpRecord.attempts >= MAX_ATTEMPTS) {
      otpRecord.used = true;
      await otpRecord.save();
      const err = new Error('Too many failed attempts. Please request a new OTP.');
      err.statusCode = 429;
      throw err;
    }

    otpRecord.attempts += 1;
    await otpRecord.save();

    if (otpRecord.code !== hashedCode) {
      const remaining = MAX_ATTEMPTS - otpRecord.attempts;
      const err = new Error(`Invalid OTP. ${remaining} attempt${remaining !== 1 ? 's' : ''} remaining.`);
      err.statusCode = 400;
      throw err;
    }

    const resetToken = crypto.randomBytes(32).toString('hex');
    const tokenHash = crypto.createHash('sha256').update(resetToken).digest('hex');

    otpRecord.used = true;
    otpRecord.metadata = { resetTokenHash: tokenHash };
    await otpRecord.save();

    return { resetToken, email };
  },

  async resetPassword(resetToken, newPassword) {
    const tokenHash = crypto.createHash('sha256').update(resetToken).digest('hex');

    const otpRecord = await PasswordResetOTP.findOne({
      purpose: 'password_reset',
      used: true,
      'metadata.resetTokenHash': tokenHash,
    });

    if (!otpRecord) {
      const err = new Error('Invalid or expired reset token. Please start over.');
      err.statusCode = 400;
      throw err;
    }

    const user = await userRepository.findByEmailWithPassword(otpRecord.email);
    if (!user) {
      const err = new Error('User not found');
      err.statusCode = 404;
      throw err;
    }

    user.passwordHash = newPassword;
    await user.save();

    if (user.organizationId) {
      await auditLogService.log({
        organizationId: user.organizationId,
        userId: user._id,
        action: 'auth.password_reset_completed',
        entityType: 'User',
        entityId: user._id,
        metadata: { email: otpRecord.email },
      });
    }

    logger.info(`Password reset completed for ${otpRecord.email}`);

    return { message: 'Password has been reset successfully. You can now sign in.' };
  },
};

export default passwordResetService;
