import { prisma } from '../config/prisma';
import { ApplicationStatus, OfferStatus, PlacementStatus } from '@prisma/client';

export class OfferService {
  static async issueOffer(companyUserId: string, data: any) {
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
        student: { select: { id: true, userId: true, firstName: true } },
      },
    });

    if (!application || application.job.companyId !== company.id) {
      const error: any = new Error('Application record not found or unauthorized');
      error.statusCode = 403;
      throw error;
    }

    return prisma.$transaction(async (tx) => {
      const offer = await tx.offer.create({
        data: {
          applicationId: application.id,
          positionTitle: data.positionTitle,
          salary: data.salary,
          joiningDate: new Date(data.joiningDate),
          offerLetterUrl: data.offerLetterUrl || '',
          validUntil: data.validUntil ? new Date(data.validUntil) : null,
          status: OfferStatus.PENDING,
        },
      });

      // Update application status to OFFERED
      await tx.application.update({
        where: { id: application.id },
        data: { currentStatus: ApplicationStatus.OFFERED },
      });

      // Log status history
      await tx.applicationStatusHistory.create({
        data: {
          applicationId: application.id,
          status: ApplicationStatus.OFFERED,
          changedBy: companyUserId,
          remarks: `Job offer extended: ${data.positionTitle} with compensation of ${data.salary}`,
        },
      });

      // Notify candidate
      await tx.notification.create({
        data: {
          userId: application.student.userId,
          title: 'Congratulations! Official Placement Offer Received',
          message: `${company.name} has extended an offer for ${data.positionTitle} (${data.salary}). Check your portal to respond.`,
          type: 'OFFER',
          link: '/student/offers',
        },
      });

      return offer;
    });
  }

  static async respondOffer(studentUserId: string, offerId: string, status: 'ACCEPTED' | 'REJECTED') {
    const student = await prisma.student.findUnique({ where: { userId: studentUserId } });
    if (!student) {
      const error: any = new Error('Student profile not found');
      error.statusCode = 404;
      throw error;
    }

    const offer = await prisma.offer.findUnique({
      where: { id: offerId },
      include: {
        application: {
          include: {
            job: { include: { company: { select: { userId: true, name: true } } } },
          },
        },
      },
    });

    if (!offer || offer.application.studentId !== student.id) {
      const error: any = new Error('Offer record not found or unauthorized');
      error.statusCode = 403;
      throw error;
    }

    if (offer.status !== OfferStatus.PENDING) {
      const error: any = new Error('Offer has already been responded to');
      error.statusCode = 400;
      throw error;
    }

    const targetOfferStatus = status === 'ACCEPTED' ? OfferStatus.ACCEPTED : OfferStatus.REJECTED;
    const targetAppStatus = status === 'ACCEPTED' ? ApplicationStatus.ACCEPTED : ApplicationStatus.REJECTED;

    return prisma.$transaction(async (tx) => {
      const updatedOffer = await tx.offer.update({
        where: { id: offerId },
        data: { status: targetOfferStatus },
      });

      await tx.application.update({
        where: { id: offer.applicationId },
        data: { currentStatus: targetAppStatus },
      });

      await tx.applicationStatusHistory.create({
        data: {
          applicationId: offer.applicationId,
          status: targetAppStatus,
          changedBy: studentUserId,
          remarks: `Student ${status.toLowerCase()} placement offer for ${offer.positionTitle}.`,
        },
      });

      if (status === 'ACCEPTED') {
        await tx.student.update({
          where: { id: student.id },
          data: { placementStatus: PlacementStatus.PLACED },
        });
      }

      // Notify company HR
      await tx.notification.create({
        data: {
          userId: offer.application.job.company.userId,
          title: `Offer ${status}`,
          message: `Candidate has ${status.toLowerCase()} the offer for ${offer.positionTitle}.`,
          type: 'OFFER_RESPONSE',
        },
      });

      return updatedOffer;
    });
  }

  static async getMyOffers(studentUserId: string) {
    const student = await prisma.student.findUnique({ where: { userId: studentUserId } });
    if (!student) {
      const error: any = new Error('Student profile not found');
      error.statusCode = 404;
      throw error;
    }

    return prisma.offer.findMany({
      where: {
        application: { studentId: student.id },
      },
      include: {
        application: {
          include: {
            job: {
              include: {
                company: { select: { name: true, logoUrl: true, website: true } },
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  static async getNotifications(userId: string) {
    return prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 20,
    });
  }
}
