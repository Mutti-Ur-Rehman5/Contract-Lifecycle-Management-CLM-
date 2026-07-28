import { Router } from 'express';
import authMiddleware from '../middleware/auth.middleware.js';
import tenantMiddleware from '../middleware/tenant.middleware.js';
import validate from '../middleware/validate.middleware.js';
import Joi from 'joi';

import {
  requestSignatures,
  sign,
  decline,
  getSignatureStatus,
  uploadSignatureImage,
  compareVersions,
  rollbackVersion,
} from '../controllers/signature.controller.js';

const router = Router();

router.use(authMiddleware, tenantMiddleware);

const signSchema = Joi.object({
  signatureImageUrl: Joi.string().allow('', null).optional(),
});

const declineSchema = Joi.object({
  comment: Joi.string().allow('').optional().default(''),
});

const rollbackSchema = Joi.object({
  targetVersionId: Joi.string().hex().length(24).required(),
});

const requestSchema = Joi.object({
  mode: Joi.string().valid('sequential', 'parallel').optional().default('sequential'),
});

const uploadImageSchema = Joi.object({
  imageBase64: Joi.string().required(),
});

router.post('/contracts/:contractId/request', validate(requestSchema), requestSignatures);
router.post('/contracts/:contractId/upload-image', validate(uploadImageSchema), uploadSignatureImage);
router.post('/contracts/:contractId/sign', validate(signSchema), sign);
router.post('/contracts/:contractId/decline', validate(declineSchema), decline);
router.get('/contracts/:contractId/status', getSignatureStatus);

router.get('/contracts/:contractId/versions/compare', compareVersions);
router.post('/contracts/:contractId/versions/rollback', validate(rollbackSchema), rollbackVersion);

export default router;
