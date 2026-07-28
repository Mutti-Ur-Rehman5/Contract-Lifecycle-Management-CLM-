import mongoose from 'mongoose';

const departmentSchema = new mongoose.Schema(
  {
    organizationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization', required: true, index: true },
    name: { type: String, required: true, trim: true },
    parentDepartmentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Department', default: null },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

const Department = mongoose.model('Department', departmentSchema);

export default Department;
