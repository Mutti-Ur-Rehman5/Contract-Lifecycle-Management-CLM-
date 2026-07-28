import { Router } from 'express';
import authMiddleware from '../middleware/auth.middleware.js';
import tenantMiddleware from '../middleware/tenant.middleware.js';
import roleMiddleware from '../middleware/role.middleware.js';
import validate from '../middleware/validate.middleware.js';
import obligationController from '../controllers/obligation.controller.js';
import Joi from 'joi';

const router = Router();

router.use(authMiddleware, tenantMiddleware);

const createSchema = Joi.object({
  contractId: Joi.string().allow(null, '').optional(),
  type: Joi.string().valid('payment', 'delivery', 'report', 'renewal', 'audit', 'compliance', 'other').required(),
  title: Joi.string().min(2).max(200).required(),
  description: Joi.string().allow('').optional(),
  dueDate: Joi.date().required(),
  assignedToUserId: Joi.string().allow(null, '').optional(),
});

const updateSchema = Joi.object({
  contractId: Joi.string().allow(null, '').optional(),
  type: Joi.string().valid('payment', 'delivery', 'report', 'renewal', 'audit', 'compliance', 'other').optional(),
  title: Joi.string().min(2).max(200).optional(),
  description: Joi.string().allow('').optional(),
  dueDate: Joi.date().optional(),
  status: Joi.string().valid('pending', 'completed', 'overdue', 'cancelled').optional(),
  assignedToUserId: Joi.string().allow(null, '').optional(),
}).min(1);

router.get('/stats', obligationController.stats);
router.get('/upcoming', obligationController.upcoming);
router.get('/overdue', obligationController.overdue);
router.get('/', obligationController.list);
router.get('/:id', obligationController.getOne);

router.post('/', roleMiddleware(['admin', 'legal']), validate(createSchema), obligationController.create);
router.patch('/:id', roleMiddleware(['admin', 'legal']), validate(updateSchema), obligationController.update);
router.delete('/:id', roleMiddleware(['admin', 'legal']), obligationController.remove);

export default router;
