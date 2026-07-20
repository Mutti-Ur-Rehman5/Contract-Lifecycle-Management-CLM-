import { Router } from 'express';
import { register, login } from '../controllers/auth.controller.js';
import validate from '../middleware/validate.middleware.js';
import Joi from 'joi';

const router = Router();

const registerSchema = Joi.object({
  name: Joi.string().min(2).max(100).required(),
  email: Joi.string().email().required(),
  password: Joi.string().min(8).required(),
  orgName: Joi.string().min(2).max(200).required(),
  orgSlug: Joi.string().min(2).max(100).required(),
});

const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().required(),
});

router.post('/register', validate(registerSchema), register);
router.post('/login', validate(loginSchema), login);

export default router;
