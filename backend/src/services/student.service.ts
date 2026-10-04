import { prisma } from '../config/prisma';
import { PlacementStatus } from '@prisma/client';

export class StudentService {
  static calculateProfileCompletion(student: any): number {
    if (!student) return 0;

    let score = 0;

    // Personal details (30%)
    if (student.firstName && student.lastName) score += 5;
    if (student.phone) score += 5;
    if (student.bio) score += 5;
    if (student.address) score += 5;
    if (student.branch) score += 5;
    if (student.cgpa !== null && student.cgpa !== undefined) score += 5;

    // Education (20%)
    if (student.educations && student.educations.length > 0) score += 20;

    // Skills (15%)
    if (student.skills && student.skills.length > 0) {
      score += Math.min(15, student.skills.length * 5);
    }

    // Projects (15%)
    if (student.projects && student.projects.length > 0) {
      score += Math.min(15, student.projects.length * 7.5);
    }

    // Certifications (10%)
    if (student.certifications && student.certifications.length > 0) {
      score += 10;
    }

    // Resume (10%)
    if (student.resumes && student.resumes.length > 0) {
      score += 10;
    }

    return Math.min(100, Math.round(score));
  }

  static async getStudentByUserId(userId: string) {
    const student = await prisma.student.findUnique({
      where: { userId },
      include: {
        user: {
          select: { id: true, email: true, role: true, status: true },
        },
        educations: { orderBy: { startDate: 'desc' } },
        skills: { include: { skill: true } },
        projects: true,
        certifications: true,
        resumes: { orderBy: { createdAt: 'desc' } },
      },
    });

    if (!student) {
      const error: any = new Error('Student profile not found');
      error.statusCode = 404;
      throw error;
    }

    const profileCompletion = this.calculateProfileCompletion(student);

    return {
      ...student,
      profileCompletion,
    };
  }

  static async updateProfile(userId: string, data: any) {
    const student = await prisma.student.findUnique({ where: { userId } });
    if (!student) {
      const error: any = new Error('Student profile not found');
      error.statusCode = 404;
      throw error;
    }

    const updated = await prisma.student.update({
      where: { userId },
      data,
      include: {
        educations: true,
        skills: { include: { skill: true } },
        projects: true,
        certifications: true,
        resumes: true,
      },
    });

    const profileCompletion = this.calculateProfileCompletion(updated);

    return {
      ...updated,
      profileCompletion,
    };
  }

  // Education
  static async addEducation(userId: string, data: any) {
    const student = await prisma.student.findUnique({ where: { userId } });
    if (!student) {
      const error: any = new Error('Student profile not found');
      error.statusCode = 404;
      throw error;
    }

    return prisma.education.create({
      data: {
        studentId: student.id,
        degree: data.degree,
        fieldOfStudy: data.fieldOfStudy,
        institution: data.institution,
        startDate: new Date(data.startDate),
        endDate: data.endDate ? new Date(data.endDate) : null,
        grade: data.grade,
        isCurrent: data.isCurrent ?? false,
      },
    });
  }

  static async updateEducation(userId: string, educationId: string, data: any) {
    const student = await prisma.student.findUnique({ where: { userId } });
    if (!student) {
      const error: any = new Error('Student profile not found');
      error.statusCode = 404;
      throw error;
    }

    return prisma.education.update({
      where: { id: educationId },
      data: {
        ...(data.degree && { degree: data.degree }),
        ...(data.fieldOfStudy && { fieldOfStudy: data.fieldOfStudy }),
        ...(data.institution && { institution: data.institution }),
        ...(data.startDate && { startDate: new Date(data.startDate) }),
        ...(data.endDate !== undefined && { endDate: data.endDate ? new Date(data.endDate) : null }),
        ...(data.grade !== undefined && { grade: data.grade }),
        ...(data.isCurrent !== undefined && { isCurrent: data.isCurrent }),
      },
    });
  }

  static async deleteEducation(userId: string, educationId: string) {
    return prisma.education.delete({ where: { id: educationId } });
  }

  // Skills
  static async addSkill(userId: string, skillName: string, category?: string, proficiency: string = 'INTERMEDIATE') {
    const student = await prisma.student.findUnique({ where: { userId } });
    if (!student) {
      const error: any = new Error('Student profile not found');
      error.statusCode = 404;
      throw error;
    }

    let skill = await prisma.skill.findUnique({
      where: { name: skillName.trim().toLowerCase() },
    });

    if (!skill) {
      skill = await prisma.skill.create({
        data: {
          name: skillName.trim().toLowerCase(),
          category: category || 'TECHNICAL',
        },
      });
    }

    return prisma.studentSkill.upsert({
      where: {
        studentId_skillId: {
          studentId: student.id,
          skillId: skill.id,
        },
      },
      update: { proficiency },
      create: {
        studentId: student.id,
        skillId: skill.id,
        proficiency,
      },
      include: { skill: true },
    });
  }

  static async removeSkill(userId: string, studentSkillId: string) {
    return prisma.studentSkill.delete({ where: { id: studentSkillId } });
  }

  // Projects
  static async addProject(userId: string, data: any) {
    const student = await prisma.student.findUnique({ where: { userId } });
    if (!student) {
      const error: any = new Error('Student profile not found');
      error.statusCode = 404;
      throw error;
    }

    return prisma.project.create({
      data: {
        studentId: student.id,
        title: data.title,
        description: data.description,
        technologies: data.technologies,
        repoUrl: data.repoUrl,
        demoUrl: data.demoUrl,
        startDate: data.startDate ? new Date(data.startDate) : null,
        endDate: data.endDate ? new Date(data.endDate) : null,
      },
    });
  }

