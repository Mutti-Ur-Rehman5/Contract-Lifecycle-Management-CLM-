import workflowService from '../services/workflow.service.js';
import { successResponse } from '../utils/apiResponse.js';
import asyncHandler from '../utils/asyncHandler.js';

// --- Definition CRUD ---
export const listDefinitions = asyncHandler(async (req, res) => {
  const result = await workflowService.getDefinitions(req.organizationId);
  return successResponse(res, result);
});

export const getDefinition = asyncHandler(async (req, res) => {
  const result = await workflowService.getDefinition(req.params.id, req.organizationId);
  return successResponse(res, result);
});

export const createDefinition = asyncHandler(async (req, res) => {
  const result = await workflowService.createDefinition(req.organizationId, req.body);
  return successResponse(res, result, 'Workflow definition created', 201);
});

export const updateDefinition = asyncHandler(async (req, res) => {
  const result = await workflowService.updateDefinition(req.params.id, req.organizationId, req.body);
  return successResponse(res, result, 'Workflow definition updated');
});

export const deleteDefinition = asyncHandler(async (req, res) => {
  await workflowService.deleteDefinition(req.params.id, req.organizationId);
  return successResponse(res, null, 'Workflow definition deleted');
});

export const seedDefinitions = asyncHandler(async (req, res) => {
  const result = await workflowService.seedDefaultDefinitions(req.organizationId);
  return successResponse(res, result, 'Default definitions seeded', 201);
});

// --- Workflow Actions ---
export const submitForApproval = asyncHandler(async (req, res) => {
  const result = await workflowService.submitForApproval(
    req.params.contractId,
    req.organizationId,
    req.user.id
  );
  return successResponse(res, result, 'Contract submitted for approval');
});

export const approveStage = asyncHandler(async (req, res) => {
  const result = await workflowService.approve(
    req.params.instanceId,
    req.user.id,
    req.body.comment || '',
    req.organizationId
  );
  return successResponse(res, result, 'Stage approved');
});

export const rejectStage = asyncHandler(async (req, res) => {
  const result = await workflowService.reject(
    req.params.instanceId,
    req.user.id,
    req.body.comment || '',
    req.organizationId
  );
  return successResponse(res, result, 'Stage rejected');
});

export const requestChanges = asyncHandler(async (req, res) => {
  const result = await workflowService.requestChanges(
    req.params.instanceId,
    req.user.id,
    req.body.comment || '',
    req.organizationId
  );
  return successResponse(res, result, 'Changes requested');
});

// --- Queries ---
export const getApprovalInbox = asyncHandler(async (req, res) => {
  const result = await workflowService.getApprovalInbox(req.organizationId, req.user.id);
  return successResponse(res, result);
});

export const getWorkflowForContract = asyncHandler(async (req, res) => {
  const result = await workflowService.getWorkflowForContract(req.params.contractId, req.organizationId);
  return successResponse(res, result);
});
