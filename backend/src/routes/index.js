import { Router } from 'express';
import healthRoutes from './health.routes.js';
import authRoutes from './auth.routes.js';
import organizationRoutes from './organization.routes.js';
import contractRoutes from './contract.routes.js';
import workflowRoutes from './workflow.routes.js';
import signatureRoutes from './signature.routes.js';
import obligationRoutes from './obligation.routes.js';
import complianceRoutes from './compliance.routes.js';
import notificationRoutes from './notification.routes.js';

const router = Router();

router.use('/v1', healthRoutes);
router.use('/v1/auth', authRoutes);
router.use('/v1/organizations', organizationRoutes);
router.use('/v1/contracts', contractRoutes);
router.use('/v1/workflows', workflowRoutes);
router.use('/v1/signatures', signatureRoutes);
router.use('/v1/obligations', obligationRoutes);
router.use('/v1/compliance', complianceRoutes);
router.use('/v1/notifications', notificationRoutes);

export default router;
