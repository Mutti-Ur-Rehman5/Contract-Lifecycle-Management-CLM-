import config from '../config/env.js';
import { errorResponse } from '../utils/apiResponse.js';
import logger from '../utils/logger.js';

export const errorHandler = (err, req, res, _next) => {
  logger.error(err.message, { stack: err.stack });

  const statusCode = err.statusCode || 500;

  if (config.nodeEnv === 'production') {
    if (statusCode === 500) {
      return errorResponse(res, 'Internal server error', 500, 'INTERNAL_ERROR');
    }
    return errorResponse(res, err.message, statusCode, err.code || 'APP_ERROR');
  }

  return errorResponse(res, err.message, statusCode, err.code || 'INTERNAL_ERROR');
};

export const notFoundHandler = (req, res) => {
  return errorResponse(res, `Route not found: ${req.method} ${req.originalUrl}`, 404, 'NOT_FOUND');
};
