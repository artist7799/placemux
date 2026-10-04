import { Response, NextFunction } from 'express';
import { AIService } from '../services/ai.service';
import { prisma } from '../config/prisma';
import { sendSuccess } from '../utils/response';
import { AuthenticatedRequest } from '../middleware/auth';

export class AIController {
  static async analyzeResume(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { rawText, targetRole } = req.body;
      const result = await AIService.analyzeResume(rawText, targetRole);
      sendSuccess(res, 'Resume AI analysis generated successfully', result, 200);
    } catch (error) {
      next(error);
    }
  }

  static async matchJob(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { jobId } = req.params;

      const job = await prisma.job.findUnique({
        where: { id: jobId },
        include: { jobSkills: { include: { skill: true } } },
      });

      if (!job) {
        const error: any = new Error('Job not found');
        error.statusCode = 404;
        throw error;
      }

      // Fetch student profile if user is a student
      const student = await prisma.student.findUnique({
        where: { userId: req.user!.userId },
        include: { skills: { include: { skill: true } } },
      });

      const studentSkills = student
        ? student.skills.map((s) => s.skill.name)
        : req.body.studentSkills || [];

      const requiredSkills = job.jobSkills.map((js) => js.skill.name);

      const result = await AIService.matchJob(
        {
          id: student?.id,
          firstName: student?.firstName,
          lastName: student?.lastName,
          branch: student?.branch || undefined,
          cgpa: student?.cgpa || undefined,
          graduationYear: student?.graduationYear || undefined,
        },
        studentSkills,
        req.body.resumeSkills || [],
        {
          jobId: job.id,
          title: job.title,
          description: job.description || undefined,
          required_skills: requiredSkills.length > 0 ? requiredSkills : req.body.requiredSkills || [],
          min_cgpa: job.minCgpa || undefined,
          eligible_branches: job.eligibleBranches || [],
        }
      );

      sendSuccess(res, 'Job match compatibility calculated successfully', result, 200);
    } catch (error) {
      next(error);
    }
  }
}
