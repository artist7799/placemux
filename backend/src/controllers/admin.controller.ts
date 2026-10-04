import { Response, NextFunction } from 'express';
import { AdminService } from '../services/admin.service';
import { sendSuccess } from '../utils/response';
import { AuthenticatedRequest } from '../middleware/auth';
import { Role, UserStatus, JobStatus, ApplicationStatus } from '@prisma/client';

export class AdminController {
  static async getAnalytics(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const filters = {
        startDate: req.query.startDate as string,
        endDate: req.query.endDate as string,
        collegeId: req.query.collegeId as string,
        companyId: req.query.companyId as string,
        jobId: req.query.jobId as string,
        applicationStatus: req.query.applicationStatus as ApplicationStatus,
      };

      const data = await AdminService.getAnalytics(filters);
      sendSuccess(res, 'System analytics retrieved successfully', data, 200);
    } catch (error) {
      next(error);
    }
  }

  static async getUsers(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await AdminService.getUsers({
        role: req.query.role as Role,
        status: req.query.status as UserStatus,
        search: req.query.search as string,
        page: req.query.page ? Number(req.query.page) : 1,
        limit: req.query.limit ? Number(req.query.limit) : 20,
      });

      sendSuccess(res, 'Users list retrieved successfully', result, 200);
    } catch (error) {
      next(error);
    }
  }

  static async updateUserStatus(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const updated = await AdminService.updateUserStatus(
        req.user!.userId,
        req.params.id,
        req.body,
        req.ip
      );
      sendSuccess(res, 'User status updated successfully', updated, 200);
    } catch (error) {
      next(error);
    }
  }

  static async getCompanies(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const companies = await AdminService.getCompanies();
      sendSuccess(res, 'Companies list retrieved successfully', companies, 200);
    } catch (error) {
      next(error);
    }
  }

  static async verifyCompany(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { isVerified } = req.body;
      const updated = await AdminService.verifyCompany(
        req.user!.userId,
        req.params.id,
        isVerified,
        req.ip
      );
      sendSuccess(res, `Company verification status set to ${isVerified}`, updated, 200);
    } catch (error) {
      next(error);
    }
  }

  static async getColleges(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const colleges = await AdminService.getColleges();
      sendSuccess(res, 'Colleges list retrieved successfully', colleges, 200);
    } catch (error) {
      next(error);
    }
  }

  static async getJobs(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const jobs = await AdminService.getJobs({
        status: req.query.status as JobStatus,
        search: req.query.search as string,
      });
      sendSuccess(res, 'Job postings retrieved successfully', jobs, 200);
    } catch (error) {
      next(error);
    }
  }

  static async updateJobStatus(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { status } = req.body;
      const updated = await AdminService.updateJobStatus(
        req.user!.userId,
        req.params.id,
        status,
        req.ip
      );
      sendSuccess(res, `Job drive status set to ${status}`, updated, 200);
    } catch (error) {
      next(error);
    }
  }

  static async getApplications(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const applications = await AdminService.getApplications({
        status: req.query.status as ApplicationStatus,
      });
      sendSuccess(res, 'Applications monitoring list retrieved', applications, 200);
    } catch (error) {
      next(error);
    }
  }

  static async getAssessments(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const assessments = await AdminService.getAssessments();
      sendSuccess(res, 'Assessments monitoring list retrieved', assessments, 200);
    } catch (error) {
      next(error);
    }
  }

  static async getOffers(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const offers = await AdminService.getOffers();
      sendSuccess(res, 'Offers monitoring list retrieved', offers, 200);
    } catch (error) {
      next(error);
    }
  }

  static async getAuditLogs(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const logs = await AdminService.getAuditLogs(100);
      sendSuccess(res, 'System audit logs retrieved successfully', logs, 200);
    } catch (error) {
      next(error);
    }
  }
}
