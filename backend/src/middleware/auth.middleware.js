import jwt from 'jsonwebtoken';
import config from '../config/env.js';
import { errorResponse } from '../utils/apiResponse.js';

const authMiddleware = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return errorResponse(res, 'Access token required', 401, 'UNAUTHORIZED');
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, config.jwt.secret);
    req.user = decoded;
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return errorResponse(res, 'Token expired', 401, 'TOKEN_EXPIRED');
    }
    return errorResponse(res, 'Invalid token', 401, 'INVALID_TOKEN');
  }
};

export default authMiddleware;
