import Signature from '../models/Signature.model.js';

const signatureRepository = {
  async create(data) {
    return Signature.create(data);
  },
  async findById(id) {
    return Signature.findById(id);
  },
  async findByContract(contractId) {
    return Signature.find({ contractId });
  },
  async updateById(id, update) {
    return Signature.findByIdAndUpdate(id, update, { new: true });
  },
};

export default signatureRepository;
