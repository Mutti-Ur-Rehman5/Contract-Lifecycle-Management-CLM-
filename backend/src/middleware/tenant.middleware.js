import { errorResponse } from '../utils/apiResponse.js';

const tenantMiddleware = (req, res, next) => {
  if (!req.user || !req.user.organizationId) {
    return errorResponse(res, 'Organization context required', 403, 'FORBIDDEN');
  }

  req.organizationId = req.user.organizationId;
  next();
};

export default tenantMiddleware;
