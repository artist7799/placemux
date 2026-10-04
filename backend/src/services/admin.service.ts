import { prisma } from '../config/prisma';
import { UserStatus, Role, JobStatus, ApplicationStatus, PlacementStatus, VerificationStatus } from '@prisma/client';

export interface AnalyticsFilters {
  startDate?: string;
  endDate?: string;
  collegeId?: string;
  companyId?: string;
  jobId?: string;
  applicationStatus?: ApplicationStatus;
}

export class AdminService {
  /**
   * Helper to insert audit log entry into PostgreSQL.
   */
  static async logAdminAction(
    userId: string | undefined,
    action: string,
    details: any,
    ipAddress?: string
  ) {
    try {
      await prisma.auditLog.create({
        data: {
          userId,
          action,
          details,
          ipAddress: ipAddress || '127.0.0.1',
        },
      });
    } catch (err) {
      console.error('[AdminService] Failed to create audit log:', err);
    }
  }

  /**
   * Calculate Real-Time System Analytics from PostgreSQL with optional multi-dimensional filters.
   */
  static async getAnalytics(filters: AnalyticsFilters) {
    const { startDate, endDate, collegeId, companyId, jobId, applicationStatus } = filters;

    // Date range setup
    const dateWhere: any = {};
    if (startDate || endDate) {
      dateWhere.createdAt = {};
      if (startDate) dateWhere.createdAt.gte = new Date(startDate);
      if (endDate) dateWhere.createdAt.lte = new Date(endDate);
    }

    // Scoped application filter
    const appWhere: any = { ...dateWhere };
    if (applicationStatus) appWhere.currentStatus = applicationStatus;
    if (jobId) appWhere.jobId = jobId;
    if (companyId) appWhere.job = { companyId };
    if (collegeId) appWhere.student = { collegeId };

    // Student filter
    const studentWhere: any = {};
    if (collegeId) studentWhere.collegeId = collegeId;

    // Job filter
    const jobWhere: any = { ...dateWhere };
    if (companyId) jobWhere.companyId = companyId;
    if (jobId) jobWhere.id = jobId;

    // Concurrently fetch metrics from PostgreSQL
    const [
      totalUsers,
      activeStudents,
      activeCompanies,
      totalJobs,
      totalApplications,
      totalAssessments,
      totalInterviews,
      totalOffers,
      placedStudents,
      applicationsByStatusRaw,
      studentsByBranchRaw,
    ] = await Promise.all([
      prisma.user.count({ where: dateWhere }),
      prisma.student.count({
        where: { ...studentWhere, user: { status: UserStatus.ACTIVE } },
      }),
      prisma.company.count({
        where: { verificationStatus: VerificationStatus.VERIFIED },
      }),
      prisma.job.count({ where: jobWhere }),
      prisma.application.count({ where: appWhere }),
      prisma.assessment.count(),
      prisma.interview.count(),
      prisma.offer.count(),
      prisma.student.count({
        where: { ...studentWhere, placementStatus: PlacementStatus.PLACED },
      }),
      prisma.application.groupBy({
        by: ['currentStatus'],
        _count: { id: true },
      }),
      prisma.student.groupBy({
        by: ['branch'],
        where: { ...studentWhere, placementStatus: PlacementStatus.PLACED },
        _count: { id: true },
      }),
    ]);

    const applicationsByStatus = applicationsByStatusRaw.reduce((acc: any, curr) => {
      acc[curr.currentStatus] = curr._count.id;
      return acc;
    }, {});

    const placementsByBranch = studentsByBranchRaw.reduce((acc: any, curr) => {
      if (curr.branch) acc[curr.branch] = curr._count.id;
      return acc;
    }, {});

    return {
      totalUsers,
      activeStudents,
      activeCompanies,
      totalJobs,
      totalApplications,
      totalAssessments,
      totalInterviews,
      totalOffers,
      placedStudents,
      placementRate: totalStudentsCount(activeStudents, placedStudents),
      applicationsByStatus,
      placementsByBranch,
    };
  }

