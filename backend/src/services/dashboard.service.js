import Contract from '../models/Contract.model.js';
import WorkflowInstance from '../models/WorkflowInstance.model.js';
import Signature from '../models/Signature.model.js';
import AuditLog from '../models/AuditLog.model.js';
import Organization from '../models/Organization.model.js';

const dashboardService = {
  async getStats(organizationId) {
    const now = new Date();
    const in30 = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const [
      contracts,
      activeWorkflows,
      pendingSignatures,
    ] = await Promise.all([
      Contract.find({ organizationId }).select('status endDate createdAt').lean(),
      WorkflowInstance.find({ organizationId, status: 'in_progress' }).countDocuments(),
      Signature.find({ organizationId, status: 'pending' }).countDocuments(),
    ]);

    const activeContracts = contracts.filter((c) => c.status === 'published').length;
    const expiring30 = contracts.filter((c) => {
      if (!c.endDate || c.status === 'archived') return false;
      const end = new Date(c.endDate);
      return end >= now && end <= in30;
    }).length;
    const publishedThisMonth = contracts.filter((c) => {
      if (c.status !== 'published') return false;
      return new Date(c.createdAt) >= startOfMonth;
    }).length;

    const pendingActions = activeWorkflows + pendingSignatures;

    return {
      activeContracts,
      pendingActions,
      expiring30,
      publishedThisMonth,
    };
  },

  async getRecentActivity(organizationId, limit = 8) {
    const logs = await AuditLog.find({ organizationId })
      .sort({ createdAt: -1 })
      .limit(limit)
      .populate('userId', 'name')
      .lean();

    return logs.map((log) => ({
      _id: log._id,
      action: log.action,
      entityType: log.entityType,
      entityId: log.entityId,
      userName: log.userId?.name || 'Unknown',
      createdAt: log.createdAt,
    }));
  },

  async getOrganization(organizationId) {
    const org = await Organization.findById(organizationId).select('name').lean();
    return org;
  },
};

export default dashboardService;
