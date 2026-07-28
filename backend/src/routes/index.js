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
import profileRoutes from './profile.routes.js';
import passwordResetRoutes from './passwordReset.routes.js';
import chatRoutes from './chat.routes.js';
import dashboardRoutes from './dashboard.routes.js';
import { apiLimiter } from '../middleware/rateLimit.middleware.js';

const router = Router();

router.use('/v1', healthRoutes);
router.use('/v1/auth', authRoutes);
router.use('/v1/auth', passwordResetRoutes);
router.use('/v1/organizations', apiLimiter, organizationRoutes);
router.use('/v1/contracts', apiLimiter, contractRoutes);
router.use('/v1/workflows', apiLimiter, workflowRoutes);
router.use('/v1/signatures', apiLimiter, signatureRoutes);
router.use('/v1/obligations', apiLimiter, obligationRoutes);
router.use('/v1/compliance', apiLimiter, complianceRoutes);
router.use('/v1/notifications', apiLimiter, notificationRoutes);
router.use('/v1/profile', profileRoutes);
router.use('/v1/dashboard', apiLimiter, dashboardRoutes);
router.use('/v1/chat', apiLimiter, chatRoutes);

export default router;
