import complianceService from '../services/compliance.service.js';

const complianceController = {
  async dashboard(req, res) {
    try {
      const data = await complianceService.getDashboard(req.user.organizationId);
      res.json({ status: 'success', data });
    } catch (err) {
      res.status(500).json({ status: 'error', message: err.message });
    }
  },

  async riskContracts(req, res) {
    try {
      const data = await complianceService.getRiskContracts(req.user.organizationId);
      res.json({ status: 'success', data });
    } catch (err) {
      res.status(500).json({ status: 'error', message: err.message });
    }
  },
};

export default complianceController;
