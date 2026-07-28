import contractRepository from '../repositories/contract.repository.js';
import templateRepository from '../repositories/template.repository.js';
import clauseRepository from '../repositories/clause.repository.js';
import versionRepository from '../repositories/version.repository.js';
import auditLogService from './auditLog.service.js';
import WorkflowInstance from '../models/WorkflowInstance.model.js';
import ApprovalStep from '../models/ApprovalStep.model.js';
import ContractVersion from '../models/ContractVersion.model.js';
import Signature from '../models/Signature.model.js';
import Obligation from '../models/Obligation.model.js';
import Notification from '../models/Notification.model.js';
import AuditLog from '../models/AuditLog.model.js';

const contractService = {
  // --- Templates ---
  async createTemplate(organizationId, data) {
    const template = await templateRepository.create({
      organizationId,
      name: data.name,
      contractType: data.contractType,
      contentTemplate: data.contentTemplate || '',
    });
    return template;
  },

  async listTemplates(organizationId, contractType) {
    if (contractType) return templateRepository.findByOrganizationAndType(organizationId, contractType);
    return templateRepository.findByOrganization(organizationId);
  },

  async getTemplate(templateId, organizationId) {
    const template = await templateRepository.findById(templateId);
    if (!template || template.organizationId.toString() !== organizationId) {
      const err = new Error('Template not found');
      err.statusCode = 404;
      throw err;
    }
    return template;
  },

  async updateTemplate(templateId, organizationId, data) {
    const template = await templateRepository.findById(templateId);
    if (!template || template.organizationId.toString() !== organizationId) {
      const err = new Error('Template not found');
      err.statusCode = 404;
      throw err;
    }
    return templateRepository.updateById(templateId, {
      name: data.name,
      contractType: data.contractType,
      contentTemplate: data.contentTemplate,
    });
  },

  async deleteTemplate(templateId, organizationId) {
    const template = await templateRepository.findById(templateId);
    if (!template || template.organizationId.toString() !== organizationId) {
      const err = new Error('Template not found');
      err.statusCode = 404;
      throw err;
    }
    return templateRepository.deleteById(templateId);
  },

  // --- Clauses ---
  async createClause(organizationId, data) {
    return clauseRepository.create({
      organizationId,
      title: data.title,
      category: data.category || '',
      content: data.content,
      tags: data.tags || [],
    });
  },

  async listClauses(organizationId, category) {
    if (category) return clauseRepository.findByCategory(organizationId, category);
    return clauseRepository.findByOrganization(organizationId);
  },

  async getClause(clauseId, organizationId) {
    const clause = await clauseRepository.findById(clauseId);
    if (!clause || clause.organizationId.toString() !== organizationId) {
      const err = new Error('Clause not found');
      err.statusCode = 404;
      throw err;
    }
    return clause;
  },

  async updateClause(clauseId, organizationId, data) {
    const clause = await clauseRepository.findById(clauseId);
    if (!clause || clause.organizationId.toString() !== organizationId) {
      const err = new Error('Clause not found');
      err.statusCode = 404;
      throw err;
    }
    return clauseRepository.updateById(clauseId, {
      title: data.title,
      category: data.category,
      content: data.content,
      tags: data.tags,
    });
  },

  async deleteClause(clauseId, organizationId) {
    const clause = await clauseRepository.findById(clauseId);
    if (!clause || clause.organizationId.toString() !== organizationId) {
      const err = new Error('Clause not found');
      err.statusCode = 404;
      throw err;
    }
    return clauseRepository.deleteById(clauseId);
  },

  // --- Contracts (list / detail) ---
  async listContracts(organizationId, filters) {
    return contractRepository.findByOrganizationPaginated(organizationId, filters);
  },

  async getContract(contractId, organizationId) {
    const contract = await contractRepository.findById(contractId);
    if (!contract || contract.organizationId.toString() !== organizationId) {
      const err = new Error('Contract not found');
      err.statusCode = 404;
      throw err;
    }
    return contract;
  },

  async getContractVersions(contractId, organizationId) {
    const contract = await contractRepository.findByIdRaw(contractId);
    if (!contract || contract.organizationId.toString() !== organizationId) {
      const err = new Error('Contract not found');
      err.statusCode = 404;
      throw err;
    }
    return versionRepository.findByContract(contractId);
  },

  async deleteContract(contractId, organizationId) {
    const contract = await contractRepository.findByIdRaw(contractId);
    if (!contract || contract.organizationId.toString() !== organizationId) {
      const err = new Error('Contract not found');
      err.statusCode = 404;
      throw err;
    }

    const instances = await WorkflowInstance.find({ contractId }).select('_id');
    const instanceIds = instances.map((i) => i._id);

    if (instanceIds.length) {
      await ApprovalStep.deleteMany({ workflowInstanceId: { $in: instanceIds } });
      await WorkflowInstance.deleteMany({ _id: { $in: instanceIds } });
    }

    await ContractVersion.deleteMany({ contractId });
    await Signature.deleteMany({ contractId });
    await Obligation.deleteMany({ contractId });
    await Notification.updateMany({ relatedContractId: contractId }, { $set: { relatedContractId: null } });
    await AuditLog.deleteMany({ entityType: 'Contract', entityId: contractId });

    await contractRepository.deleteById(contractId);
  },
};

export default contractService;
