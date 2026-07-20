import User from '../models/User.model.js';
import jwt from 'jsonwebtoken';
import config from '../config/env.js';
import bcrypt from 'bcryptjs';

const authService = {
  async registerOrganization(data) {
    const existing = await User.findOne({ email: data.email });
    if (existing) throw Object.assign(new Error('Email already registered'), { statusCode: 409 });

    const { Organization } = await import('../models/Organization.model.js');
    const org = await Organization.create({ name: data.orgName, slug: data.orgSlug });

    const user = await User.create({
      organizationId: org._id,
      name: data.name,
      email: data.email,
      passwordHash: data.password,
      role: 'admin',
    });

    return { organization: org, user: { id: user._id, name: user.name, email: user.email, role: user.role } };
  },

  async login(email, password) {
    const user = await User.findOne({ email }).select('+passwordHash');
    if (!user) throw Object.assign(new Error('Invalid credentials'), { statusCode: 401 });

    const isMatch = await user.comparePassword(password);
    if (!isMatch) throw Object.assign(new Error('Invalid credentials'), { statusCode: 401 });

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

    return { accessToken, refreshToken, user: { id: user._id, name: user.name, email: user.email, role: user.role } };
  },
};

export default authService;
