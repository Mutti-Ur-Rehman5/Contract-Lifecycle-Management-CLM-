import { Router } from 'express';
import authMiddleware from '../middleware/auth.middleware.js';
import tenantMiddleware from '../middleware/tenant.middleware.js';
import roleMiddleware from '../middleware/role.middleware.js';
import validate from '../middleware/validate.middleware.js';
import Joi from 'joi';

import {
  createDepartment,
  listDepartments,
  updateDepartment,
  deleteDepartment,
  createTeam,
  listTeams,
  updateTeam,
  deleteTeam,
  createBranchOffice,
  listBranchOffices,
  updateBranchOffice,
  deleteBranchOffice,
  inviteUser,
  listUsers,
  updateUserRole,
  toggleUserActive,
} from '../controllers/organization.controller.js';

const router = Router();

// All org routes require auth + tenant context
router.use(authMiddleware, tenantMiddleware);

// --- Validation schemas ---
const nameSchema = Joi.object({
  name: Joi.string().min(1).max(200).required(),
  parentDepartmentId: Joi.string().hex().length(24).allow(null),
});

const teamSchema = Joi.object({
  name: Joi.string().min(1).max(200).required(),
  departmentId: Joi.string().hex().length(24).allow(null),
});

const branchOfficeSchema = Joi.object({
  name: Joi.string().min(1).max(200).required(),
  address: Joi.string().allow('').optional(),
  timezone: Joi.string().optional(),
});

const inviteSchema = Joi.object({
  name: Joi.string().min(2).max(100).required(),
  email: Joi.string().email().required(),
  password: Joi.string().min(8).max(128).required(),
  role: Joi.string()
    .valid('admin', 'drafter', 'reviewer', 'legal', 'finance', 'executive', 'signatory', 'compliance_officer')
    .required(),
  departmentId: Joi.string().hex().length(24).allow(null).optional(),
});

const roleUpdateSchema = Joi.object({
  role: Joi.string()
    .valid('admin', 'drafter', 'reviewer', 'legal', 'finance', 'executive', 'signatory', 'compliance_officer')
    .required(),
});

const updateNameSchema = Joi.object({
  name: Joi.string().min(1).max(200).required(),
  parentDepartmentId: Joi.string().hex().length(24).allow(null).optional(),
});

const updateTeamSchema = Joi.object({
  name: Joi.string().min(1).max(200).required(),
  departmentId: Joi.string().hex().length(24).allow(null).optional(),
});

const updateBranchSchema = Joi.object({
  name: Joi.string().min(1).max(200).required(),
  address: Joi.string().allow('').optional(),
  timezone: Joi.string().optional(),
});

// --- Department routes ---
router.get('/departments', listDepartments);
router.post('/departments', roleMiddleware(['admin']), validate(nameSchema), createDepartment);
router.put('/departments/:id', roleMiddleware(['admin']), validate(updateNameSchema), updateDepartment);
router.delete('/departments/:id', roleMiddleware(['admin']), deleteDepartment);

// --- Team routes ---
router.get('/teams', listTeams);
router.post('/teams', roleMiddleware(['admin']), validate(teamSchema), createTeam);
router.put('/teams/:id', roleMiddleware(['admin']), validate(updateTeamSchema), updateTeam);
router.delete('/teams/:id', roleMiddleware(['admin']), deleteTeam);

// --- Branch Office routes ---
router.get('/branch-offices', listBranchOffices);
router.post('/branch-offices', roleMiddleware(['admin']), validate(branchOfficeSchema), createBranchOffice);
router.put('/branch-offices/:id', roleMiddleware(['admin']), validate(updateBranchSchema), updateBranchOffice);
router.delete('/branch-offices/:id', roleMiddleware(['admin']), deleteBranchOffice);

// --- User management routes ---
router.get('/users', listUsers);
router.post('/users/invite', roleMiddleware(['admin']), validate(inviteSchema), inviteUser);
router.patch('/users/:id/role', roleMiddleware(['admin']), validate(roleUpdateSchema), updateUserRole);
router.patch('/users/:id/toggle-active', roleMiddleware(['admin']), toggleUserActive);

export default router;
