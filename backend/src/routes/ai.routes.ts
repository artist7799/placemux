import { Router } from 'express';
import { AIController } from '../controllers/ai.controller';
import { authenticate } from '../middleware/auth';

const router = Router();

// Protect all AI endpoints
router.use(authenticate);

router.post('/resume/analyze', AIController.analyzeResume);
router.post('/jobs/:jobId/match', AIController.matchJob);

export default router;
