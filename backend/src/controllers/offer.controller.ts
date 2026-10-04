import { Response, NextFunction } from 'express';
import { OfferService } from '../services/offer.service';
import { sendSuccess } from '../utils/response';
import { AuthenticatedRequest } from '../middleware/auth';

export class OfferController {
  static async issueOffer(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const offer = await OfferService.issueOffer(req.user!.userId, req.body);
      sendSuccess(res, 'Placement offer issued successfully', offer, 201);
    } catch (error) {
      next(error);
    }
  }

  static async respondOffer(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { status } = req.body;
      const offer = await OfferService.respondOffer(req.user!.userId, req.params.id, status);
      sendSuccess(res, `Offer ${status.toLowerCase()} successfully`, offer, 200);
    } catch (error) {
      next(error);
    }
  }

  static async getMyOffers(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const offers = await OfferService.getMyOffers(req.user!.userId);
      sendSuccess(res, 'My placement offers retrieved successfully', offers, 200);
    } catch (error) {
      next(error);
    }
  }

  static async getNotifications(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const notifications = await OfferService.getNotifications(req.user!.userId);
      sendSuccess(res, 'User notifications retrieved successfully', notifications, 200);
    } catch (error) {
      next(error);
    }
  }
}
