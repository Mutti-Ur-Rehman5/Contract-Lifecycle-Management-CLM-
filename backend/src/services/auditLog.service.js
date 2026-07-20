import AuditLog from '../models/AuditLog.model.js';

const auditLogService = {
  async log({ organizationId, userId, action, entityType, entityId, metadata = {}, ipAddress = null }) {
    return AuditLog.create({ organizationId, userId, action, entityType, entityId, metadata, ipAddress });
  },
};

export default auditLogService;