  static async updateProject(userId: string, projectId: string, data: any) {
    return prisma.project.update({
      where: { id: projectId },
      data,
    });
  }

  static async deleteProject(userId: string, projectId: string) {
    return prisma.project.delete({ where: { id: projectId } });
  }

  // Certifications
  static async addCertification(userId: string, data: any) {
    const student = await prisma.student.findUnique({ where: { userId } });
    if (!student) {
      const error: any = new Error('Student profile not found');
      error.statusCode = 404;
      throw error;
    }

    return prisma.certification.create({
      data: {
        studentId: student.id,
        title: data.title,
        issuingOrganization: data.issuingOrganization,
        issueDate: new Date(data.issueDate),
        expirationDate: data.expirationDate ? new Date(data.expirationDate) : null,
        credentialUrl: data.credentialUrl,
      },
    });
  }

  static async updateCertification(userId: string, certId: string, data: any) {
    return prisma.certification.update({
      where: { id: certId },
      data: {
        ...data,
        ...(data.issueDate && { issueDate: new Date(data.issueDate) }),
        ...(data.expirationDate !== undefined && {
          expirationDate: data.expirationDate ? new Date(data.expirationDate) : null,
        }),
      },
    });
  }

  static async deleteCertification(userId: string, certId: string) {
    return prisma.certification.delete({ where: { id: certId } });
  }

  // Resumes
  static async uploadResume(userId: string, fileUrl: string, fileText?: string) {
    const student = await prisma.student.findUnique({ where: { userId } });
    if (!student) {
      const error: any = new Error('Student profile not found');
      error.statusCode = 404;
      throw error;
    }

    return prisma.resume.create({
      data: {
        studentId: student.id,
        fileUrl,
        fileText: fileText || '',
        resumeScore: 75.0, // Base default score before AI detailed scoring
      },
    });
  }

  // Student Dashboard Aggregation
  static async getDashboardData(userId: string) {
    const student = await prisma.student.findUnique({
      where: { userId },
      include: {
        educations: true,
        skills: { include: { skill: true } },
        projects: true,
        certifications: true,
        resumes: { orderBy: { createdAt: 'desc' } },
        applications: {
          include: {
            job: {
              include: {
                company: true,
              },
            },
            interviews: true,
            offers: true,
          },
          orderBy: { submittedAt: 'desc' },
          take: 5,
        },
        assessmentSessions: {
          include: {
            assessment: true,
          },
          orderBy: { startedAt: 'desc' },
          take: 5,
        },
      },
    });

    if (!student) {
      const error: any = new Error('Student profile not found');
      error.statusCode = 404;
      throw error;
    }

    const profileCompletion = this.calculateProfileCompletion(student);

    // Latest resume & score
    const latestResume = student.resumes.length > 0 ? student.resumes[0] : null;

    // Recommended jobs based on student branch and CGPA
    const recommendedJobs = await prisma.job.findMany({
      where: {
        status: 'ACTIVE',
        ...(student.cgpa ? { minCgpa: { lte: student.cgpa } } : {}),
      },
      include: {
        company: {
          select: { name: true, logoUrl: true, website: true },
        },
        jobSkills: {
          include: { skill: true },
        },
      },
      take: 6,
      orderBy: { createdAt: 'desc' },
    });

    // Recent applications
    const recentApplications = student.applications.map((app) => ({
      id: app.id,
      jobTitle: app.job.title,
      companyName: app.job.company.name,
      companyLogo: app.job.company.logoUrl,
      status: app.currentStatus,
      matchScore: app.matchScore,
      submittedAt: app.submittedAt,
    }));

    // Pending assessments
    const pendingAssessments = student.assessmentSessions
      .filter((session) => session.status === 'IN_PROGRESS')
      .map((session) => ({
        id: session.id,
        assessmentTitle: session.assessment.title,
        durationMinutes: session.assessment.durationMinutes,
        passingScore: session.assessment.passingScore,
        startedAt: session.startedAt,
      }));

    // Upcoming interviews
    const upcomingInterviews: any[] = [];
    student.applications.forEach((app) => {
      app.interviews.forEach((interview) => {
        if (interview.status === 'SCHEDULED') {
          upcomingInterviews.push({
            id: interview.id,
            jobTitle: app.job.title,
            companyName: app.job.company.name,
            scheduledAt: interview.scheduledAt,
            durationMinutes: interview.durationMinutes,
            mode: interview.mode,
            meetingLink: interview.meetingLink,
          });
        }
      });
    });

    // Offers
    const offers: any[] = [];
    student.applications.forEach((app) => {
      app.offers.forEach((offer) => {
        offers.push({
          id: offer.id,
          jobTitle: app.job.title,
          companyName: app.job.company.name,
          positionTitle: offer.positionTitle,
          salary: offer.salary,
          joiningDate: offer.joiningDate,
          status: offer.status,
          offerLetterUrl: offer.offerLetterUrl,
        });
      });
    });

    return {
      studentId: student.id,
      name: `${student.firstName} ${student.lastName}`.trim(),
      email: (student as any).user?.email,
      branch: student.branch,
      cgpa: student.cgpa,
      profileCompletion,
      resumeStatus: latestResume ? 'UPLOADED' : 'NOT_UPLOADED',
      resumeScore: latestResume ? latestResume.resumeScore : null,
      latestResume,
      recommendedJobs,
      recentApplications,
      pendingAssessments,
      upcomingInterviews,
      offers,
    };
  }
}
