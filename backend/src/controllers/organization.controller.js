import organizationService from '../services/organization.service.js';
import { successResponse } from '../utils/apiResponse.js';
import asyncHandler from '../utils/asyncHandler.js';

// --- Departments ---
export const createDepartment = asyncHandler(async (req, res) => {
  const result = await organizationService.createDepartment(req.organizationId, req.body);
  return successResponse(res, result, 'Department created', 201);
});

export const listDepartments = asyncHandler(async (req, res) => {
  const result = await organizationService.listDepartments(req.organizationId);
  return successResponse(res, result);
});

export const updateDepartment = asyncHandler(async (req, res) => {
  const result = await organizationService.updateDepartment(req.params.id, req.organizationId, req.body);
  return successResponse(res, result, 'Department updated');
});

export const deleteDepartment = asyncHandler(async (req, res) => {
  await organizationService.deleteDepartment(req.params.id, req.organizationId);
  return successResponse(res, null, 'Department deleted');
});

// --- Teams ---
export const createTeam = asyncHandler(async (req, res) => {
  const result = await organizationService.createTeam(req.organizationId, req.body);
  return successResponse(res, result, 'Team created', 201);
});

export const listTeams = asyncHandler(async (req, res) => {
  const departmentId = req.query.departmentId || null;
  const result = await organizationService.listTeams(req.organizationId, departmentId);
  return successResponse(res, result);
});

export const updateTeam = asyncHandler(async (req, res) => {
  const result = await organizationService.updateTeam(req.params.id, req.organizationId, req.body);
  return successResponse(res, result, 'Team updated');
});

export const deleteTeam = asyncHandler(async (req, res) => {
  await organizationService.deleteTeam(req.params.id, req.organizationId);
  return successResponse(res, null, 'Team deleted');
});

// --- Branch Offices ---
export const createBranchOffice = asyncHandler(async (req, res) => {
  const result = await organizationService.createBranchOffice(req.organizationId, req.body);
  return successResponse(res, result, 'Branch office created', 201);
});

export const listBranchOffices = asyncHandler(async (req, res) => {
  const result = await organizationService.listBranchOffices(req.organizationId);
  return successResponse(res, result);
});

export const updateBranchOffice = asyncHandler(async (req, res) => {
  const result = await organizationService.updateBranchOffice(req.params.id, req.organizationId, req.body);
  return successResponse(res, result, 'Branch office updated');
});

export const deleteBranchOffice = asyncHandler(async (req, res) => {
  await organizationService.deleteBranchOffice(req.params.id, req.organizationId);
  return successResponse(res, null, 'Branch office deleted');
});

// --- Users ---
export const inviteUser = asyncHandler(async (req, res) => {
  const result = await organizationService.inviteUser(req.organizationId, req.body);
  return successResponse(res, result, 'User invited', 201);
});

export const listUsers = asyncHandler(async (req, res) => {
  const result = await organizationService.listUsers(req.organizationId);
  return successResponse(res, result);
});

export const updateUserRole = asyncHandler(async (req, res) => {
  const result = await organizationService.updateUserRole(req.params.id, req.organizationId, req.body.role);
  return successResponse(res, result, 'User role updated');
});

export const toggleUserActive = asyncHandler(async (req, res) => {
  const result = await organizationService.toggleUserActive(req.params.id, req.organizationId);
  return successResponse(res, result, 'User status toggled');
});
