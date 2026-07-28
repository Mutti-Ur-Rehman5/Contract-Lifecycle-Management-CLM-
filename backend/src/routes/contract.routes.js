import { Router } from 'express';
import authMiddleware from '../middleware/auth.middleware.js';
import tenantMiddleware from '../middleware/tenant.middleware.js';
import roleMiddleware from '../middleware/role.middleware.js';
import validate from '../middleware/validate.middleware.js';
import Joi from 'joi';

import {
  createTemplate,
  listTemplates,
  getTemplate,
  updateTemplate,
  deleteTemplate,
  createClause,
  listClauses,
  getClause,
  updateClause,
  deleteClause,
  listContracts,
  getContract,
  getContractVersions,
  deleteContract,
  createFromTemplate,
  saveContract,
  getTemplateVariables,
  generatePdf,
  downloadPdf,
} from '../controllers/contract.controller.js';

const router = Router();

router.use(authMiddleware, tenantMiddleware);

// --- Validation schemas ---
const templateSchema = Joi.object({
  name: Joi.string().min(1).max(200).required(),
  contractType: Joi.string()
    .valid('employment', 'vendor', 'nda', 'service', 'purchase', 'partnership', 'client')
    .required(),
  contentTemplate: Joi.string().allow('').optional(),
});

const clauseSchema = Joi.object({
  title: Joi.string().min(1).max(200).required(),
  category: Joi.string().allow('').optional(),
  content: Joi.string().required(),
  tags: Joi.array().items(Joi.string()).optional(),
});

const createContractSchema = Joi.object({
  templateId: Joi.string().hex().length(24).required(),
  title: Joi.string().min(1).max(200).required(),
  variables: Joi.object().pattern(Joi.string(), Joi.string().allow('')).optional().default({}),
  parties: Joi.array()
    .items(Joi.object({ name: Joi.string(), email: Joi.string().email().allow(''), role: Joi.string() }))
    .optional(),
  startDate: Joi.date().iso().allow(null).optional(),
  endDate: Joi.date().iso().allow(null).optional(),
  signatureMode: Joi.string().valid('sequential', 'parallel').optional().default('sequential'),
});

const saveContractSchema = Joi.object({
  content: Joi.string().required(),
  title: Joi.string().min(1).max(200).optional(),
  changeSummary: Joi.string().allow('').optional().default(''),
});

// --- Template routes ---
router.get('/templates', listTemplates);
router.get('/templates/:id', getTemplate);
router.get('/templates/:id/variables', getTemplateVariables);
router.post('/templates', roleMiddleware(['admin']), validate(templateSchema), createTemplate);
router.put('/templates/:id', roleMiddleware(['admin']), validate(templateSchema), updateTemplate);
router.delete('/templates/:id', roleMiddleware(['admin']), deleteTemplate);

// --- Clause routes ---
router.get('/clauses', listClauses);
router.get('/clauses/:id', getClause);
router.post('/clauses', roleMiddleware(['admin', 'drafter']), validate(clauseSchema), createClause);
router.put('/clauses/:id', roleMiddleware(['admin', 'drafter']), validate(clauseSchema), updateClause);
router.delete('/clauses/:id', roleMiddleware(['admin']), deleteClause);

// --- Contract routes ---
router.get('/', listContracts);
router.get('/:id', getContract);
router.get('/:id/versions', getContractVersions);
router.post('/from-template', roleMiddleware(['admin', 'drafter']), validate(createContractSchema), createFromTemplate);
router.put('/:id/save', roleMiddleware(['admin', 'drafter']), validate(saveContractSchema), saveContract);
router.delete('/:id', roleMiddleware(['admin']), deleteContract);

// --- PDF ---
router.post('/:id/generate-pdf', roleMiddleware(['admin', 'drafter']), generatePdf);
router.get('/:id/pdf/:versionId', downloadPdf);

export default router;
