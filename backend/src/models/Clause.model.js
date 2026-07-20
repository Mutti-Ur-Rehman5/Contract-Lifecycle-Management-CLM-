import mongoose from 'mongoose';

const clauseSchema = new mongoose.Schema(
  {
    organizationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization', required: true, index: true },
    title: { type: String, required: true, trim: true },
    category: { type: String, trim: true },
    content: { type: String, required: true },
    tags: [{ type: String, trim: true }],
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

clauseSchema.index({ organizationId: 1 });

const Clause = mongoose.model('Clause', clauseSchema);

export default Clause;
