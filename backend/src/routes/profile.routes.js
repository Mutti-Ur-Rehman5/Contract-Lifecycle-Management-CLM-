import { Router } from 'express';
import multer from 'multer';
import authMiddleware from '../middleware/auth.middleware.js';
import profileController from '../controllers/profile.controller.js';
import validate from '../middleware/validate.middleware.js';
import Joi from 'joi';

const router = Router();

router.use(authMiddleware);

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'), false);
    }
  },
});

const updateProfileSchema = Joi.object({
  name: Joi.string().min(2).max(100).optional(),
  email: Joi.string().email().optional(),
  phone: Joi.string().allow('').max(30).optional(),
  jobTitle: Joi.string().allow('').max(100).optional(),
  timezone: Joi.string().max(50).optional(),
}).min(1);

const changePasswordSchema = Joi.object({
  currentPassword: Joi.string().required(),
  newPassword: Joi.string().min(8).max(128).required(),
});

router.get('/', profileController.getProfile);
router.put('/', validate(updateProfileSchema), profileController.updateProfile);
router.put('/password', validate(changePasswordSchema), profileController.changePassword);
router.post('/picture', upload.single('picture'), profileController.uploadPicture);
router.delete('/picture', profileController.removePicture);

export default router;
