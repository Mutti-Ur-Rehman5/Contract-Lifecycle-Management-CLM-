import contractRepository from '../repositories/contract.repository.js';
import templateRepository from '../repositories/template.repository.js';
import versionRepository from '../repositories/version.repository.js';
import auditLogService from './auditLog.service.js';

const VARIABLE_REGEX = /\{\{(\w+)\}\}/g;

function extractTemplateVariables(content) {
  const vars = new Set();
  let match;
  while ((match = VARIABLE_REGEX.exec(content)) !== null) {
    vars.add(match[1]);
  }
  return [...vars];
}

function substituteVariables(content, variables) {
  return content.replace(VARIABLE_REGEX, (_, name) => {
    return variables[name] !== undefined && variables[name] !== null ? variables[name] : `{{${name}}}`;
  });
}

const contractBuilderService = {
  async createFromTemplate(organizationId, userId, data) {
    const template = await templateRepository.findById(data.templateId);
    if (!template || template.organizationId.toString() !== organizationId) {
      const err = new Error('Template not found');
      err.statusCode = 404;
      throw err;
    }

    const resolvedContent = substituteVariables(template.contentTemplate, data.variables || {});

    const contract = await contractRepository.create({
      organizationId,
      title: data.title,
      type: template.contractType,
      status: 'draft',
      templateId: template._id,
      ownerId: userId,
      parties: data.parties || [],
      startDate: data.startDate || null,
      endDate: data.endDate || null,
      signatureMode: data.signatureMode || 'sequential',
    });

    const version = await versionRepository.create({
      contractId: contract._id,
      versionNumber: 1,
      content: resolvedContent,
      changeSummary: 'Created from template',
      createdBy: userId,
    });

    await contractRepository.updateById(contract._id, { currentVersionId: version._id });

    await auditLogService.log({
      organizationId,
      userId,
      action: 'contract.created',
      entityType: 'Contract',
      entityId: contract._id,
      metadata: { templateId: template._id, title: data.title },
    });

    const populated = await contractRepository.findById(contract._id);
    return populated;
  },

  async saveContract(contractId, organizationId, userId, data) {
    const contract = await contractRepository.findByIdRaw(contractId);
    if (!contract || contract.organizationId.toString() !== organizationId) {
      const err = new Error('Contract not found');
      err.statusCode = 404;
      throw err;
    }

    const nextVersion = await versionRepository.getNextVersionNumber(contractId);

    const version = await versionRepository.create({
      contractId,
      versionNumber: nextVersion,
      content: data.content,
      changeSummary: data.changeSummary || '',
      createdBy: userId,
    });

    await contractRepository.updateById(contractId, { currentVersionId: version._id });

    if (data.title) {
      await contractRepository.updateById(contractId, { title: data.title });
    }

    await auditLogService.log({
      organizationId,
      userId,
      action: 'contract.saved',
      entityType: 'ContractVersion',
      entityId: version._id,
      metadata: { contractId, versionNumber: nextVersion },
    });

    await auditLogService.log({
      organizationId,
      userId,
      action: 'version.created',
      entityType: 'ContractVersion',
      entityId: version._id,
      metadata: { contractId, versionNumber: nextVersion, changeSummary: data.changeSummary || '' },
    });

    return version;
  },

  async getTemplateVariables(templateId, organizationId) {
    const template = await templateRepository.findById(templateId);
    if (!template || template.organizationId.toString() !== organizationId) {
      const err = new Error('Template not found');
      err.statusCode = 404;
      throw err;
    }
    return extractTemplateVariables(template.contentTemplate);
  },
};

export { extractTemplateVariables, substituteVariables };
export default contractBuilderService;
