import mongoose from 'mongoose';

const approvalStepSchema = new mongoose.Schema(
  {
    workflowInstanceId: { type: mongoose.Schema.Types.ObjectId, ref: 'WorkflowInstance', required: true, index: true },
    stageKey: { type: String, required: true },
    assignedToUserId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected', 'skipped'],
      default: 'pending',
    },
    comment: { type: String, default: '' },
    decidedAt: { type: Date, default: null },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

approvalStepSchema.index({ workflowInstanceId: 1, stageKey: 1 });

const ApprovalStep = mongoose.model('ApprovalStep', approvalStepSchema);

export default ApprovalStep;
