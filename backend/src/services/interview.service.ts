import { prisma } from '../config/prisma';
import { ApplicationStatus, InterviewMode, InterviewStatus, PlacementStatus } from '@prisma/client';

export class InterviewService {
  static async scheduleInterview(companyUserId: string, data: any) {
    const company = await prisma.company.findUnique({ where: { userId: companyUserId } });
    if (!company) {
      const error: any = new Error('Company profile not found');
      error.statusCode = 404;
      throw error;
    }

    const application = await prisma.application.findUnique({
      where: { id: data.applicationId },
      include: {
        job: true,
        student: { select: { id: true, userId: true, firstName: true, lastName: true } },
      },
    });

    if (!application || application.job.companyId !== company.id) {
      const error: any = new Error('Application not found or unauthorized');
      error.statusCode = 403;
      throw error;
    }

    return prisma.$transaction(async (tx) => {
      const interview = await tx.interview.create({
        data: {
          applicationId: application.id,
          scheduledAt: new Date(data.scheduledAt),
          durationMinutes: data.durationMinutes || 45,
          mode: data.mode || InterviewMode.ONLINE,
          meetingLink: data.meetingLink || '',
          status: InterviewStatus.SCHEDULED,
        },
      });

      // Update application status to INTERVIEW
      await tx.application.update({
        where: { id: application.id },
        data: { currentStatus: ApplicationStatus.INTERVIEW },
      });

      // Log status history
      await tx.applicationStatusHistory.create({
        data: {
          applicationId: application.id,
          status: ApplicationStatus.INTERVIEW,
          changedBy: companyUserId,
          remarks: `Interview scheduled for ${new Date(data.scheduledAt).toLocaleString()}`,
        },
      });

      // Send Notification to Student
      await tx.notification.create({
        data: {
          userId: application.student.userId,
          title: 'Interview Scheduled',
          message: `Interview scheduled for ${application.job.title} at ${company.name} on ${new Date(data.scheduledAt).toLocaleString()}.`,
          type: 'INTERVIEW',
          link: '/student/interviews',
        },
      });

      return interview;
    });
  }

  static async submitFeedback(reviewerUserId: string, interviewId: string, data: any) {
    const interview = await prisma.interview.findUnique({
      where: { id: interviewId },
      include: {
        application: {
          include: {
            job: { select: { companyId: true, title: true } },
            student: { select: { id: true, userId: true } },
          },
        },
      },
    });

    if (!interview) {
      const error: any = new Error('Interview record not found');
      error.statusCode = 404;
      throw error;
    }

    return prisma.$transaction(async (tx) => {
      const feedback = await tx.interviewFeedback.create({
        data: {
          interviewId,
          reviewerId: reviewerUserId,
          rating: data.rating,
          comments: data.comments,
          recommendation: data.recommendation,
        },
      });

      // Update interview status to COMPLETED
      await tx.interview.update({
        where: { id: interviewId },
        data: { status: InterviewStatus.COMPLETED },
      });

      // Process recommendation pipeline update
      let targetStatus: ApplicationStatus | null = null;
      if (data.recommendation === 'SELECT') {
        targetStatus = ApplicationStatus.SELECTED;
      } else if (data.recommendation === 'REJECT') {
        targetStatus = ApplicationStatus.REJECTED;
      }

      if (targetStatus) {
        await tx.application.update({
          where: { id: interview.applicationId },
          data: { currentStatus: targetStatus },
        });

        await tx.applicationStatusHistory.create({
          data: {
            applicationId: interview.applicationId,
            status: targetStatus,
            changedBy: reviewerUserId,
            remarks: `Candidate recommendation: ${data.recommendation} after interview.`,
          },
        });

        await tx.notification.create({
          data: {
            userId: interview.application.student.userId,
            title: 'Application Status Update',
            message: `Your application for ${interview.application.job.title} status updated to ${targetStatus}.`,
            type: 'APPLICATION_STATUS',
            link: '/student/applications',
          },
        });
      }

      return feedback;
    });
  }

  static async getMyInterviews(studentUserId: string) {
    const student = await prisma.student.findUnique({ where: { userId: studentUserId } });
    if (!student) {
      const error: any = new Error('Student profile not found');
      error.statusCode = 404;
      throw error;
    }

    return prisma.interview.findMany({
      where: {
        application: { studentId: student.id },
      },
      include: {
        application: {
          include: {
            job: {
              include: {
                company: { select: { name: true, logoUrl: true } },
              },
            },
          },
        },
      },
      orderBy: { scheduledAt: 'asc' },
    });
  }
}
