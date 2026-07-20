import mongoose from 'mongoose';

const branchOfficeSchema = new mongoose.Schema(
  {
    organizationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization', required: true, index: true },
    name: { type: String, required: true, trim: true },
    address: { type: String, trim: true },
    timezone: { type: String, default: 'UTC' },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

branchOfficeSchema.index({ organizationId: 1 });

const BranchOffice = mongoose.model('BranchOffice', branchOfficeSchema);

export default BranchOffice;
