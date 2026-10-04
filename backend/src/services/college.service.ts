import { prisma } from '../config/prisma';
import { PlacementStatus } from '@prisma/client';

export class CollegeService {
  static async getCollegeByUserId(userId: string) {
    const college = await prisma.college.findUnique({
      where: { userId },
      include: {
        user: { select: { id: true, email: true, role: true, status: true } },
      },
    });

    if (!college) {
      const error: any = new Error('College profile not found');
      error.statusCode = 404;
      throw error;
    }

    return college;
  }

  static async updateProfile(userId: string, data: any) {
    const college = await prisma.college.findUnique({ where: { userId } });
    if (!college) {
      const error: any = new Error('College profile not found');
      error.statusCode = 404;
      throw error;
    }

    return prisma.college.update({
      where: { userId },
      data,
    });
  }

  static async getDashboardMetrics(userId: string) {
    const college = await prisma.college.findUnique({ where: { userId } });
    const collegeId = college ? college.id : undefined;

    // Student filter condition
    const studentWhere = collegeId ? { collegeId } : {};

    const [totalStudents, placedStudents, eligibleStudents, activeDrives, totalCompanies, totalOffers] =
      await Promise.all([
        prisma.student.count({ where: studentWhere }),
        prisma.student.count({
          where: { ...studentWhere, placementStatus: PlacementStatus.PLACED },
        }),
        prisma.student.count({
          where: { ...studentWhere, isVerified: true, cgpa: { gte: 6.0 } },
        }),
        prisma.job.count({ where: { status: 'ACTIVE' } }),
        prisma.company.count(),
        prisma.offer.count(),
      ]);

    const placementPercentage =
      totalStudents > 0 ? Math.round((placedStudents / totalStudents) * 100) : 0;

    return {
      collegeId: college?.id,
      collegeName: college?.name,
      collegeCode: college?.code,
      totalStudents,
      eligibleStudents,
      placedStudents,
      placementPercentage,
      activeDrives,
      totalCompanies,
      totalOffers,
    };
  }

  static async getStudentDirectory(
    userId: string,
    filters: {
      branch?: string;
      graduationYear?: number;
      minCgpa?: number;
      placementStatus?: PlacementStatus;
      search?: string;
    }
  ) {
    const college = await prisma.college.findUnique({ where: { userId } });
    const where: any = {};

    if (college) {
      where.OR = [{ collegeId: college.id }, { collegeId: null }];
    }

    if (filters.branch) where.branch = filters.branch;
    if (filters.graduationYear) where.graduationYear = Number(filters.graduationYear);
    if (filters.minCgpa) where.cgpa = { gte: Number(filters.minCgpa) };
    if (filters.placementStatus) where.placementStatus = filters.placementStatus;

    if (filters.search) {
      const searchFilter = [
        { firstName: { contains: filters.search, mode: 'insensitive' } },
        { lastName: { contains: filters.search, mode: 'insensitive' } },
        { user: { email: { contains: filters.search, mode: 'insensitive' } } },
      ];
      if (where.OR) {
        where.AND = [
          { OR: where.OR },
          { OR: searchFilter },
        ];
        delete where.OR;
      } else {
        where.OR = searchFilter;
      }
    }

    return prisma.student.findMany({
      where,
      include: {
        user: { select: { email: true, status: true } },
        skills: { include: { skill: true } },
        applications: {
          select: { id: true, currentStatus: true, job: { select: { title: true } } },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  static async verifyStudent(userId: string, studentId: string, isVerified: boolean) {
    const college = await prisma.college.findUnique({ where: { userId } });
    const student = await prisma.student.findUnique({ where: { id: studentId } });

    if (!student) {
      const error: any = new Error('Student not found');
      error.statusCode = 404;
      throw error;
    }

    if (college && student.collegeId && student.collegeId !== college.id) {
      const error: any = new Error('Unauthorized: You can only manage students associated with your college');
      error.statusCode = 403;
      throw error;
    }

    return prisma.student.update({
      where: { id: studentId },
      data: {
        isVerified,
        ...(college && !student.collegeId ? { collegeId: college.id } : {}),
      },
    });
  }

  static async getPlacementDrives(userId: string) {
    return prisma.job.findMany({
      where: { status: 'ACTIVE' },
      include: {
        company: { select: { id: true, name: true, logoUrl: true, website: true } },
        jobSkills: { include: { skill: true } },
        _count: { select: { applications: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  static async getEligibleStudentsForJob(userId: string, jobId: string) {
    const college = await prisma.college.findUnique({ where: { userId } });
    const job = await prisma.job.findUnique({ where: { id: jobId } });
    if (!job) {
      const error: any = new Error('Job drive not found');
      error.statusCode = 404;
      throw error;
    }

    const where: any = {
      isVerified: true,
      ...(college ? { OR: [{ collegeId: college.id }, { collegeId: null }] } : {}),
      ...(job.minCgpa ? { cgpa: { gte: job.minCgpa } } : {}),
    };

    if (job.eligibleBranches && job.eligibleBranches.length > 0) {
      where.branch = { in: job.eligibleBranches };
    }

    return prisma.student.findMany({
      where,
      include: {
        user: { select: { email: true } },
        skills: { include: { skill: true } },
      },
      orderBy: { cgpa: 'desc' },
    });
  }
}
