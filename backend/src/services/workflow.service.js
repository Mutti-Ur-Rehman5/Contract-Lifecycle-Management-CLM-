import workflowRepository from '../repositories/workflow.repository.js';
import workflowEngineService from './workflowEngine.service.js';
import auditLogService from './auditLog.service.js';
import notificationService from './notification.service.js';
import eventBus from '../events/eventBus.js';
import Contract from '../models/Contract.model.js';
import User from '../models/User.model.js';
import signatureService from './signature.service.js';

const DEFAULT_STAGES = [
  { key: 'draft', label: 'Draft', approverRole: 'drafter', order: 0, isRequired: true },
  { key: 'internal_review', label: 'Internal Review', approverRole: 'reviewer', order: 1, isRequired: true },
  { key: 'legal_review', label: 'Legal Review', approverRole: 'legal', order: 2, isRequired: true },
  { key: 'finance_approval', label: 'Finance Approval', approverRole: 'finance', order: 3, isRequired: true },
  { key: 'executive_approval', label: 'Executive Approval', approverRole: 'executive', order: 4, isRequired: true },
  { key: 'pending_signature', label: 'Pending Signature', approverRole: 'signatory', order: 5, isRequired: true },
  { key: 'published', label: 'Published', approverRole: 'admin', order: 6, isRequired: false },
  { key: 'archived', label: 'Archived', approverRole: 'admin', order: 7, isRequired: false },
];

const CONTRACT_TYPES = ['employment', 'vendor', 'nda', 'service', 'purchase', 'partnership', 'client'];

async function findUsersByRole(organizationId, role) {
  return User.find({ organizationId, role, isActive: true }).select('_id');
}

async function createPendingStepsForStage(workflowInstanceId, organizationId, stage) {
  const users = await findUsersByRole(organizationId, stage.approverRole);
  if (!users.length) return [];

  const steps = [];
  for (const user of users) {
    const existing = await workflowRepository.findPendingStepForUser(workflowInstanceId, stage.key, user._id);
    if (!existing) {
      const step = await workflowRepository.createApprovalStep({
        workflowInstanceId,
        stageKey: stage.key,
        assignedToUserId: user._id,
        status: 'pending',
        comment: '',
        decidedAt: null,
      });
      steps.push(step);
    }
  }
  return steps;
}

