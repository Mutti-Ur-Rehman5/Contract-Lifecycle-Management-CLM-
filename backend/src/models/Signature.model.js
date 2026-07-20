import mongoose from 'mongoose';

const signatureSchema = new mongoose.Schema(
  {
    contractId: { type: mongoose.Schema.Types.ObjectId, ref: 'Contract', required: true, index: true },
    signerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    signOrder: { type: Number, default: 0 },
    mode: { type: String, enum: ['sequential', 'parallel'], default: 'parallel' },
    status: { type: String, enum: ['pending', 'signed', 'declined'], default: 'pending' },
    signedAt: { type: Date, default: null },
    ipAddress: { type: String, default: null },
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

signatureSchema.index({ contractId: 1, signerId: 1 });

const Signature = mongoose.model('Signature', signatureSchema);

export default Signature;
