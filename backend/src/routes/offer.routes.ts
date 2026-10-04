import { Router } from 'express';
import { OfferController } from '../controllers/offer.controller';
import { authenticate, authorize } from '../middleware/auth';
import { validateRequest } from '../middleware/validate';
import { issueOfferSchema, respondOfferSchema } from '../validators/offer.validator';
import { Role } from '@prisma/client';

const router = Router();

// Student endpoints
router.get('/my-offers', authenticate, authorize(Role.STUDENT, Role.ADMIN), OfferController.getMyOffers);
router.patch('/:id/respond', authenticate, authorize(Role.STUDENT, Role.ADMIN), validateRequest(respondOfferSchema), OfferController.respondOffer);
router.get('/notifications', authenticate, OfferController.getNotifications);

// Company & Admin endpoints
router.post('/issue', authenticate, authorize(Role.COMPANY, Role.ADMIN), validateRequest(issueOfferSchema), OfferController.issueOffer);

export default router;