const workflowService = {
  // --- Definitions ---
  async getDefinitions(organizationId) {
    return workflowRepository.findDefinitionsByOrganization(organizationId);
  },

  async getDefinition(id, organizationId) {
    const def = await workflowRepository.findDefinitionById(id);
    if (!def || def.organizationId.toString() !== organizationId) {
      const err = new Error('Workflow definition not found');
      err.statusCode = 404;
      throw err;
    }
    return def;
  },

  async createDefinition(organizationId, data) {
    const existing = await workflowRepository.findDefinitionByContractType(organizationId, data.contractType);
    if (existing) {
      const err = new Error('A workflow definition already exists for this contract type');
      err.statusCode = 409;
      throw err;
    }
    const def = await workflowRepository.createDefinition({
      organizationId,
      name: data.name,
      contractType: data.contractType,
      stages: data.stages.map((s, i) => ({
        key: s.key,
        label: s.label,
        approverRole: s.approverRole,
        order: i,
        isRequired: s.isRequired !== false,
      })),
    });
    return def;
  },

  async updateDefinition(id, organizationId, data) {
    const def = await workflowRepository.findDefinitionById(id);
    if (!def || def.organizationId.toString() !== organizationId) {
      const err = new Error('Workflow definition not found');
      err.statusCode = 404;
      throw err;
    }
    const updated = await workflowRepository.updateDefinitionById(id, {
      name: data.name,
      stages: data.stages.map((s, i) => ({
        key: s.key,
        label: s.label,
        approverRole: s.approverRole,
        order: i,
        isRequired: s.isRequired !== false,
      })),
    });
    return updated;
  },

  async deleteDefinition(id, organizationId) {
    const def = await workflowRepository.findDefinitionById(id);
    if (!def || def.organizationId.toString() !== organizationId) {
      const err = new Error('Workflow definition not found');
      err.statusCode = 404;
      throw err;
    }
    await workflowRepository.deleteDefinitionById(id);
  },

  async seedDefaultDefinitions(organizationId) {
    const results = [];
    for (const contractType of CONTRACT_TYPES) {
      const existing = await workflowRepository.findDefinitionByContractType(organizationId, contractType);
      if (!existing) {
        const def = await workflowRepository.createDefinition({
          organizationId,
          name: `Default ${contractType} Workflow`,
          contractType,
          stages: DEFAULT_STAGES,
        });
        results.push(def);
      }
    }
    return results;
  },

  // --- Instances & Actions ---
  async submitForApproval(contractId, organizationId, userId) {
    const contract = await Contract.findById(contractId);
    if (!contract || contract.organizationId.toString() !== organizationId) {
      const err = new Error('Contract not found');
      err.statusCode = 404;
      throw err;
    }

    if (contract.status !== 'draft') {
      const err = new Error('Only draft contracts can be submitted for approval');
      err.statusCode = 400;
      throw err;
    }

    const existing = await workflowRepository.findInstanceByContract(contractId);
    const isResubmission = existing && existing.status === 'in_progress' && contract.status === 'draft';

    if (existing && !isResubmission) {
      const err = new Error('Contract already has an active workflow');
      err.statusCode = 409;
      throw err;
    }

    const definition = await workflowRepository.findDefinitionByContractType(organizationId, contract.type);
    if (!definition) {
      const err = new Error('No workflow definition found for this contract type');
      err.statusCode = 400;
      throw err;
    }

    const sortedStages = [...definition.stages].sort((a, b) => a.order - b.order);
    const firstRequiredStage = sortedStages.find((s) => s.isRequired) || sortedStages[0];
    const firstStageIndex = sortedStages.findIndex((s) => s.key === firstRequiredStage.key);

    let activeStage = firstRequiredStage;
    let activeStageIndex = firstStageIndex;

    if (firstRequiredStage.key === 'draft') {
      const nextStage = sortedStages[firstStageIndex + 1];
      if (nextStage) {
        activeStage = nextStage;
        activeStageIndex = firstStageIndex + 1;
      }
    }

    let instance;
    if (isResubmission) {
      instance = await workflowRepository.updateInstance(existing._id, {
        currentStageKey: activeStage.key,
        currentStageIndex: activeStageIndex,
        status: 'in_progress',
        contractStatus: activeStage.key,
      });
    } else {
      instance = await workflowRepository.createInstance({
        organizationId,
        contractId,
        workflowDefinitionId: definition._id,
        currentStageKey: activeStage.key,
        currentStageIndex: activeStageIndex,
        status: 'in_progress',
        contractStatus: activeStage.key,
        initiatedBy: userId,
      });
    }

    if (firstRequiredStage.key === 'draft') {
      await workflowRepository.createApprovalStep({
        workflowInstanceId: instance._id,
        stageKey: 'draft',
        assignedToUserId: userId,
        status: 'approved',
        comment: 'Contract submitted for approval',
        decidedAt: new Date(),
      });
    }

    await createPendingStepsForStage(instance._id, organizationId, activeStage);

    const approverUsers = await findUsersByRole(organizationId, activeStage.approverRole);
    const contractTitle = contract.title || 'Untitled contract';
    for (const approver of approverUsers) {
      notificationService.enqueueNotification({
        organizationId,
        userId: approver._id,
        type: 'approval_assigned',
        title: 'New approval request',
        message: `"${contractTitle}" has been submitted for your approval at the ${activeStage.label} stage.`,
        relatedContractId: contractId,
      });
    }

    await Contract.findByIdAndUpdate(contractId, {
      status: activeStage.key,
      workflowInstanceId: instance._id,
    });

    await auditLogService.log({
      organizationId,
      userId,
      action: 'workflow.submitted',
      entityType: 'WorkflowInstance',
      entityId: instance._id,
      metadata: { contractId, stageKey: activeStage.key },
    });

    eventBus.emit('workflow.submitted', {
      contractId,
      workflowInstanceId: instance._id,
      stageKey: activeStage.key,
      organizationId,
      initiatedBy: userId,
    });

    return instance;
  },

  async approve(workflowInstanceId, userId, comment, organizationId) {
    const canAct = await workflowEngineService.canUserAct(workflowInstanceId, userId);
    if (!canAct) {
      const err = new Error('You do not have permission to approve this stage');
      err.statusCode = 403;
      throw err;
    }

    const result = await workflowEngineService.advance(workflowInstanceId, 'approve', userId, comment);
    const instance = result.instance;

    await Contract.findByIdAndUpdate(instance.contractId._id || instance.contractId, {
      status: instance.contractStatus,
    });

    await auditLogService.log({
      organizationId,
      userId,
      action: `workflow.approved.${result.stageKey || result.previousStage}`,
      entityType: 'WorkflowInstance',
      entityId: workflowInstanceId,
      metadata: {
        contractId: instance.contractId._id || instance.contractId,
        decision: result.decision,
        stageKey: result.stageKey || result.newStage,
      },
    });

    if (result.decision === 'completed') {
      eventBus.emit('workflow.completed', {
        contractId: instance.contractId._id || instance.contractId,
        workflowInstanceId,
        organizationId,
        completedBy: userId,
      });
      const cId2 = instance.contractId._id || instance.contractId;
      const completedContract2 = await Contract.findById(cId2).select('ownerId title');
      if (completedContract2?.ownerId) {
        const ownerUserId = completedContract2.ownerId._id || completedContract2.ownerId;
        if (ownerUserId.toString() !== userId.toString()) {
          notificationService.enqueueNotification({
            organizationId,
            userId: ownerUserId,
            type: 'workflow_completed',
            title: 'Contract fully approved',
            message: `"${completedContract2.title || 'Untitled contract'}" has completed all approval stages and is now ready for signature.`,
            relatedContractId: cId2,
          });
        }
      }
    } else {
      eventBus.emit('workflow.stage_changed', {
        contractId: instance.contractId._id || instance.contractId,
        workflowInstanceId,
        previousStage: result.previousStage,
        newStage: result.newStage,
        organizationId,
        approvedBy: userId,
      });

      const cId3 = instance.contractId._id || instance.contractId;
      const changedContract = await Contract.findById(cId3).select('ownerId title');
      if (changedContract?.ownerId) {
        const ownerId = changedContract.ownerId._id || changedContract.ownerId;
        if (ownerId.toString() !== userId.toString()) {
          const nextStageLabel = result.newStage?.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()) || '';
          notificationService.enqueueNotification({
            organizationId,
            userId: ownerId,
            type: 'stage_changed',
            title: 'Contract advanced',
            message: `"${changedContract.title || 'Untitled contract'}" has moved to the ${nextStageLabel} stage.`,
            relatedContractId: cId3,
          });
        }
      }

      const nextStageDef2 = result.newStage;
      if (nextStageDef2) {
        const contractForDef = await Contract.findById(cId3).select('type');
        if (contractForDef) {
          const def = await workflowRepository.findDefinitionByContractType(organizationId, contractForDef.type);
          if (def) {
            const allStages = [...def.stages].sort((a, b) => a.order - b.order);
            const nextStg = allStages.find((s) => s.key === nextStageDef2);
            if (nextStg) {
              const nextApprovers = await findUsersByRole(organizationId, nextStg.approverRole);
              for (const nextApprover of nextApprovers) {
                notificationService.enqueueNotification({
                  organizationId,
                  userId: nextApprover._id,
                  type: 'approval_assigned',
                  title: 'New approval request',
                  message: `"${changedContract?.title || 'Untitled contract'}" is now at the ${nextStg.label} stage and requires your approval.`,
                  relatedContractId: cId3,
                });
              }
            }
          }
        }
      }

      if (result.newStage === 'pending_signature') {
        const cId = instance.contractId._id || instance.contractId;
        try {
          const contract = await Contract.findById(cId).select('signatureMode');
          const sigMode = contract?.signatureMode || 'sequential';
          await signatureService.requestSignatures(cId, organizationId, sigMode);
        } catch (err) {
          const logger = (await import('../utils/logger.js')).default;
          logger.warn(`Failed to auto-create signature requests: ${err.message}`);
        }
      }
    }

    return result;
  },

  async reject(workflowInstanceId, userId, comment, organizationId) {
    const canAct = await workflowEngineService.canUserAct(workflowInstanceId, userId);
    if (!canAct) {
      const err = new Error('You do not have permission to reject this stage');
      err.statusCode = 403;
      throw err;
    }

    const result = await workflowEngineService.advance(workflowInstanceId, 'reject', userId, comment);
    const instance = result.instance;

    await Contract.findByIdAndUpdate(instance.contractId._id || instance.contractId, {
      status: 'rejected',
    });

    await auditLogService.log({
      organizationId,
      userId,
      action: `workflow.rejected.${result.stageKey}`,
      entityType: 'WorkflowInstance',
      entityId: workflowInstanceId,
      metadata: {
        contractId: instance.contractId._id || instance.contractId,
        stageKey: result.stageKey,
      },
    });

    eventBus.emit('workflow.rejected', {
      contractId: instance.contractId._id || instance.contractId,
      workflowInstanceId,
      stageKey: result.stageKey,
      organizationId,
      rejectedBy: userId,
    });

    const rejContract = await Contract.findById(instance.contractId._id || instance.contractId).select('ownerId title');
    if (rejContract?.ownerId) {
      const rejOwnerId = rejContract.ownerId._id || rejContract.ownerId;
      if (rejOwnerId.toString() !== userId.toString()) {
        notificationService.enqueueNotification({
          organizationId,
          userId: rejOwnerId,
          type: 'workflow_rejected',
          title: 'Contract rejected',
          message: `"${rejContract.title || 'Untitled contract'}" has been rejected at the ${result.stageKey?.replace(/_/g, ' ') || ''} stage. ${comment ? 'Reason: ' + comment : ''}`,
          relatedContractId: instance.contractId._id || instance.contractId,
        });
      }
    }

    return result;
  },

  async requestChanges(workflowInstanceId, userId, comment, organizationId) {
    const canAct = await workflowEngineService.canUserAct(workflowInstanceId, userId);
    if (!canAct) {
      const err = new Error('You do not have permission to request changes');
      err.statusCode = 403;
      throw err;
    }

    const result = await workflowEngineService.advance(workflowInstanceId, 'request_changes', userId, comment);
    const instance = result.instance;

    await Contract.findByIdAndUpdate(instance.contractId._id || instance.contractId, {
      status: 'draft',
    });

    await auditLogService.log({
      organizationId,
      userId,
      action: 'workflow.requested_changes',
      entityType: 'WorkflowInstance',
      entityId: workflowInstanceId,
      metadata: {
        contractId: instance.contractId._id || instance.contractId,
        sentBackTo: result.stageKey,
      },
    });

    eventBus.emit('workflow.requested_changes', {
      contractId: instance.contractId._id || instance.contractId,
      workflowInstanceId,
      organizationId,
      requestedBy: userId,
    });

    const rcContract = await Contract.findById(instance.contractId._id || instance.contractId).select('ownerId title');
    if (rcContract?.ownerId) {
      const rcOwnerId = rcContract.ownerId._id || rcContract.ownerId;
      if (rcOwnerId.toString() !== userId.toString()) {
        notificationService.enqueueNotification({
          organizationId,
          userId: rcOwnerId,
          type: 'changes_requested',
          title: 'Changes requested',
          message: `Changes have been requested on "${rcContract.title || 'Untitled contract'}". ${comment ? 'Comment: ' + comment : ''}`,
          relatedContractId: instance.contractId._id || instance.contractId,
        });
      }
    }

    return result;
  },

  // --- Queries ---
  async getApprovalInbox(organizationId, userId) {
    const steps = await workflowRepository.findPendingApprovalsForUser(userId, organizationId);
    return steps
      .filter((step) => step.workflowInstanceId && step.workflowInstanceId.contractId)
      .map((step) => ({
        _id: step._id,
        workflowInstanceId: step.workflowInstanceId._id,
        stageKey: step.stageKey,
        status: step.status,
        createdAt: step.createdAt,
        contract: step.workflowInstanceId.contractId,
        submittedBy: step.workflowInstanceId.initiatedBy || null,
      }));
  },

  async getWorkflowForContract(contractId, organizationId) {
    const instance = await workflowRepository.findInstanceByContract(contractId);
    if (!instance || instance.organizationId.toString() !== organizationId) return null;

    const currentStage = await workflowEngineService.getCurrentStage(instance._id);
    const steps = await workflowRepository.findApprovalStepsByInstance(instance._id);

    return {
      instance,
      currentStage,
      steps,
    };
  },

  async getInstance(workflowInstanceId, organizationId) {
    const instance = await workflowRepository.findInstanceById(workflowInstanceId);
    if (!instance || instance.organizationId.toString() !== organizationId) {
      const err = new Error('Workflow instance not found');
      err.statusCode = 404;
      throw err;
    }
    return instance;
  },
};

export default workflowService;
