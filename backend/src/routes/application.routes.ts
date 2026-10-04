import { Router } from 'express';
import { ApplicationController } from '../controllers/application.controller';
import { authenticate, authorize } from '../middleware/auth';
import { validateRequest } from '../middleware/validate';
import { applyJobSchema, updateApplicationStatusSchema } from '../validators/application.validator';
import { Role } from '@prisma/client';

const router = Router();

// Student endpoints
router.post('/apply', authenticate, authorize(Role.STUDENT), validateRequest(applyJobSchema), ApplicationController.apply);
router.get('/my-applications', authenticate, authorize(Role.STUDENT), ApplicationController.getMyApplications);
router.patch('/:id/withdraw', authenticate, authorize(Role.STUDENT), ApplicationController.withdraw);

// Company & Admin status management
router.get('/job/:jobId', authenticate, authorize(Role.COMPANY, Role.ADMIN), ApplicationController.getJobApplications);
router.patch('/:id/status', authenticate, authorize(Role.COMPANY, Role.ADMIN), validateRequest(updateApplicationStatusSchema), ApplicationController.updateStatus);

export default router;
