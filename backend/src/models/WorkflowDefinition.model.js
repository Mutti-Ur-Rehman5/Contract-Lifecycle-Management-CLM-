import mongoose from 'mongoose';

const workflowDefinitionSchema = new mongoose.Schema(
  {
    organizationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization', required: true, index: true },
    name: { type: String, required: true, trim: true },
    contractType: {
      type: String,
      enum: ['employment', 'vendor', 'nda', 'service', 'purchase', 'partnership', 'client'],
      required: true,
    },
    stages: [
      {
        key: { type: String, required: true },
        label: { type: String, required: true },
        approverRole: { type: String, required: true },
        order: { type: Number, required: true },
        isRequired: { type: Boolean, default: true },
      },
    ],
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

workflowDefinitionSchema.index({ organizationId: 1, contractType: 1 });

const WorkflowDefinition = mongoose.model('WorkflowDefinition', workflowDefinitionSchema);

export default WorkflowDefinition;
