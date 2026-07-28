import { GetObjectCommand } from '@aws-sdk/client-s3';
import contractService from '../services/contract.service.js';
import contractBuilderService from '../services/contractBuilder.service.js';
import { pdfGenerationQueue } from '../jobs/queues.js';
import { successResponse } from '../utils/apiResponse.js';
import asyncHandler from '../utils/asyncHandler.js';
import s3 from '../config/s3.js';
import config from '../config/env.js';
import versionRepository from '../repositories/version.repository.js';

// --- Templates ---
export const createTemplate = asyncHandler(async (req, res) => {
  const result = await contractService.createTemplate(req.organizationId, req.body);
  return successResponse(res, result, 'Template created', 201);
});

export const listTemplates = asyncHandler(async (req, res) => {
  const result = await contractService.listTemplates(req.organizationId, req.query.contractType);
  return successResponse(res, result);
});

export const getTemplate = asyncHandler(async (req, res) => {
  const result = await contractService.getTemplate(req.params.id, req.organizationId);
  return successResponse(res, result);
});

export const updateTemplate = asyncHandler(async (req, res) => {
  const result = await contractService.updateTemplate(req.params.id, req.organizationId, req.body);
  return successResponse(res, result, 'Template updated');
});

export const deleteTemplate = asyncHandler(async (req, res) => {
  await contractService.deleteTemplate(req.params.id, req.organizationId);
  return successResponse(res, null, 'Template deleted');
});

// --- Clauses ---
export const createClause = asyncHandler(async (req, res) => {
  const result = await contractService.createClause(req.organizationId, req.body);
  return successResponse(res, result, 'Clause created', 201);
});

export const listClauses = asyncHandler(async (req, res) => {
  const result = await contractService.listClauses(req.organizationId, req.query.category);
  return successResponse(res, result);
});

export const getClause = asyncHandler(async (req, res) => {
  const result = await contractService.getClause(req.params.id, req.organizationId);
  return successResponse(res, result);
});

export const updateClause = asyncHandler(async (req, res) => {
  const result = await contractService.updateClause(req.params.id, req.organizationId, req.body);
  return successResponse(res, result, 'Clause updated');
});

export const deleteClause = asyncHandler(async (req, res) => {
  await contractService.deleteClause(req.params.id, req.organizationId);
  return successResponse(res, null, 'Clause deleted');
});

// --- Contracts ---
export const listContracts = asyncHandler(async (req, res) => {
  const { type, status, search, page, limit } = req.query;
  const result = await contractService.listContracts(req.organizationId, { type, status, search, page, limit });
  return successResponse(res, result);
});

export const getContract = asyncHandler(async (req, res) => {
  const result = await contractService.getContract(req.params.id, req.organizationId);
  return successResponse(res, result);
});

export const getContractVersions = asyncHandler(async (req, res) => {
  const result = await contractService.getContractVersions(req.params.id, req.organizationId);
  return successResponse(res, result);
});

export const deleteContract = asyncHandler(async (req, res) => {
  await contractService.deleteContract(req.params.id, req.organizationId);
  return successResponse(res, null, 'Contract deleted permanently');
});

// --- Contract Builder ---
export const createFromTemplate = asyncHandler(async (req, res) => {
  const result = await contractBuilderService.createFromTemplate(req.organizationId, req.user.id, req.body);
  return successResponse(res, result, 'Contract created', 201);
});

export const saveContract = asyncHandler(async (req, res) => {
  const result = await contractBuilderService.saveContract(req.params.id, req.organizationId, req.user.id, req.body);
  return successResponse(res, result, 'Contract saved');
});

export const getTemplateVariables = asyncHandler(async (req, res) => {
  const result = await contractBuilderService.getTemplateVariables(req.params.id, req.organizationId);
  return successResponse(res, result);
});

// --- PDF Generation ---
export const generatePdf = asyncHandler(async (req, res) => {
  const job = await pdfGenerationQueue.add('generate-pdf', {
    contractId: req.params.id,
    organizationId: req.organizationId,
    userId: req.user.id,
  });
  return successResponse(res, { jobId: job.id }, 'PDF generation queued');
});

// --- PDF Download (proxy with attachment headers) ---
export const downloadPdf = asyncHandler(async (req, res) => {
  const version = await versionRepository.findById(req.params.versionId);
  if (!version || version.contractId.toString() !== req.params.id) {
    return res.status(404).json({ success: false, message: 'Version not found' });
  }
  if (!version.pdfFileUrl) {
    return res.status(404).json({ success: false, message: 'PDF not available for this version' });
  }

  const bucket = config.s3.bucket;
  const key = `org/${req.organizationId}/contracts/${req.params.id}/v${version.versionNumber}.pdf`;

  const command = new GetObjectCommand({ Bucket: bucket, Key: key });
  const response = await s3.send(command);

  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename="contract-v${version.versionNumber}.pdf"`);
  if (response.ContentLength) {
    res.setHeader('Content-Length', response.ContentLength);
  }

  response.Body.pipe(res);
  response.Body.on('error', (err) => {
    if (!res.headersSent) {
      res.status(500).json({ success: false, message: 'PDF stream error' });
    }
  });
});
