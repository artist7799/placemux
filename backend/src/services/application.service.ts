import { prisma } from '../config/prisma';
import { ApplicationStatus, JobStatus } from '@prisma/client';

export class ApplicationService {
  static async applyForJob(studentUserId: string, jobId: string) {
    const student = await prisma.student.findUnique({
      where: { userId: studentUserId },
      include: { skills: { include: { skill: true } } },
    });

    if (!student) {
      const error: any = new Error('Student profile not found');
      error.statusCode = 404;
      throw error;
    }

    const job = await prisma.job.findUnique({
      where: { id: jobId },
      include: { jobSkills: { include: { skill: true } } },
    });

    if (!job) {
      const error: any = new Error('Job posting not found');
      error.statusCode = 404;
      throw error;
    }

    if (job.status !== JobStatus.ACTIVE) {
      const error: any = new Error('Cannot apply to closed or inactive job postings');
      error.statusCode = 400;
      throw error;
    }

    // Duplicate check
    const existingApp = await prisma.application.findUnique({
      where: {
        jobId_studentId: {
          jobId: job.id,
          studentId: student.id,
        },
      },
    });

    if (existingApp) {
      const error: any = new Error('You have already submitted an application for this job posting');
      error.statusCode = 400;
      throw error;
    }

    // CGPA Eligibility Verification
    if (job.minCgpa && (student.cgpa || 0) < job.minCgpa) {
      const error: any = new Error(
        `You do not meet the minimum CGPA requirement of ${job.minCgpa} for this position`
      );
      error.statusCode = 400;
      throw error;
    }

    // Match Score Calculation Heuristic
    let matchScore = 50.0; // Base score
    const studentSkillNames = new Set(student.skills.map((s) => s.skill.name.toLowerCase()));
    const requiredSkillNames = job.jobSkills.map((js) => js.skill.name.toLowerCase());

    if (requiredSkillNames.length > 0) {
      const matched = requiredSkillNames.filter((name) => studentSkillNames.has(name));
      matchScore = Math.min(100, 40 + (matched.length / requiredSkillNames.length) * 60);
    }

    return prisma.$transaction(async (tx) => {
      const application = await tx.application.create({
        data: {
          jobId: job.id,
          studentId: student.id,
          currentStatus: ApplicationStatus.APPLIED,
          matchScore: Math.round(matchScore),
        },
        include: {
          job: { select: { title: true, company: { select: { name: true } } } },
        },
      });

      await tx.applicationStatusHistory.create({
        data: {
          applicationId: application.id,
          status: ApplicationStatus.APPLIED,
          changedBy: studentUserId,
          remarks: 'Application submitted successfully by student',
        },
      });

      return application;
    });
  }

  static async updateStatus(
    applicationId: string,
    newStatus: ApplicationStatus,
    changedByUserId: string,
    remarks?: string
  ) {
    const application = await prisma.application.findUnique({
      where: { id: applicationId },
      include: { job: true },
    });

    if (!application) {
      const error: any = new Error('Application record not found');
      error.statusCode = 404;
      throw error;
    }

    return prisma.$transaction(async (tx) => {
      const updatedApp = await tx.application.update({
        where: { id: applicationId },
        data: { currentStatus: newStatus },
      });

      await tx.applicationStatusHistory.create({
        data: {
          applicationId: application.id,
          status: newStatus,
          changedBy: changedByUserId,
          remarks: remarks || `Status updated to ${newStatus}`,
        },
      });

      return updatedApp;
    });
  }

  static async withdrawApplication(studentUserId: string, applicationId: string) {
    const student = await prisma.student.findUnique({ where: { userId: studentUserId } });
    if (!student) {
      const error: any = new Error('Student profile not found');
      error.statusCode = 404;
      throw error;
    }

    const application = await prisma.application.findUnique({ where: { id: applicationId } });
    if (!application) {
      const error: any = new Error('Application record not found');
      error.statusCode = 404;
      throw error;
    }

    if (application.studentId !== student.id) {
      const error: any = new Error('Unauthorized to withdraw this application');
      error.statusCode = 403;
      throw error;
    }

    if (application.currentStatus === ApplicationStatus.WITHDRAWN) {
      const error: any = new Error('Application is already withdrawn');
      error.statusCode = 400;
      throw error;
    }

    return prisma.$transaction(async (tx) => {
      const updated = await tx.application.update({
        where: { id: applicationId },
        data: { currentStatus: ApplicationStatus.WITHDRAWN },
      });

      await tx.applicationStatusHistory.create({
        data: {
          applicationId: application.id,
          status: ApplicationStatus.WITHDRAWN,
          changedBy: studentUserId,
          remarks: 'Application withdrawn by student',
        },
      });

      return updated;
    });
  }

  static async getMyApplications(studentUserId: string) {
    const student = await prisma.student.findUnique({ where: { userId: studentUserId } });
    if (!student) {
      const error: any = new Error('Student profile not found');
      error.statusCode = 404;
      throw error;
    }

    return prisma.application.findMany({
      where: { studentId: student.id },
      include: {
        job: {
          include: {
            company: { select: { name: true, logoUrl: true, website: true } },
          },
        },
        statusHistory: { orderBy: { createdAt: 'desc' } },
        interviews: true,
        offers: true,
      },
      orderBy: { submittedAt: 'desc' },
    });
  }

  static async getJobApplications(companyUserId: string, jobId: string) {
    const company = await prisma.company.findUnique({ where: { userId: companyUserId } });
    if (!company) {
      const error: any = new Error('Company profile not found');
      error.statusCode = 404;
      throw error;
    }

    const job = await prisma.job.findUnique({ where: { id: jobId } });
    if (!job || job.companyId !== company.id) {
      const error: any = new Error('Job posting not found or unauthorized');
      error.statusCode = 403;
      throw error;
    }

    return prisma.application.findMany({
      where: { jobId },
      include: {
        student: {
          include: {
            user: { select: { email: true } },
            skills: { include: { skill: true } },
            educations: true,
            resumes: { orderBy: { createdAt: 'desc' }, take: 1 },
          },
        },
        statusHistory: { orderBy: { createdAt: 'desc' } },
      },
      orderBy: { matchScore: 'desc' },
    });
  }
}
