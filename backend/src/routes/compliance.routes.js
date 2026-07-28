import { Router } from 'express';
import authMiddleware from '../middleware/auth.middleware.js';
import tenantMiddleware from '../middleware/tenant.middleware.js';
import complianceController from '../controllers/compliance.controller.js';

const router = Router();

router.use(authMiddleware, tenantMiddleware);

router.get('/dashboard', complianceController.dashboard);
router.get('/risk-contracts', complianceController.riskContracts);

export default router;
