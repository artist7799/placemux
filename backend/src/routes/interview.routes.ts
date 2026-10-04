import { Router } from 'express';
import { InterviewController } from '../controllers/interview.controller';
import { authenticate, authorize } from '../middleware/auth';
import { validateRequest } from '../middleware/validate';
import { scheduleInterviewSchema, interviewFeedbackSchema } from '../validators/interview.validator';
import { Role } from '@prisma/client';

const router = Router();

// Student endpoints
router.get('/my-interviews', authenticate, authorize(Role.STUDENT, Role.ADMIN), InterviewController.getMyInterviews);

// Company & Admin endpoints
router.post('/schedule', authenticate, authorize(Role.COMPANY, Role.ADMIN), validateRequest(scheduleInterviewSchema), InterviewController.scheduleInterview);
router.post('/:id/feedback', authenticate, authorize(Role.COMPANY, Role.ADMIN), validateRequest(interviewFeedbackSchema), InterviewController.submitFeedback);

export default router;
