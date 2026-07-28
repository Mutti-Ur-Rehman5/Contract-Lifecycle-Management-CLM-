import mongoose from 'mongoose';

const workflowInstanceSchema = new mongoose.Schema(
  {
    organizationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization', required: true, index: true },
    contractId: { type: mongoose.Schema.Types.ObjectId, ref: 'Contract', required: true, index: true },
    workflowDefinitionId: { type: mongoose.Schema.Types.ObjectId, ref: 'WorkflowDefinition', required: true },
    currentStageKey: { type: String, required: true },
    currentStageIndex: { type: Number, default: 0 },
    status: {
      type: String,
      enum: ['in_progress', 'completed', 'rejected'],
      default: 'in_progress',
    },
    contractStatus: {
      type: String,
      enum: [
        'draft', 'internal_review', 'legal_review', 'finance_approval',
        'executive_approval', 'pending_signature', 'published', 'archived',
      ],
      default: 'draft',
    },
    initiatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: { createdAt: true, updatedAt: true } }
);

workflowInstanceSchema.index({ organizationId: 1, status: 1 });

const WorkflowInstance = mongoose.model('WorkflowInstance', workflowInstanceSchema);

export default WorkflowInstance;
