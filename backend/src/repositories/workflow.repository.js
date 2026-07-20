import WorkflowDefinition from '../models/WorkflowDefinition.model.js';
import WorkflowInstance from '../models/WorkflowInstance.model.js';
import ApprovalStep from '../models/ApprovalStep.model.js';

const workflowRepository = {
  async createDefinition(data) {
    return WorkflowDefinition.create(data);
  },
  async findDefinitionById(id) {
    return WorkflowDefinition.findById(id);
  },
  async findDefinitionsByOrganization(organizationId) {
    return WorkflowDefinition.find({ organizationId });
  },
  async createInstance(data) {
    return WorkflowInstance.create(data);
  },
  async findInstanceById(id) {
    return WorkflowInstance.findById(id);
  },
  async updateInstance(id, update) {
    return WorkflowInstance.findByIdAndUpdate(id, update, { new: true });
  },
  async createApprovalStep(data) {
    return ApprovalStep.create(data);
  },
  async findApprovalSteps(workflowInstanceId) {
    return ApprovalStep.find({ workflowInstanceId });
  },
  async updateApprovalStep(id, update) {
    return ApprovalStep.findByIdAndUpdate(id, update, { new: true });
  },
};

export default workflowRepository;