  /**
   * User Management: List users with search, role, and status filtering.
   */
  static async getUsers(query: {
    role?: Role;
    status?: UserStatus;
    search?: string;
    page?: number;
    limit?: number;
  }) {
    const page = Math.max(1, Number(query.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(query.limit) || 20));
    const skip = (page - 1) * limit;

    const where: any = {};
    if (query.role) where.role = query.role;
    if (query.status) where.status = query.status;
    if (query.search) {
      where.email = { contains: query.search, mode: 'insensitive' };
    }

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        select: {
          id: true,
          email: true,
          role: true,
          status: true,
          createdAt: true,
          updatedAt: true,
          student: { select: { id: true, firstName: true, lastName: true, branch: true } },
          company: { select: { id: true, name: true, verificationStatus: true } },
          college: { select: { id: true, name: true, code: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.user.count({ where }),
    ]);

    return { users, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  /**
   * Update User Role or Status & Audit Log.
   */
  static async updateUserStatus(
    adminUserId: string,
    targetUserId: string,
    data: { status?: UserStatus; role?: Role },
    ipAddress?: string
  ) {
    const user = await prisma.user.findUnique({ where: { id: targetUserId } });
    if (!user) {
      const error: any = new Error('User not found');
      error.statusCode = 404;
      throw error;
    }

    const updated = await prisma.user.update({
      where: { id: targetUserId },
      data,
      select: { id: true, email: true, role: true, status: true },
    });

    await this.logAdminAction(
      adminUserId,
      'UPDATE_USER_STATUS',
      { targetUserId, previousStatus: user.status, newStatus: updated.status, newRole: updated.role },
      ipAddress
    );

    return updated;
  }

  /**
   * Company Management & Verification.
   */
  static async getCompanies() {
    return prisma.company.findMany({
      include: {
        user: { select: { email: true, status: true } },
        _count: { select: { jobs: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  static async verifyCompany(
    adminUserId: string,
    companyId: string,
    isVerified: boolean,
    ipAddress?: string
  ) {
    const company = await prisma.company.findUnique({ where: { id: companyId } });
    if (!company) {
      const error: any = new Error('Company not found');
      error.statusCode = 404;
      throw error;
    }

    const verificationStatus = isVerified ? VerificationStatus.VERIFIED : VerificationStatus.REJECTED;

    const updated = await prisma.company.update({
      where: { id: companyId },
      data: { verificationStatus },
    });

    await this.logAdminAction(
      adminUserId,
      'VERIFY_COMPANY',
      { companyId, companyName: company.name, verificationStatus },
      ipAddress
    );

    return updated;
  }

  /**
   * College Management.
   */
  static async getColleges() {
    return prisma.college.findMany({
      include: {
        user: { select: { email: true, status: true } },
        _count: { select: { students: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Job Drive Moderation.
   */
  static async getJobs(query: { status?: JobStatus; search?: string }) {
    const where: any = {};
    if (query.status) where.status = query.status;
    if (query.search) {
      where.title = { contains: query.search, mode: 'insensitive' };
    }

    return prisma.job.findMany({
      where,
      include: {
        company: { select: { id: true, name: true, verificationStatus: true } },
        _count: { select: { applications: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  static async updateJobStatus(
    adminUserId: string,
    jobId: string,
    status: JobStatus,
    ipAddress?: string
  ) {
    const job = await prisma.job.findUnique({ where: { id: jobId } });
    if (!job) {
      const error: any = new Error('Job drive not found');
      error.statusCode = 404;
      throw error;
    }

    const updated = await prisma.job.update({
      where: { id: jobId },
      data: { status },
    });

    await this.logAdminAction(
      adminUserId,
      'MODERATE_JOB_STATUS',
      { jobId, previousStatus: job.status, newStatus: status, jobTitle: job.title },
      ipAddress
    );

    return updated;
  }

  /**
   * System Monitoring: Applications, Assessments, Offers & Audit Logs.
   */
  static async getApplications(filters: { status?: ApplicationStatus }) {
    const where: any = {};
    if (filters.status) where.currentStatus = filters.status;

    return prisma.application.findMany({
      where,
      include: {
        student: { select: { firstName: true, lastName: true, branch: true, cgpa: true } },
        job: { select: { title: true, company: { select: { name: true } } } },
      },
      orderBy: { submittedAt: 'desc' },
      take: 100,
    });
  }

  static async getAssessments() {
    return prisma.assessment.findMany({
      include: {
        job: { select: { title: true, company: { select: { name: true } } } },
        _count: { select: { questions: true, sessions: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  static async getOffers() {
    return prisma.offer.findMany({
      include: {
        application: {
          include: {
            student: { select: { firstName: true, lastName: true, branch: true } },
            job: { select: { title: true, company: { select: { name: true } } } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  static async getAuditLogs(limit = 100) {
    return prisma.auditLog.findMany({
      include: {
        user: { select: { email: true, role: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  }
}

function totalStudentsCount(active: number, placed: number): number {
  if (active === 0) return 0;
  return Math.round((placed / active) * 100);
}
