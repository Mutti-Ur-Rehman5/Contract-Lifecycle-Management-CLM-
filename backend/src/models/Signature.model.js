import mongoose from 'mongoose';

const signatureSchema = new mongoose.Schema(
  {
    organizationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization', required: true, index: true },
    contractId: { type: mongoose.Schema.Types.ObjectId, ref: 'Contract', required: true, index: true },
    signerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    signerName: { type: String, default: '' },
    signerRole: { type: String, enum: ['signatory', 'admin'], default: 'signatory' },
    signOrder: { type: Number, default: 0 },
    mode: { type: String, enum: ['sequential', 'parallel'], default: 'parallel' },
    status: { type: String, enum: ['pending', 'signed', 'declined'], default: 'pending' },
    signedAt: { type: Date, default: null },
    ipAddress: { type: String, default: null },
    digitalSignature: { type: String, default: null },
    signatureImageUrl: { type: String, default: null },
    auditTrail: [
      {
        action: { type: String },
        timestamp: { type: Date },
        ipAddress: { type: String },
      },
    ],
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

signatureSchema.index({ organizationId: 1, contractId: 1 });
signatureSchema.index({ contractId: 1, signerId: 1 });

const Signature = mongoose.model('Signature', signatureSchema);

export default Signature;
