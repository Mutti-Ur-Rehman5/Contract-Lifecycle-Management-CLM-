import Signature from '../models/Signature.model.js';

const signatureRepository = {
  async create(data) {
    return Signature.create(data);
  },
  async createMany(dataArray) {
    return Signature.insertMany(dataArray);
  },
  async findById(id) {
    return Signature.findById(id);
  },
  async findByContract(contractId) {
    return Signature.find({ contractId }).populate('signerId', 'name email role').sort({ signOrder: 1 });
  },
  async findByContractAndSigner(contractId, signerId) {
    return Signature.findOne({ contractId, signerId });
  },
  async countSignedByContract(contractId) {
    return Signature.countDocuments({ contractId, status: 'signed' });
  },
  async countTotalByContract(contractId) {
    return Signature.countDocuments({ contractId });
  },
  async updateById(id, update) {
    return Signature.findByIdAndUpdate(id, update, { new: true });
  },
  async updateByContractAndSigner(contractId, signerId, update) {
    return Signature.findOneAndUpdate({ contractId, signerId }, update, { new: true });
  },
  async deleteByContract(contractId) {
    return Signature.deleteMany({ contractId });
  },
};

export default signatureRepository;
