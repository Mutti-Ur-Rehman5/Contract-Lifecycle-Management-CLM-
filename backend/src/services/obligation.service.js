import obligationRepository from '../repositories/obligation.repository.js';
import Contract from '../models/Contract.model.js';
import auditLogService from './auditLog.service.js';

const obligationService = {
  async createObligation(organizationId, userId, data) {
    const contract = await Contract.findById(data.contractId).select('organizationId');
    if (!contract || contract.organizationId.toString() !== organizationId) {
      const err = new Error('Contract not found');
      err.statusCode = 404;
      throw err;
    }

    const obligation = await obligationRepository.create({
      organizationId,
      contractId: data.contractId,
      type: data.type,
      title: data.title,
      dueDate: new Date(data.dueDate),
      status: 'pending',
      assignedToUserId: data.assignedToUserId || null,
    });

    auditLogService.log({
      organizationId,
      userId,
      action: 'obligation.created',
      entityType: 'Obligation',
      entityId: obligation._id,
      metadata: { contractId: data.contractId, type: data.type, title: data.title },
    }).catch(() => {});

    return obligation;
  },

  async getObligations(organizationId, { contractId, status, type } = {}) {
    const filters = {};
    if (contractId) filters.contractId = contractId;
    if (status) filters.status = status;
    if (type) filters.type = type;
    return obligationRepository.findByOrganization(organizationId, filters);
  },

  async getObligationById(id, organizationId) {
    const obligation = await obligationRepository.findById(id);
    if (!obligation || obligation.organizationId.toString() !== organizationId) {
      const err = new Error('Obligation not found');
      err.statusCode = 404;
      throw err;
    }
    return obligation;
  },

  async updateObligation(id, organizationId, userId, data) {
    const obligation = await obligationRepository.findById(id);
    if (!obligation || obligation.organizationId.toString() !== organizationId) {
      const err = new Error('Obligation not found');
      err.statusCode = 404;
      throw err;
    }

    const updates = {};
    if (data.title !== undefined) updates.title = data.title;
    if (data.type !== undefined) updates.type = data.type;
    if (data.dueDate !== undefined) updates.dueDate = new Date(data.dueDate);
    if (data.status !== undefined) updates.status = data.status;
    if (data.assignedToUserId !== undefined) updates.assignedToUserId = data.assignedToUserId;

    const updated = await obligationRepository.findByIdAndUpdate(id, updates);

    auditLogService.log({
      organizationId,
      userId,
      action: 'obligation.updated',
      entityType: 'Obligation',
      entityId: id,
      metadata: updates,
    }).catch(() => {});

    return updated;
  },

  async deleteObligation(id, organizationId, userId) {
    const obligation = await obligationRepository.findById(id);
    if (!obligation || obligation.organizationId.toString() !== organizationId) {
      const err = new Error('Obligation not found');
      err.statusCode = 404;
      throw err;
    }

    await obligationRepository.deleteById(id);

    auditLogService.log({
      organizationId,
      userId,
      action: 'obligation.deleted',
      entityType: 'Obligation',
      entityId: id,
    }).catch(() => {});

    return { deleted: true };
  },

  async getOverdue(organizationId) {
    await obligationRepository.markOverdueBulk(organizationId);
    return obligationRepository.findOverdue(organizationId);
  },

  async getStats(organizationId) {
    const [total, pending, completed, overdue, upcoming30Days] = await Promise.all([
      obligationRepository.countByOrganization(organizationId),
      obligationRepository.countByStatus(organizationId, 'pending'),
      obligationRepository.countByStatus(organizationId, 'completed'),
      obligationRepository.countOverdue(organizationId),
      obligationRepository.countUpcoming(organizationId, 30),
    ]);

    return { total, pending, completed, overdue, upcoming30Days };
  },
};

export default obligationService;
