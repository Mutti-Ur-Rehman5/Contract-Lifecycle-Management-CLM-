import workflowRepository from '../repositories/workflow.repository.js';
import eventBus from '../events/eventBus.js';

const workflowEngineService = {
  async advance(workflowInstanceId, decision, actorId, comment = '') {
    const instance = await workflowRepository.findInstanceById(workflowInstanceId);
    if (!instance) throw Object.assign(new Error('Workflow instance not found'), { statusCode: 404 });

    const definition = await workflowRepository.findDefinitionById(instance.workflowDefinitionId);
    if (!definition) throw Object.assign(new Error('Workflow definition not found'), { statusCode: 404 });

    const currentStage = definition.stages.find((s) => s.key === instance.currentStageKey);
    if (!currentStage) throw Object.assign(new Error('Current stage not found'), { statusCode: 404 });

    const approvalStep = await workflowRepository.createApprovalStep({
      workflowInstanceId,
      stageKey: currentStage.key,
      assignedToUserId: actorId,
      status: decision === 'approve' ? 'approved' : 'rejected',
      comment,
      decidedAt: new Date(),
    });

    if (decision === 'reject') {
      await workflowRepository.updateInstance(workflowInstanceId, { status: 'rejected' });
      eventBus.emit('contract.rejected', { contractId: instance.contractId, stageKey: currentStage.key });
      return { instance, decision: 'rejected' };
    }

    const sortedStages = [...definition.stages].sort((a, b) => a.order - b.order);
    const currentIndex = sortedStages.findIndex((s) => s.key === instance.currentStageKey);
    const nextStage = sortedStages[currentIndex + 1];

    if (!nextStage) {
      await workflowRepository.updateInstance(workflowInstanceId, {
        status: 'completed',
        currentStageKey: currentStage.key,
      });
      eventBus.emit('contract.approved', { contractId: instance.contractId, stageKey: currentStage.key });
      return { instance, decision: 'completed' };
    }

    await workflowRepository.updateInstance(workflowInstanceId, { currentStageKey: nextStage.key });
    eventBus.emit('contract.stage_changed', {
      contractId: instance.contractId,
      oldStage: currentStage.key,
      newStage: nextStage.key,
    });

    return { instance, decision: 'advanced', newStage: nextStage.key };
  },

  async getCurrentStage(workflowInstanceId) {
    const instance = await workflowRepository.findInstanceById(workflowInstanceId);
    if (!instance) throw Object.assign(new Error('Workflow instance not found'), { statusCode: 404 });
    return instance.currentStageKey;
  },

  async canUserAct(workflowInstanceId, userId) {
    const instance = await workflowRepository.findInstanceById(workflowInstanceId);
    if (!instance) return false;
    const definition = await workflowRepository.findDefinitionById(instance.workflowDefinitionId);
    if (!definition) return false;
    const currentStage = definition.stages.find((s) => s.key === instance.currentStageKey);
    if (!currentStage) return false;
    const User = (await import('../models/User.model.js')).default;
    const user = await User.findById(userId);
    return user && user.role === currentStage.approverRole;
  },
};

export default workflowEngineService;
