import { Router } from 'express';
import { CollegeController } from '../controllers/college.controller';
import { authenticate, authorize } from '../middleware/auth';
import { validateRequest } from '../middleware/validate';
import { updateCollegeProfileSchema, verifyStudentSchema } from '../validators/college.validator';
import { Role } from '@prisma/client';

const router = Router();

// Protect all college routes with RBAC (COLLEGE, ADMIN)
router.use(authenticate, authorize(Role.COLLEGE, Role.ADMIN));

router.get('/profile', CollegeController.getProfile);
router.put('/profile', validateRequest(updateCollegeProfileSchema), CollegeController.updateProfile);
router.get('/dashboard', CollegeController.getDashboard);
router.get('/students', CollegeController.getStudentDirectory);
router.patch('/students/:id/verify', validateRequest(verifyStudentSchema), CollegeController.verifyStudent);
router.get('/drives', CollegeController.getPlacementDrives);
router.get('/drives/:jobId/eligible', CollegeController.getEligibleStudents);

export default router;
