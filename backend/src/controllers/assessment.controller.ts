import { Response, NextFunction } from 'express';
import { AssessmentService } from '../services/assessment.service';
import { sendSuccess } from '../utils/response';
import { AuthenticatedRequest } from '../middleware/auth';

export class AssessmentController {
  static async createAssessment(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const assessment = await AssessmentService.createFullAssessmentWithQuestions(req.user!.userId, req.body);
      sendSuccess(res, 'Assessment created successfully', assessment, 201);
    } catch (error) {
      next(error);
    }
  }

  static async getAssignedAssessments(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const assessments = await AssessmentService.getAssignedAssessments(req.user!.userId);
      sendSuccess(res, 'Assigned assessments retrieved', assessments, 200);
    } catch (error) {
      next(error);
    }
  }

  static async startSession(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const sessionData = await AssessmentService.startAssessmentSession(req.user!.userId, req.params.id);
      sendSuccess(res, 'Assessment session started', sessionData, 200);
    } catch (error) {
      next(error);
    }
  }

  static async submitAnswers(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await AssessmentService.submitAnswers(
        req.user!.userId,
        req.params.sessionId,
        req.body.responses
      );
      sendSuccess(res, 'Assessment submitted and scored successfully', result, 200);
    } catch (error) {
      next(error);
    }
  }

  static async getSessionResult(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await AssessmentService.getSessionResult(
        req.user!.userId,
        req.user!.role,
        req.params.sessionId
      );
      sendSuccess(res, 'Assessment session result retrieved', result, 200);
    } catch (error) {
      next(error);
    }
  }

  static async getCompanyAssessmentResults(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const results = await AssessmentService.getAssessmentResultsForCompany(
        req.user!.userId,
        req.params.id
      );
      sendSuccess(res, 'Candidate assessment results retrieved', results, 200);
    } catch (error) {
      next(error);
    }
  }
}
