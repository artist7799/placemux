import { Request, Response, NextFunction } from 'express';
import { JobService } from '../services/job.service';
import { sendSuccess } from '../utils/response';
import { AuthenticatedRequest } from '../middleware/auth';
import { JobType, JobStatus } from '@prisma/client';

export class JobController {
  static async createJob(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const job = await JobService.createJob(req.user!.userId, req.body);
      sendSuccess(res, 'Job created successfully', job, 201);
    } catch (error) {
      next(error);
    }
  }

  static async updateJob(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const job = await JobService.updateJob(req.user!.userId, req.params.id, req.body);
      sendSuccess(res, 'Job updated successfully', job, 200);
    } catch (error) {
      next(error);
    }
  }

  static async updateJobStatus(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const job = await JobService.updateJobStatus(req.user!.userId, req.params.id, req.body.status);
      sendSuccess(res, 'Job status updated successfully', job, 200);
    } catch (error) {
      next(error);
    }
  }

  static async deleteJob(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      await JobService.deleteJob(req.user!.userId, req.params.id);
      sendSuccess(res, 'Job deleted successfully', null, 200);
    } catch (error) {
      next(error);
    }
  }

  static async getJobById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const studentUserId = (req as AuthenticatedRequest).user?.userId;
      const job = await JobService.getJobById(req.params.id, studentUserId);
      sendSuccess(res, 'Job details retrieved', job, 200);
    } catch (error) {
      next(error);
    }
  }

  static async searchJobs(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const filters = {
        search: req.query.search as string,
        location: req.query.location as string,
        jobType: req.query.jobType as JobType,
        branch: req.query.branch as string,
        status: req.query.status as JobStatus,
      };
      const jobs = await JobService.searchJobs(filters);
      sendSuccess(res, 'Jobs retrieved successfully', jobs, 200);
    } catch (error) {
      next(error);
    }
  }

  static async getCompanyJobs(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const jobs = await JobService.getCompanyJobs(req.user!.userId);
      sendSuccess(res, 'Company jobs retrieved successfully', jobs, 200);
    } catch (error) {
      next(error);
    }
  }
}
