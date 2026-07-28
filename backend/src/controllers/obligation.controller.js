import obligationService from '../services/obligation.service.js';

const obligationController = {
  async create(req, res) {
    try {
      const obligation = await obligationService.createObligation(
        req.user.organizationId,
        req.user._id,
        req.body,
      );
      res.status(201).json({ status: 'success', data: obligation });
    } catch (err) {
      res.status(err.statusCode || 500).json({ status: 'error', message: err.message });
    }
  },

  async list(req, res) {
    try {
      const obligations = await obligationService.getObligations(req.user.organizationId, {
        contractId: req.query.contractId,
        status: req.query.status,
        type: req.query.type,
      });
      res.json({ status: 'success', data: obligations });
    } catch (err) {
      res.status(500).json({ status: 'error', message: err.message });
    }
  },

  async getOne(req, res) {
    try {
      const obligation = await obligationService.getObligationById(
        req.params.id,
        req.user.organizationId,
      );
      res.json({ status: 'success', data: obligation });
    } catch (err) {
      res.status(err.statusCode || 500).json({ status: 'error', message: err.message });
    }
  },

  async update(req, res) {
    try {
      const obligation = await obligationService.updateObligation(
        req.params.id,
        req.user.organizationId,
        req.user._id,
        req.body,
      );
      res.json({ status: 'success', data: obligation });
    } catch (err) {
      res.status(err.statusCode || 500).json({ status: 'error', message: err.message });
    }
  },

  async remove(req, res) {
    try {
      await obligationService.deleteObligation(
        req.params.id,
        req.user.organizationId,
        req.user._id,
      );
      res.json({ status: 'success', message: 'Obligation deleted' });
    } catch (err) {
      res.status(err.statusCode || 500).json({ status: 'error', message: err.message });
    }
  },

  async upcoming(req, res) {
    try {
      const days = parseInt(req.query.days, 10) || 30;
      const obligations = await obligationService.getUpcoming(req.user.organizationId, days);
      res.json({ status: 'success', data: obligations });
    } catch (err) {
      res.status(500).json({ status: 'error', message: err.message });
    }
  },

  async overdue(req, res) {
    try {
      const obligations = await obligationService.getOverdue(req.user.organizationId);
      res.json({ status: 'success', data: obligations });
    } catch (err) {
      res.status(500).json({ status: 'error', message: err.message });
    }
  },

  async stats(req, res) {
    try {
      const stats = await obligationService.getStats(req.user.organizationId);
      res.json({ status: 'success', data: stats });
    } catch (err) {
      res.status(500).json({ status: 'error', message: err.message });
    }
  },
};

export default obligationController;
