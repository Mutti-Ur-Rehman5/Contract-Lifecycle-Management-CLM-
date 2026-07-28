import WorkflowDefinition from '../models/WorkflowDefinition.model.js';
import WorkflowInstance from '../models/WorkflowInstance.model.js';
import ApprovalStep from '../models/ApprovalStep.model.js';

const workflowRepository = {
  // --- Definitions ---
  async createDefinition(data) {
    return WorkflowDefinition.create(data);
  },
  async findDefinitionById(id) {
    return WorkflowDefinition.findById(id);
  },
  async findDefinitionsByOrganization(organizationId) {
    return WorkflowDefinition.find({ organizationId }).sort({ contractType: 1 });
  },
  async findDefinitionByContractType(organizationId, contractType) {
    return WorkflowDefinition.findOne({ organizationId, contractType });
  },
  async updateDefinitionById(id, data) {
    return WorkflowDefinition.findByIdAndUpdate(id, data, { new: true });
  },
  async deleteDefinitionById(id) {
    return WorkflowDefinition.findByIdAndDelete(id);
  },

  // --- Instances ---
  async createInstance(data) {
    return WorkflowInstance.create(data);
  },
  async findInstanceById(id) {
    return WorkflowInstance.findById(id).populate('contractId').populate('workflowDefinitionId');
  },
  async findInstanceByContract(contractId) {
    return WorkflowInstance.findOne({ contractId });
  },
  async updateInstance(id, update) {
    return WorkflowInstance.findByIdAndUpdate(id, update, { new: true });
  },
  async findPendingByOrgAndUser(organizationId, userId) {
    return WorkflowInstance.find({
      organizationId,
      status: 'in_progress',
    })
      .populate({
        path: 'contractId',
        select: 'title type status ownerId',
        match: { status: { $ne: 'archived' } },
      })
      .populate('workflowDefinitionId', 'name stages');
  },

  // --- Approval Steps ---
  async createApprovalStep(data) {
    return ApprovalStep.create(data);
  },
  async findApprovalStepsByInstance(workflowInstanceId) {
    return ApprovalStep.find({ workflowInstanceId }).sort({ createdAt: 1 });
  },
  async findApprovalStep(workflowInstanceId, stageKey, assignedToUserId) {
    return ApprovalStep.findOne({ workflowInstanceId, stageKey, assignedToUserId });
  },
  async findPendingStepForUser(workflowInstanceId, stageKey, userId) {
    return ApprovalStep.findOne({ workflowInstanceId, stageKey, assignedToUserId: userId, status: 'pending' });
  },
  async findPendingApprovalsForUser(userId, organizationId) {
    return ApprovalStep.find({
      assignedToUserId: userId,
      status: 'pending',
    })
      .populate({
        path: 'workflowInstanceId',
        match: { organizationId, status: 'in_progress' },
        populate: [
          { path: 'contractId', select: 'title type status' },
          { path: 'initiatedBy', select: 'name email role' },
        ],
      });
  },
  async updateApprovalStep(id, update) {
    return ApprovalStep.findByIdAndUpdate(id, update, { new: true });
  },
  async skipPendingStepsForStage(workflowInstanceId, stageKey) {
    return ApprovalStep.updateMany(
      { workflowInstanceId, stageKey, status: 'pending' },
      { status: 'skipped', decidedAt: new Date() }
    );
  },
};

export default workflowRepository;
