import { Response, NextFunction } from 'express';
import { CollegeService } from '../services/college.service';
import { sendSuccess } from '../utils/response';
import { AuthenticatedRequest } from '../middleware/auth';
import { PlacementStatus } from '@prisma/client';

export class CollegeController {
  static async getProfile(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const college = await CollegeService.getCollegeByUserId(req.user!.userId);
      sendSuccess(res, 'College profile retrieved successfully', college, 200);
    } catch (error) {
      next(error);
    }
  }

  static async updateProfile(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const updated = await CollegeService.updateProfile(req.user!.userId, req.body);
      sendSuccess(res, 'College profile updated successfully', updated, 200);
    } catch (error) {
      next(error);
    }
  }

  static async getDashboard(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const metrics = await CollegeService.getDashboardMetrics(req.user!.userId);
      sendSuccess(res, 'College placement metrics retrieved successfully', metrics, 200);
    } catch (error) {
      next(error);
    }
  }

  static async getStudentDirectory(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const filters = {
        branch: req.query.branch as string,
        graduationYear: req.query.graduationYear ? Number(req.query.graduationYear) : undefined,
        minCgpa: req.query.minCgpa ? Number(req.query.minCgpa) : undefined,
        placementStatus: req.query.placementStatus as PlacementStatus,
        search: req.query.search as string,
      };
      const students = await CollegeService.getStudentDirectory(req.user!.userId, filters);
      sendSuccess(res, 'Student directory retrieved successfully', students, 200);
    } catch (error) {
      next(error);
    }
  }

  static async verifyStudent(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { isVerified } = req.body;
      const student = await CollegeService.verifyStudent(req.user!.userId, req.params.id, isVerified);
      sendSuccess(res, `Student verification status set to ${isVerified}`, student, 200);
    } catch (error) {
      next(error);
    }
  }

  static async getPlacementDrives(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const drives = await CollegeService.getPlacementDrives(req.user!.userId);
      sendSuccess(res, 'Campus placement drives retrieved successfully', drives, 200);
    } catch (error) {
      next(error);
    }
  }

  static async getEligibleStudents(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const eligibleList = await CollegeService.getEligibleStudentsForJob(req.user!.userId, req.params.jobId);
      sendSuccess(res, 'Eligible students list calculated successfully', eligibleList, 200);
    } catch (error) {
      next(error);
    }
  }
}
