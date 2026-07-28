import ContractVersion from '../models/ContractVersion.model.js';

const versionRepository = {
  async create(data) {
    return ContractVersion.create(data);
  },
  async findById(id) {
    return ContractVersion.findById(id);
  },
  async findByContract(contractId) {
    return ContractVersion.find({ contractId }).sort({ versionNumber: -1 });
  },
  async findLatestByContract(contractId) {
    return ContractVersion.findOne({ contractId }).sort({ versionNumber: -1 });
  },
  async getNextVersionNumber(contractId) {
    const latest = await ContractVersion.findOne({ contractId })
      .sort({ versionNumber: -1 })
      .select('versionNumber');
    return latest ? latest.versionNumber + 1 : 1;
  },
  async updateById(id, update) {
    return ContractVersion.findByIdAndUpdate(id, update, { new: true });
  },
  async deleteById(id) {
    return ContractVersion.findByIdAndDelete(id);
  },
};

export default versionRepository;
