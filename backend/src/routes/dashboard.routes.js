import { Router } from 'express';
import authMiddleware from '../middleware/auth.middleware.js';
import tenantMiddleware from '../middleware/tenant.middleware.js';
import dashboardController from '../controllers/dashboard.controller.js';

const router = Router();

router.use(authMiddleware, tenantMiddleware);

router.get('/', dashboardController.getDashboard);

export default router;
