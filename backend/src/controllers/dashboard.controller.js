import dashboardService from '../services/dashboard.service.js';

const dashboardController = {
  async getDashboard(req, res) {
    try {
      const orgId = req.user.organizationId;
      const [stats, recentActivity, organization] = await Promise.all([
        dashboardService.getStats(orgId),
        dashboardService.getRecentActivity(orgId),
        dashboardService.getOrganization(orgId),
      ]);
      res.json({ status: 'success', data: { stats, recentActivity, organization } });
    } catch (err) {
      res.status(500).json({ status: 'error', message: err.message });
    }
  },
};

export default dashboardController;
