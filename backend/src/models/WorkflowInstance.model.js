import mongoose from 'mongoose';

const workflowInstanceSchema = new mongoose.Schema(
  {
    contractId: { type: mongoose.Schema.Types.ObjectId, ref: 'Contract', required: true, index: true },
    workflowDefinitionId: { type: mongoose.Schema.Types.ObjectId, ref: 'WorkflowDefinition', required: true },
    currentStageKey: { type: String, required: true },
    status: {
      type: String,
      enum: ['in_progress', 'completed', 'rejected'],
      default: 'in_progress',
    },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

workflowInstanceSchema.index({ contractId: 1 });

const WorkflowInstance = mongoose.model('WorkflowInstance', workflowInstanceSchema);

export default WorkflowInstance;
