import { Router } from 'express';
import { AssessmentController } from '../controllers/assessment.controller';
import { authenticate, authorize } from '../middleware/auth';
import { validateRequest } from '../middleware/validate';
import { createAssessmentSchema, submitAnswersSchema } from '../validators/assessment.validator';
import { Role } from '@prisma/client';

const router = Router();

// Student routes
router.get('/assigned', authenticate, authorize(Role.STUDENT, Role.ADMIN), AssessmentController.getAssignedAssessments);
router.post('/:id/start', authenticate, authorize(Role.STUDENT, Role.ADMIN), AssessmentController.startSession);
router.post('/sessions/:sessionId/submit', authenticate, authorize(Role.STUDENT, Role.ADMIN), validateRequest(submitAnswersSchema), AssessmentController.submitAnswers);
router.get('/sessions/:sessionId/result', authenticate, AssessmentController.getSessionResult);

// Company & Admin routes
router.post('/', authenticate, authorize(Role.COMPANY, Role.ADMIN), validateRequest(createAssessmentSchema), AssessmentController.createAssessment);
router.get('/:id/results', authenticate, authorize(Role.COMPANY, Role.ADMIN), AssessmentController.getCompanyAssessmentResults);

export default router;
