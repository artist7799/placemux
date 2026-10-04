import { Response, NextFunction } from 'express';
import { StudentService } from '../services/student.service';
import { sendSuccess } from '../utils/response';
import { AuthenticatedRequest } from '../middleware/auth';

export class StudentController {
  static async getProfile(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const student = await StudentService.getStudentByUserId(req.user!.userId);
      sendSuccess(res, 'Student profile fetched successfully', student, 200);
    } catch (error) {
      next(error);
    }
  }

  static async updateProfile(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const student = await StudentService.updateProfile(req.user!.userId, req.body);
      sendSuccess(res, 'Student profile updated successfully', student, 200);
    } catch (error) {
      next(error);
    }
  }

  // Education
  static async addEducation(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const education = await StudentService.addEducation(req.user!.userId, req.body);
      sendSuccess(res, 'Education added successfully', education, 201);
    } catch (error) {
      next(error);
    }
  }

  static async updateEducation(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const education = await StudentService.updateEducation(req.user!.userId, req.params.id, req.body);
      sendSuccess(res, 'Education updated successfully', education, 200);
    } catch (error) {
      next(error);
    }
  }

  static async deleteEducation(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      await StudentService.deleteEducation(req.user!.userId, req.params.id);
      sendSuccess(res, 'Education deleted successfully', null, 200);
    } catch (error) {
      next(error);
    }
  }

  // Skills
  static async addSkill(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { skillName, category, proficiency } = req.body;
      const skill = await StudentService.addSkill(req.user!.userId, skillName, category, proficiency);
      sendSuccess(res, 'Skill added successfully', skill, 201);
    } catch (error) {
      next(error);
    }
  }

  static async removeSkill(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      await StudentService.removeSkill(req.user!.userId, req.params.id);
      sendSuccess(res, 'Skill removed successfully', null, 200);
    } catch (error) {
      next(error);
    }
  }

  // Projects
  static async addProject(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const project = await StudentService.addProject(req.user!.userId, req.body);
      sendSuccess(res, 'Project added successfully', project, 201);
    } catch (error) {
      next(error);
    }
  }

  static async updateProject(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const project = await StudentService.updateProject(req.user!.userId, req.params.id, req.body);
      sendSuccess(res, 'Project updated successfully', project, 200);
    } catch (error) {
      next(error);
    }
  }

  static async deleteProject(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      await StudentService.deleteProject(req.user!.userId, req.params.id);
      sendSuccess(res, 'Project deleted successfully', null, 200);
    } catch (error) {
      next(error);
    }
  }

  // Certifications
  static async addCertification(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const cert = await StudentService.addCertification(req.user!.userId, req.body);
      sendSuccess(res, 'Certification added successfully', cert, 201);
    } catch (error) {
      next(error);
    }
  }

  static async updateCertification(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const cert = await StudentService.updateCertification(req.user!.userId, req.params.id, req.body);
      sendSuccess(res, 'Certification updated successfully', cert, 200);
    } catch (error) {
      next(error);
    }
  }

  static async deleteCertification(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      await StudentService.deleteCertification(req.user!.userId, req.params.id);
      sendSuccess(res, 'Certification deleted successfully', null, 200);
    } catch (error) {
      next(error);
    }
  }

  // Resumes
  static async uploadResume(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { fileUrl, fileText } = req.body;
      const resume = await StudentService.uploadResume(req.user!.userId, fileUrl, fileText);
      sendSuccess(res, 'Resume uploaded successfully', resume, 201);
    } catch (error) {
      next(error);
    }
  }

  // Dashboard
  static async getDashboard(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const dashboard = await StudentService.getDashboardData(req.user!.userId);
      sendSuccess(res, 'Dashboard data retrieved successfully', dashboard, 200);
    } catch (error) {
      next(error);
    }
  }
}
