import workflowRepository from '../repositories/workflow.repository.js';
import User from '../models/User.model.js';

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

const workflowEngineService = {
  async advance(workflowInstanceId, decision, actorId, comment = '') {
    const instance = await workflowRepository.findInstanceById(workflowInstanceId);
    if (!instance) {
      const err = new Error('Workflow instance not found');
      err.statusCode = 404;
      throw err;
    }

    const definition = await workflowRepository.findDefinitionById(instance.workflowDefinitionId);
    if (!definition) {
      const err = new Error('Workflow definition not found');
      err.statusCode = 404;
      throw err;
    }

    const sortedStages = [...definition.stages].sort((a, b) => a.order - b.order);
    const currentIndex = sortedStages.findIndex((s) => s.key === instance.currentStageKey);
    if (currentIndex === -1) {
      const err = new Error('Current stage not found in definition');
      err.statusCode = 400;
      throw err;
    }

    const currentStage = sortedStages[currentIndex];

    if (decision === 'approve') {
      const existingStep = await workflowRepository.findPendingStepForUser(workflowInstanceId, currentStage.key, actorId);

      let approvalStep;
      if (existingStep) {
        approvalStep = await workflowRepository.updateApprovalStep(existingStep._id, {
          status: 'approved',
          comment,
          decidedAt: new Date(),
        });
      } else {
        approvalStep = await workflowRepository.createApprovalStep({
          workflowInstanceId,
          stageKey: currentStage.key,
          assignedToUserId: actorId,
          status: 'approved',
          comment,
          decidedAt: new Date(),
        });
      }

      const nextStage = sortedStages[currentIndex + 1];

      if (!nextStage) {
        const updated = await workflowRepository.updateInstance(workflowInstanceId, {
          status: 'completed',
          contractStatus: 'published',
        });
        return {
          instance: updated,
          decision: 'completed',
          stageKey: currentStage.key,
          approvalStep,
        };
      }

      const updated = await workflowRepository.updateInstance(workflowInstanceId, {
        currentStageKey: nextStage.key,
        currentStageIndex: currentIndex + 1,
        contractStatus: nextStage.key,
      });

      await createPendingStepsForStage(workflowInstanceId, instance.organizationId, nextStage);

      return {
        instance: updated,
        decision: 'advanced',
        previousStage: currentStage.key,
        newStage: nextStage.key,
        approvalStep,
      };
    }

    if (decision === 'reject') {
      const existingStep = await workflowRepository.findPendingStepForUser(workflowInstanceId, currentStage.key, actorId);

      let approvalStep;
      if (existingStep) {
        approvalStep = await workflowRepository.updateApprovalStep(existingStep._id, {
          status: 'rejected',
          comment,
          decidedAt: new Date(),
        });
      } else {
        approvalStep = await workflowRepository.createApprovalStep({
          workflowInstanceId,
          stageKey: currentStage.key,
          assignedToUserId: actorId,
          status: 'rejected',
          comment,
          decidedAt: new Date(),
        });
      }

      const updated = await workflowRepository.updateInstance(workflowInstanceId, {
        status: 'rejected',
        contractStatus: 'rejected',
      });

      return {
        instance: updated,
        decision: 'rejected',
        stageKey: currentStage.key,
        approvalStep,
      };
    }

    if (decision === 'request_changes') {
      const existingStep = await workflowRepository.findPendingStepForUser(workflowInstanceId, currentStage.key, actorId);

      let approvalStep;
      if (existingStep) {
        approvalStep = await workflowRepository.updateApprovalStep(existingStep._id, {
          status: 'rejected',
          comment,
          decidedAt: new Date(),
        });
      } else {
        approvalStep = await workflowRepository.createApprovalStep({
          workflowInstanceId,
          stageKey: currentStage.key,
          assignedToUserId: actorId,
          status: 'rejected',
          comment,
          decidedAt: new Date(),
        });
      }

      const firstStage = sortedStages[0];

      await workflowRepository.skipPendingStepsForStage(workflowInstanceId, currentStage.key);

      const updated = await workflowRepository.updateInstance(workflowInstanceId, {
        currentStageKey: firstStage.key,
        currentStageIndex: 0,
        contractStatus: 'draft',
      });

      return {
        instance: updated,
        decision: 'sent_back',
        stageKey: firstStage.key,
        approvalStep,
      };
    }

    const err = new Error(`Unknown decision: ${decision}`);
    err.statusCode = 400;
    throw err;
  },

  async getCurrentStage(workflowInstanceId) {
    const instance = await workflowRepository.findInstanceById(workflowInstanceId);
    if (!instance) {
      const err = new Error('Workflow instance not found');
      err.statusCode = 404;
      throw err;
    }

    const definition = await workflowRepository.findDefinitionById(instance.workflowDefinitionId);
    if (!definition) {
      const err = new Error('Workflow definition not found');
      err.statusCode = 404;
      throw err;
    }

    const currentStage = definition.stages.find((s) => s.key === instance.currentStageKey);
    return {
      stageKey: instance.currentStageKey,
      stageIndex: instance.currentStageIndex,
      stage: currentStage || null,
      workflowStatus: instance.status,
      contractStatus: instance.contractStatus,
      totalStages: definition.stages.length,
      definitionName: definition.name,
      stages: definition.stages,
    };
  },

  async canUserAct(workflowInstanceId, userId) {
    const instance = await workflowRepository.findInstanceById(workflowInstanceId);
    if (!instance) return false;

    if (instance.status !== 'in_progress') return false;

    const definition = await workflowRepository.findDefinitionById(instance.workflowDefinitionId);
    if (!definition) return false;

    const currentStage = definition.stages.find((s) => s.key === instance.currentStageKey);
    if (!currentStage) return false;

    const pendingStep = await workflowRepository.findPendingStepForUser(
      workflowInstanceId,
      currentStage.key,
      userId
    );
    if (pendingStep) return true;

    const existingStep = await workflowRepository.findApprovalStep(
      workflowInstanceId,
      currentStage.key,
      userId
    );
    if (existingStep && existingStep.status !== 'pending') return false;

    const User = (await import('../models/User.model.js')).default;
    const user = await User.findById(userId);
    if (!user || !user.isActive) return false;

    return user.role === currentStage.approverRole || user.role === 'admin';
  },
};

export default workflowEngineService;
