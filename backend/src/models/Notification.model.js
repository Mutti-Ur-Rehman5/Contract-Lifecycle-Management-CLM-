import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema(
  {
    organizationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization', required: true, index: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    type: {
      type: String,
      required: true,
      enum: [
        'workflow_approved', 'workflow_rejected', 'workflow_changes_requested', 'workflow_completed',
        'signature_requested', 'signature_signed', 'signature_declined',
        'contract_expiring', 'contract_expired',
        'obligation_due', 'obligation_overdue',
      ],
    },
    title: { type: String, required: true },
    message: { type: String, default: '' },
    relatedContractId: { type: mongoose.Schema.Types.ObjectId, ref: 'Contract', default: null },
    isRead: { type: Boolean, default: false },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

notificationSchema.index({ userId: 1, isRead: 1 });

const Notification = mongoose.model('Notification', notificationSchema);

export default Notification;
