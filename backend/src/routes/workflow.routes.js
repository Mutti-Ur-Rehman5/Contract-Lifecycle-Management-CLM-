import { Router } from 'express';
import authMiddleware from '../middleware/auth.middleware.js';
import tenantMiddleware from '../middleware/tenant.middleware.js';
import roleMiddleware from '../middleware/role.middleware.js';
import validate from '../middleware/validate.middleware.js';
import Joi from 'joi';

import {
  listDefinitions,
  getDefinition,
  createDefinition,
  updateDefinition,
  deleteDefinition,
  seedDefinitions,
  submitForApproval,
  approveStage,
  rejectStage,
  requestChanges,
  getApprovalInbox,
  getWorkflowForContract,
} from '../controllers/workflow.controller.js';

const router = Router();

router.use(authMiddleware, tenantMiddleware);

const stageItemSchema = Joi.object({
  key: Joi.string().min(1).max(100).required(),
  label: Joi.string().min(1).max(200).required(),
  approverRole: Joi.string()
    .valid('admin', 'drafter', 'reviewer', 'legal', 'finance', 'executive', 'signatory', 'compliance_officer')
    .required(),
  isRequired: Joi.boolean().optional().default(true),
});

const definitionSchema = Joi.object({
  name: Joi.string().min(1).max(200).required(),
  contractType: Joi.string()
    .valid('employment', 'vendor', 'nda', 'service', 'purchase', 'partnership', 'client')
    .required(),
  stages: Joi.array().items(stageItemSchema).min(1).required(),
});

const commentSchema = Joi.object({
  comment: Joi.string().allow('').optional().default(''),
});

// --- Definition routes (admin only) ---
router.get('/definitions', listDefinitions);
router.get('/definitions/:id', getDefinition);
router.post('/definitions/seed', roleMiddleware(['admin']), seedDefinitions);
router.post('/definitions', roleMiddleware(['admin']), validate(definitionSchema), createDefinition);
router.put('/definitions/:id', roleMiddleware(['admin']), validate(definitionSchema), updateDefinition);
router.delete('/definitions/:id', roleMiddleware(['admin']), deleteDefinition);

// --- Workflow Actions (authenticated org members) ---
router.post('/contracts/:contractId/submit', submitForApproval);
router.get('/contracts/:contractId/workflow', getWorkflowForContract);
router.post('/instances/:instanceId/approve', validate(commentSchema), approveStage);
router.post('/instances/:instanceId/reject', validate(commentSchema), rejectStage);
router.post('/instances/:instanceId/request-changes', validate(commentSchema), requestChanges);

// --- Inbox ---
router.get('/inbox', getApprovalInbox);

export default router;
