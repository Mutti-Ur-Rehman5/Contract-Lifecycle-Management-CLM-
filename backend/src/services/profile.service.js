import { PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import s3 from '../config/s3.js';
import config from '../config/env.js';
import userRepository from '../repositories/user.repository.js';
import auditLogService from './auditLog.service.js';

const PDF_BUCKET = config.s3.bucket;

const profileService = {
  async getProfile(userId) {
    const user = await userRepository.findById(userId);
    if (!user) {
      const err = new Error('User not found');
      err.statusCode = 404;
      throw err;
    }
    return {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      organizationId: user.organizationId,
      profilePicture: user.profilePicture,
      phone: user.phone,
      jobTitle: user.jobTitle,
      timezone: user.timezone,
      createdAt: user.createdAt,
    };
  },

  async updateProfile(userId, organizationId, data) {
    const user = await userRepository.findById(userId);
    if (!user) {
      const err = new Error('User not found');
      err.statusCode = 404;
      throw err;
    }

    if (data.email && data.email !== user.email) {
      const existing = await userRepository.findByEmail(data.email);
      if (existing) {
        const err = new Error('Email already in use');
        err.statusCode = 409;
        throw err;
      }
    }

    const allowed = {};
    if (data.name !== undefined) allowed.name = data.name;
    if (data.email !== undefined) allowed.email = data.email;
    if (data.phone !== undefined) allowed.phone = data.phone;
    if (data.jobTitle !== undefined) allowed.jobTitle = data.jobTitle;
    if (data.timezone !== undefined) allowed.timezone = data.timezone;

    const updated = await userRepository.updateById(userId, allowed);

    await auditLogService.log({
      organizationId,
      userId,
      action: 'profile.update',
      entityType: 'User',
      entityId: userId,
      metadata: { fields: Object.keys(allowed) },
    });

    return {
      id: updated._id,
      name: updated.name,
      email: updated.email,
      role: updated.role,
      organizationId: updated.organizationId,
      profilePicture: updated.profilePicture,
      phone: updated.phone,
      jobTitle: updated.jobTitle,
      timezone: updated.timezone,
    };
  },

  async changePassword(userId, currentPassword, newPassword) {
    const user = await userRepository.findByEmailWithPassword(
      (await userRepository.findById(userId)).email
    );
    if (!user) {
      const err = new Error('User not found');
      err.statusCode = 404;
      throw err;
    }

    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      const err = new Error('Current password is incorrect');
      err.statusCode = 401;
      throw err;
    }

    user.passwordHash = newPassword;
    await user.save();

    return { message: 'Password changed successfully' };
  },

  async uploadProfilePicture(userId, organizationId, file) {
    const user = await userRepository.findById(userId);
    if (!user) {
      const err = new Error('User not found');
      err.statusCode = 404;
      throw err;
    }

    if (user.profilePicture) {
      try {
        const oldKey = user.profilePicture.substring(
          user.profilePicture.indexOf(`/${PDF_BUCKET}/`) + PDF_BUCKET.length + 2
        );
        await s3.send(new DeleteObjectCommand({ Bucket: PDF_BUCKET, Key: oldKey }));
      } catch {
      }
    }

    const ext = file.originalname.split('.').pop() || 'png';
    const key = `org/${organizationId}/avatars/${userId}.${ext}`;

    await s3.send(new PutObjectCommand({
      Bucket: PDF_BUCKET,
      Key: key,
      Body: file.buffer,
      ContentType: file.mimetype,
    }));

    const pictureUrl = `${config.s3.endpoint}/${PDF_BUCKET}/${key}`;

    await userRepository.updateById(userId, { profilePicture: pictureUrl });

    await auditLogService.log({
      organizationId,
      userId,
      action: 'profile.picture_upload',
      entityType: 'User',
      entityId: userId,
      metadata: {},
    });

    return { profilePicture: pictureUrl };
  },

  async removeProfilePicture(userId, organizationId) {
    const user = await userRepository.findById(userId);
    if (!user) {
      const err = new Error('User not found');
      err.statusCode = 404;
      throw err;
    }

    if (user.profilePicture) {
      try {
        const key = user.profilePicture.substring(
          user.profilePicture.indexOf(`/${PDF_BUCKET}/`) + PDF_BUCKET.length + 2
        );
        await s3.send(new DeleteObjectCommand({ Bucket: PDF_BUCKET, Key: key }));
      } catch {
      }
    }

    await userRepository.updateById(userId, { profilePicture: null });
    return { profilePicture: null };
  },
};

export default profileService;
