import mongoose from 'mongoose';

const contractVersionSchema = new mongoose.Schema(
  {
    contractId: { type: mongoose.Schema.Types.ObjectId, ref: 'Contract', required: true, index: true },
    versionNumber: { type: Number, required: true },
    content: { type: String, default: '' },
    pdfFileUrl: { type: String, default: null },
    changeSummary: { type: String, default: '' },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

contractVersionSchema.index({ contractId: 1, versionNumber: 1 });

const ContractVersion = mongoose.model('ContractVersion', contractVersionSchema);

export default ContractVersion;
