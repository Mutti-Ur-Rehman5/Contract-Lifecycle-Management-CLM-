import mongoose from 'mongoose';

const teamSchema = new mongoose.Schema(
  {
    organizationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization', required: true, index: true },
    name: { type: String, required: true, trim: true },
    departmentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Department' },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

teamSchema.index({ organizationId: 1 });

const Team = mongoose.model('Team', teamSchema);

export default Team;
