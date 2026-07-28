import jwt from 'jsonwebtoken';
import config from '../config/env.js';
import userRepository from '../repositories/user.repository.js';
import organizationRepository from '../repositories/organization.repository.js';
import auditLogService from './auditLog.service.js';

const authService = {
  async registerOrganization(data) {
    const existing = await userRepository.findByEmail(data.email);
    if (existing) {
      const err = new Error('Email already registered');
      err.statusCode = 409;
      throw err;
    }

    const org = await organizationRepository.create({
      name: data.orgName,
      slug: data.orgSlug,
    });

    const user = await userRepository.create({
      organizationId: org._id,
      name: data.name,
      email: data.email,
      passwordHash: data.password,
      role: 'admin',
    });

    await auditLogService.log({
      organizationId: org._id,
      userId: user._id,
      action: 'auth.register',
      entityType: 'Organization',
      entityId: org._id,
      metadata: { email: data.email, orgName: data.orgName },
    });

    return {
      organization: { id: org._id, name: org.name, slug: org.slug },
      user: { id: user._id, name: user.name, email: user.email, role: user.role },
    };
  },

  async login(email, password) {
    const user = await userRepository.findByEmailWithPassword(email);
    if (!user) {
      const err = new Error('Invalid credentials');
      err.statusCode = 401;
      throw err;
    }

    if (!user.isActive) {
      const err = new Error('Account is deactivated');
      err.statusCode = 403;
      throw err;
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      const err = new Error('Invalid credentials');
      err.statusCode = 401;
      throw err;
    }

    await auditLogService.log({
      organizationId: user.organizationId,
      userId: user._id,
      action: 'auth.login',
      entityType: 'User',
      entityId: user._id,
      metadata: { email },
    });

    const accessToken = jwt.sign(
      { id: user._id, organizationId: user.organizationId, role: user.role },
      config.jwt.secret,
      { expiresIn: config.jwt.expiresIn }
    );

    const refreshToken = jwt.sign(
      { id: user._id },
      config.jwt.refreshSecret,
      { expiresIn: config.jwt.refreshExpiresIn }
    );

    return {
      accessToken,
      refreshToken,
      user: { id: user._id, name: user.name, email: user.email, role: user.role, profilePicture: user.profilePicture },
    };
  },

  async refreshAccessToken(refreshToken) {
    try {
      const decoded = jwt.verify(refreshToken, config.jwt.refreshSecret);
      const user = await userRepository.findById(decoded.id);
      if (!user || !user.isActive) {
        const err = new Error('Invalid refresh token');
        err.statusCode = 401;
        throw err;
      }

      const newAccessToken = jwt.sign(
        { id: user._id, organizationId: user.organizationId, role: user.role },
        config.jwt.secret,
        { expiresIn: config.jwt.expiresIn }
      );

      return { accessToken: newAccessToken };
    } catch (error) {
      const err = new Error('Invalid or expired refresh token');
      err.statusCode = 401;
      throw err;
    }
  },

  async getMe(userId) {
    const user = await userRepository.findById(userId);
    if (!user) {
      const err = new Error('User not found');
      err.statusCode = 404;
      throw err;
    }
    return { id: user._id, name: user.name, email: user.email, role: user.role, organizationId: user.organizationId, profilePicture: user.profilePicture };
  },
};

export default authService;
