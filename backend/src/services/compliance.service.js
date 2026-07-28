import Contract from '../models/Contract.model.js';
import Obligation from '../models/Obligation.model.js';
import WorkflowInstance from '../models/WorkflowInstance.model.js';
import Signature from '../models/Signature.model.js';

const complianceService = {
  async getDashboard(organizationId) {
    const now = new Date();
    const in30 = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
    const in90 = new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000);

    const [
      allContracts,
      allObligations,
      activeWorkflows,
      pendingSignatures,
    ] = await Promise.all([
      Contract.find({ organizationId }).select('title status startDate endDate type ownerId').populate('ownerId', 'name'),
      Obligation.find({ organizationId }),
      WorkflowInstance.find({ organizationId, status: { $in: ['in_progress'] } })
        .populate('contractId', 'title'),
      Signature.find({ organizationId, status: 'pending' })
        .populate('contractId', 'title')
        .populate('signerId', 'name email'),
    ]);

    const totalContracts = allContracts.length;
    const activeContracts = allContracts.filter((c) => c.status === 'published').length;
    const draftContracts = allContracts.filter((c) => c.status === 'draft').length;
    const archivedContracts = allContracts.filter((c) => c.status === 'archived').length;

    const expiringIn30 = allContracts.filter((c) => {
      if (!c.endDate || c.status === 'archived') return false;
      const end = new Date(c.endDate);
      return end >= now && end <= in30;
    });

    const expiringIn90 = allContracts.filter((c) => {
      if (!c.endDate || c.status === 'archived') return false;
      const end = new Date(c.endDate);
      return end >= now && end <= in90;
    });

    const expiredContracts = allContracts.filter((c) => {
      if (!c.endDate || c.status === 'archived') return false;
      return new Date(c.endDate) < now;
    });

    const totalObligations = allObligations.length;
    const pendingObligations = allObligations.filter((o) => o.status === 'pending');
    const overdueObligations = pendingObligations.filter((o) => new Date(o.dueDate) < now);
    const completedObligations = allObligations.filter((o) => o.status === 'completed');
    const upcomingObligations = pendingObligations.filter((o) => {
      const d = new Date(o.dueDate);
      return d >= now && d <= in30;
    });

    const pendingApprovals = activeWorkflows.length;
    const pendingSignatureCount = pendingSignatures.length;

    const totalRiskScore = this._calculateRiskScore({
      overdueObligations: overdueObligations.length,
      expiredContracts: expiredContracts.length,
      expiringIn30: expiringIn30.length,
      pendingApprovals,
      pendingSignatureCount,
      totalContracts,
    });

    const riskBreakdown = {
      high: overdueObligations.length + expiredContracts.length,
      medium: expiringIn30.length + upcomingObligations.length,
      low: pendingApprovals + pendingSignatureCount,
    };

    const complianceByType = {};
    for (const c of allContracts) {
      complianceByType[c.type] = (complianceByType[c.type] || 0) + 1;
    }

    return {
      summary: {
        totalContracts,
        activeContracts,
        draftContracts,
        archivedContracts,
        totalObligations,
        pendingObligations: pendingObligations.length,
        overdueObligations: overdueObligations.length,
        completedObligations: completedObligations.length,
        pendingApprovals,
        pendingSignatureCount,
        riskScore: totalRiskScore,
      },
      expiringIn30: expiringIn30.map((c) => ({
        _id: c._id,
        title: c.title,
        endDate: c.endDate,
        type: c.type,
        ownerName: c.ownerId?.name || '—',
      })),
      expiringIn90: expiringIn90.map((c) => ({
        _id: c._id,
        title: c.title,
        endDate: c.endDate,
        type: c.type,
        ownerName: c.ownerId?.name || '—',
      })),
      overdueObligations: overdueObligations.map((o) => ({
        _id: o._id,
        title: o.title,
        dueDate: o.dueDate,
        type: o.type,
      })),
      upcomingObligations: upcomingObligations.map((o) => ({
        _id: o._id,
        title: o.title,
        dueDate: o.dueDate,
        type: o.type,
      })),
      pendingApprovals: activeWorkflows.map((w) => ({
        _id: w._id,
        contractTitle: w.contractId?.title || '—',
        currentStage: w.currentStageKey,
      })),
      pendingSignatures: pendingSignatures.map((s) => ({
        _id: s._id,
        contractTitle: s.contractId?.title || '—',
        signatoryName: s.signerId?.name || '—',
        signatoryEmail: s.signerId?.email || '—',
      })),
      riskBreakdown,
      complianceByType,
    };
  },

  _calculateRiskScore(data) {
    const weights = {
      overdueObligation: 15,
      expiredContract: 20,
      expiringIn30Contract: 5,
      pendingApproval: 3,
      pendingSignature: 2,
    };

    const raw =
      data.overdueObligations * weights.overdueObligation +
      data.expiredContracts * weights.expiredContract +
      data.expiringIn30 * weights.expiringIn30Contract +
      data.pendingApprovals * weights.pendingApproval +
      data.pendingSignatureCount * weights.pendingSignature;

    const maxPossible = Math.max(data.totalContracts * 40, 1);
    const score = Math.min(Math.round((raw / maxPossible) * 100), 100);

    return score;
  },

  async getRiskContracts(organizationId) {
    const now = new Date();
    const contracts = await Contract.find({ organizationId })
      .select('title status startDate endDate type ownerId')
      .populate('ownerId', 'name');

    return contracts
      .filter((c) => c.endDate && c.status !== 'archived')
      .map((c) => {
        const end = new Date(c.endDate);
        const daysUntilEnd = Math.ceil((end - now) / (1000 * 60 * 60 * 24));
        let riskLevel = 'low';
        if (daysUntilEnd < 0) riskLevel = 'critical';
        else if (daysUntilEnd <= 30) riskLevel = 'high';
        else if (daysUntilEnd <= 90) riskLevel = 'medium';
        return {
          _id: c._id,
          title: c.title,
          endDate: c.endDate,
          type: c.type,
          ownerName: c.ownerId?.name || '—',
          daysUntilEnd,
          riskLevel,
        };
      })
      .sort((a, b) => a.daysUntilEnd - b.daysUntilEnd);
  },
};

export default complianceService;
