import { prisma } from '../config/prisma';
import { JobStatus, JobType } from '@prisma/client';

export class JobService {
  static async createJob(userId: string, data: any) {
    const company = await prisma.company.findUnique({ where: { userId } });
    if (!company) {
      const error: any = new Error('Company profile not found for this user');
      error.statusCode = 404;
      throw error;
    }

    const { requiredSkillNames, ...jobData } = data;

    // Create job transactionally with skills
    return prisma.$transaction(async (tx) => {
      const job = await tx.job.create({
        data: {
          companyId: company.id,
          title: jobData.title,
          description: jobData.description,
          location: jobData.location,
          jobType: jobData.jobType,
          salaryRange: jobData.salaryRange,
          requirements: jobData.requirements || [],
          minCgpa: jobData.minCgpa || 0.0,
          eligibleBranches: jobData.eligibleBranches || [],
          graduationYears: jobData.graduationYears || [],
          status: JobStatus.ACTIVE,
        },
      });

      if (requiredSkillNames && requiredSkillNames.length > 0) {
        for (const skillName of requiredSkillNames) {
          let skill = await tx.skill.findUnique({
            where: { name: skillName.trim().toLowerCase() },
          });
          if (!skill) {
            skill = await tx.skill.create({
              data: { name: skillName.trim().toLowerCase(), category: 'TECHNICAL' },
            });
          }
          await tx.jobSkill.create({
            data: {
              jobId: job.id,
              skillId: skill.id,
              isRequired: true,
            },
          });
        }
      }

      return tx.job.findUnique({
        where: { id: job.id },
        include: {
          company: { select: { id: true, name: true, logoUrl: true, website: true } },
          jobSkills: { include: { skill: true } },
        },
      });
    });
  }

  static async updateJob(userId: string, jobId: string, data: any) {
    const company = await prisma.company.findUnique({ where: { userId } });
    if (!company) {
      const error: any = new Error('Company profile not found');
      error.statusCode = 404;
      throw error;
    }

    const existingJob = await prisma.job.findUnique({ where: { id: jobId } });
    if (!existingJob) {
      const error: any = new Error('Job not found');
      error.statusCode = 404;
      throw error;
    }

    if (existingJob.companyId !== company.id) {
      const error: any = new Error('Unauthorized to update this job posting');
      error.statusCode = 403;
      throw error;
    }

    const { requiredSkillNames, ...jobData } = data;

    return prisma.$transaction(async (tx) => {
      const updatedJob = await tx.job.update({
        where: { id: jobId },
        data: jobData,
      });

      if (requiredSkillNames) {
        await tx.jobSkill.deleteMany({ where: { jobId } });
        for (const skillName of requiredSkillNames) {
          let skill = await tx.skill.findUnique({
            where: { name: skillName.trim().toLowerCase() },
          });
          if (!skill) {
            skill = await tx.skill.create({
              data: { name: skillName.trim().toLowerCase(), category: 'TECHNICAL' },
            });
          }
          await tx.jobSkill.create({
            data: {
              jobId: updatedJob.id,
              skillId: skill.id,
              isRequired: true,
            },
          });
        }
      }

      return tx.job.findUnique({
        where: { id: jobId },
        include: {
          company: { select: { id: true, name: true, logoUrl: true, website: true } },
          jobSkills: { include: { skill: true } },
        },
      });
    });
  }

  static async updateJobStatus(userId: string, jobId: string, status: JobStatus) {
    const company = await prisma.company.findUnique({ where: { userId } });
    const existingJob = await prisma.job.findUnique({ where: { id: jobId } });

    if (!existingJob) {
      const error: any = new Error('Job not found');
      error.statusCode = 404;
      throw error;
    }

    if (company && existingJob.companyId !== company.id) {
      const error: any = new Error('Unauthorized to modify this job');
      error.statusCode = 403;
      throw error;
    }

    return prisma.job.update({
      where: { id: jobId },
      data: { status },
    });
  }

  static async deleteJob(userId: string, jobId: string) {
    const company = await prisma.company.findUnique({ where: { userId } });
    const existingJob = await prisma.job.findUnique({ where: { id: jobId } });

    if (!existingJob) {
      const error: any = new Error('Job not found');
      error.statusCode = 404;
      throw error;
    }

    if (company && existingJob.companyId !== company.id) {
      const error: any = new Error('Unauthorized to delete this job');
      error.statusCode = 403;
      throw error;
    }

    return prisma.job.delete({ where: { id: jobId } });
  }

  static async getJobById(jobId: string, studentUserId?: string) {
    const job = await prisma.job.findUnique({
      where: { id: jobId },
      include: {
        company: {
          select: {
            id: true,
            name: true,
            logoUrl: true,
            website: true,
            industry: true,
            companySize: true,
            description: true,
          },
        },
        jobSkills: { include: { skill: true } },
        _count: { select: { applications: true } },
      },
    });

    if (!job) {
      const error: any = new Error('Job posting not found');
      error.statusCode = 404;
      throw error;
    }

    let isEligible = true;
    let eligibilityReasons: string[] = [];
    let hasApplied = false;
    let existingApplication = null;

    if (studentUserId) {
      const student = await prisma.student.findUnique({ where: { userId: studentUserId } });
      if (student) {
        if (job.minCgpa && (student.cgpa || 0) < job.minCgpa) {
          isEligible = false;
          eligibilityReasons.push(`Requires minimum CGPA of ${job.minCgpa} (Your CGPA: ${student.cgpa || 0})`);
        }
        if (
          job.eligibleBranches &&
          job.eligibleBranches.length > 0 &&
          student.branch &&
          !job.eligibleBranches.includes(student.branch)
        ) {
          isEligible = false;
          eligibilityReasons.push(`Branch ${student.branch} not eligible for this role`);
        }

        existingApplication = await prisma.application.findUnique({
          where: {
            jobId_studentId: {
              jobId: job.id,
              studentId: student.id,
            },
          },
        });
        hasApplied = !!existingApplication;
      }
    }

    return {
      ...job,
      isEligible,
      eligibilityReasons,
      hasApplied,
      existingApplication,
    };
  }

  static async searchJobs(filters: {
    search?: string;
    location?: string;
    jobType?: JobType;
    branch?: string;
    status?: JobStatus;
  }) {
    const where: any = {
      status: filters.status || JobStatus.ACTIVE,
    };

    if (filters.search) {
      where.OR = [
        { title: { contains: filters.search, mode: 'insensitive' } },
        { description: { contains: filters.search, mode: 'insensitive' } },
        { company: { name: { contains: filters.search, mode: 'insensitive' } } },
      ];
    }

    if (filters.location) {
      where.location = { contains: filters.location, mode: 'insensitive' };
    }

    if (filters.jobType) {
      where.jobType = filters.jobType;
    }

    if (filters.branch) {
      where.eligibleBranches = { has: filters.branch };
    }

    return prisma.job.findMany({
      where,
      include: {
        company: { select: { id: true, name: true, logoUrl: true } },
        jobSkills: { include: { skill: true } },
        _count: { select: { applications: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  static async getCompanyJobs(userId: string) {
    const company = await prisma.company.findUnique({ where: { userId } });
    if (!company) {
      const error: any = new Error('Company profile not found');
      error.statusCode = 404;
      throw error;
    }

    return prisma.job.findMany({
      where: { companyId: company.id },
      include: {
        jobSkills: { include: { skill: true } },
        _count: { select: { applications: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }
}
