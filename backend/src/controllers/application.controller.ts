import { Response, NextFunction } from 'express';
import { ApplicationService } from '../services/application.service';
import { sendSuccess } from '../utils/response';
import { AuthenticatedRequest } from '../middleware/auth';

export class ApplicationController {
  static async apply(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { jobId } = req.body;
      const application = await ApplicationService.applyForJob(req.user!.userId, jobId);
      sendSuccess(res, 'Application submitted successfully', application, 201);
    } catch (error) {
      next(error);
    }
  }

  static async updateStatus(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { status, remarks } = req.body;
      const updated = await ApplicationService.updateStatus(
        req.params.id,
        status,
        req.user!.userId,
        remarks
      );
      sendSuccess(res, 'Application status updated successfully', updated, 200);
    } catch (error) {
      next(error);
    }
  }

  static async withdraw(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const updated = await ApplicationService.withdrawApplication(req.user!.userId, req.params.id);
      sendSuccess(res, 'Application withdrawn successfully', updated, 200);
    } catch (error) {
      next(error);
    }
  }

  static async getMyApplications(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const applications = await ApplicationService.getMyApplications(req.user!.userId);
      sendSuccess(res, 'My applications retrieved successfully', applications, 200);
    } catch (error) {
      next(error);
    }
  }

  static async getJobApplications(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const applications = await ApplicationService.getJobApplications(
        req.user!.userId,
        req.params.jobId
      );
      sendSuccess(res, 'Job applications retrieved successfully', applications, 200);
    } catch (error) {
      next(error);
    }
  }
}
