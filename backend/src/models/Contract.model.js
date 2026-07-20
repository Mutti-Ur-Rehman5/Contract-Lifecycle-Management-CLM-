import mongoose from 'mongoose';

const contractSchema = new mongoose.Schema(
  {
    organizationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization', required: true, index: true },
    title: { type: String, required: true, trim: true },
    type: {
      type: String,
      enum: ['employment', 'vendor', 'nda', 'service', 'purchase', 'partnership', 'client'],
      required: true,
    },
    status: {
      type: String,
      enum: [
        'draft',
        'internal_review',
        'legal_review',
        'finance_approval',
        'executive_approval',
        'pending_signature',
        'published',
        'archived',
        'rejected',
      ],
      default: 'draft',
    },
    currentVersionId: { type: mongoose.Schema.Types.ObjectId, ref: 'ContractVersion' },
    templateId: { type: mongoose.Schema.Types.ObjectId, ref: 'ContractTemplate' },
    workflowInstanceId: { type: mongoose.Schema.Types.ObjectId, ref: 'WorkflowInstance' },
    ownerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    parties: [
      {
        name: { type: String, trim: true },
        email: { type: String, lowercase: true, trim: true },
        role: { type: String, trim: true },
      },
    ],
    startDate: { type: Date },
    endDate: { type: Date },
  },
  { timestamps: true }
);

contractSchema.index({ organizationId: 1, status: 1 });
contractSchema.index({ organizationId: 1, type: 1 });
contractSchema.index({ ownerId: 1 });

const Contract = mongoose.model('Contract', contractSchema);

export default Contract;
