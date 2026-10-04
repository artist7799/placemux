import { Router } from 'express';
import { AdminController } from '../controllers/admin.controller';
import { authenticate, authorize } from '../middleware/auth';
import { validateRequest } from '../middleware/validate';
import {
  updateUserStatusSchema,
  verifyCompanySchema,
  updateJobStatusSchema,
} from '../validators/admin.validator';
import { Role } from '@prisma/client';

const router = Router();

// Enforce strict RBAC: ONLY ADMIN role allowed
router.use(authenticate, authorize(Role.ADMIN));

router.get('/analytics', AdminController.getAnalytics);
router.get('/users', AdminController.getUsers);
router.patch('/users/:id/status', validateRequest(updateUserStatusSchema), AdminController.updateUserStatus);
router.get('/companies', AdminController.getCompanies);
router.patch('/companies/:id/verify', validateRequest(verifyCompanySchema), AdminController.verifyCompany);
router.get('/colleges', AdminController.getColleges);
router.get('/jobs', AdminController.getJobs);
router.patch('/jobs/:id/status', validateRequest(updateJobStatusSchema), AdminController.updateJobStatus);
router.get('/applications', AdminController.getApplications);
router.get('/assessments', AdminController.getAssessments);
router.get('/offers', AdminController.getOffers);
router.get('/audit-logs', AdminController.getAuditLogs);

export default router;
