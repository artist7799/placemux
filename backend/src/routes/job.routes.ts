import { Router } from 'express';
import { JobController } from '../controllers/job.controller';
import { authenticate, authorize } from '../middleware/auth';
import { validateRequest } from '../middleware/validate';
import { createJobSchema, updateJobSchema, updateJobStatusSchema } from '../validators/job.validator';
import { Role } from '@prisma/client';

const router = Router();

// Public / Search endpoints
router.get('/', JobController.searchJobs);
router.get('/:id', JobController.getJobById);

// Company job management
router.get('/company/my-jobs', authenticate, authorize(Role.COMPANY, Role.ADMIN), JobController.getCompanyJobs);
router.post('/', authenticate, authorize(Role.COMPANY, Role.ADMIN), validateRequest(createJobSchema), JobController.createJob);
router.put('/:id', authenticate, authorize(Role.COMPANY, Role.ADMIN), validateRequest(updateJobSchema), JobController.updateJob);
router.patch('/:id/status', authenticate, authorize(Role.COMPANY, Role.ADMIN), validateRequest(updateJobStatusSchema), JobController.updateJobStatus);
router.delete('/:id', authenticate, authorize(Role.COMPANY, Role.ADMIN), JobController.deleteJob);

export default router;
