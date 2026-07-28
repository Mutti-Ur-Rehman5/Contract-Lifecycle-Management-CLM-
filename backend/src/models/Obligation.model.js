import mongoose from 'mongoose';

const obligationSchema = new mongoose.Schema(
  {
    contractId: { type: mongoose.Schema.Types.ObjectId, ref: 'Contract', required: true, index: true },
    organizationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization', required: true, index: true },
    type: {
      type: String,
      enum: ['deliverable', 'payment_milestone', 'renewal_date', 'compliance_task', 'sla_commitment'],
      required: true,
    },
    title: { type: String, required: true, trim: true },
    dueDate: { type: Date, required: true },
    status: { type: String, enum: ['pending', 'completed', 'overdue'], default: 'pending' },
    assignedToUserId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

obligationSchema.index({ organizationId: 1, dueDate: 1 });

const Obligation = mongoose.model('Obligation', obligationSchema);

export default Obligation;
