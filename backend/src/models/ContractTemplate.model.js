import mongoose from 'mongoose';

const contractTemplateSchema = new mongoose.Schema(
  {
    organizationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization', required: true, index: true },
    name: { type: String, required: true, trim: true },
    contractType: {
      type: String,
      enum: ['employment', 'vendor', 'nda', 'service', 'purchase', 'partnership', 'client'],
      required: true,
    },
    contentTemplate: { type: String, default: '' },
    defaultWorkflowDefinitionId: { type: mongoose.Schema.Types.ObjectId, ref: 'WorkflowDefinition' },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

const ContractTemplate = mongoose.model('ContractTemplate', contractTemplateSchema);

export default ContractTemplate;
