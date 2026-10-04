import { Router } from 'express';
import { StudentController } from '../controllers/student.controller';
import { authenticate, authorize } from '../middleware/auth';
import { validateRequest } from '../middleware/validate';
import {
  updateProfileSchema,
  educationSchema,
  addSkillSchema,
  projectSchema,
  certificationSchema,
  resumeSchema,
} from '../validators/student.validator';
import { Role } from '@prisma/client';

const router = Router();

// Protect all student endpoints
router.use(authenticate, authorize(Role.STUDENT, Role.ADMIN));

router.get('/profile', StudentController.getProfile);
router.put('/profile', validateRequest(updateProfileSchema), StudentController.updateProfile);

router.post('/education', validateRequest(educationSchema), StudentController.addEducation);
router.put('/education/:id', validateRequest(educationSchema), StudentController.updateEducation);
router.delete('/education/:id', StudentController.deleteEducation);

router.post('/skills', validateRequest(addSkillSchema), StudentController.addSkill);
router.delete('/skills/:id', StudentController.removeSkill);

router.post('/projects', validateRequest(projectSchema), StudentController.addProject);
router.put('/projects/:id', validateRequest(projectSchema), StudentController.updateProject);
router.delete('/projects/:id', StudentController.deleteProject);

router.post('/certifications', validateRequest(certificationSchema), StudentController.addCertification);
router.put('/certifications/:id', validateRequest(certificationSchema), StudentController.updateCertification);
router.delete('/certifications/:id', StudentController.deleteCertification);

router.post('/resume', validateRequest(resumeSchema), StudentController.uploadResume);

router.get('/dashboard', StudentController.getDashboard);

export default router;
