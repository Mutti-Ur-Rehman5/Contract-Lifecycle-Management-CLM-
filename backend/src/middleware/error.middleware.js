import config from '../config/env.js';
import { errorResponse } from '../utils/apiResponse.js';
import logger from '../utils/logger.js';

export const errorHandler = (err, req, res, _next) => {
  logger.error(err.message, { stack: err.stack });

  const statusCode = err.statusCode || 500;
  const message = config.nodeEnv === 'production' && statusCode === 500
    ? 'Internal server error'
    : err.message;

  return errorResponse(res, message, statusCode, err.code || 'INTERNAL_ERROR');
};

export const notFoundHandler = (req, res) => {
  return errorResponse(res, `Route not found: ${req.method} ${req.originalUrl}`, 404, 'NOT_FOUND');
};
