import { Response, NextFunction } from 'express';
import { InterviewService } from '../services/interview.service';
import { sendSuccess } from '../utils/response';
import { AuthenticatedRequest } from '../middleware/auth';

export class InterviewController {
  static async scheduleInterview(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const interview = await InterviewService.scheduleInterview(req.user!.userId, req.body);
      sendSuccess(res, 'Interview scheduled successfully', interview, 201);
    } catch (error) {
      next(error);
    }
  }

  static async submitFeedback(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const feedback = await InterviewService.submitFeedback(
        req.user!.userId,
        req.params.id,
        req.body
      );
      sendSuccess(res, 'Interview feedback submitted successfully', feedback, 201);
    } catch (error) {
      next(error);
    }
  }

  static async getMyInterviews(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const interviews = await InterviewService.getMyInterviews(req.user!.userId);
      sendSuccess(res, 'Scheduled interviews retrieved successfully', interviews, 200);
    } catch (error) {
      next(error);
    }
  }
}
