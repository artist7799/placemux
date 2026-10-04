import { Role, UserStatus } from '@prisma/client';
import { prisma } from '../config/prisma';
import { hashPassword, comparePassword } from '../utils/password';
import { generateAccessToken, generateRefreshToken, verifyRefreshToken } from '../utils/jwt';

export interface RegisterInput {
  email: string;
  password: string;
  role: Role;
  firstName?: string;
  lastName?: string;
  phone?: string;
  cgpa?: number;
  branch?: string;
  graduationYear?: number;
  companyName?: string;
  website?: string;
  industry?: string;
  collegeName?: string;
  code?: string;
}

export class AuthService {
  static async register(input: RegisterInput) {
    const existingUser = await prisma.user.findUnique({
      where: { email: input.email.toLowerCase() },
    });

    if (existingUser) {
      const error: any = new Error('User with this email already exists');
      error.statusCode = 400;
      throw error;
    }

    if (input.role === Role.COLLEGE && input.code) {
      const existingCollegeCode = await prisma.college.findUnique({
        where: { code: input.code.toUpperCase() },
      });
      if (existingCollegeCode) {
        const error: any = new Error('College code already registered');
        error.statusCode = 400;
        throw error;
      }
    }

    const hashedPassword = await hashPassword(input.password);

    const user = await prisma.$transaction(async (tx) => {
      const newUser = await tx.user.create({
        data: {
          email: input.email.toLowerCase(),
          passwordHash: hashedPassword,
          role: input.role,
          status: UserStatus.ACTIVE,
        },
      });

      if (input.role === Role.STUDENT) {
        await tx.student.create({
          data: {
            userId: newUser.id,
            firstName: input.firstName || '',
            lastName: input.lastName || '',
            phone: input.phone,
            cgpa: input.cgpa,
            branch: input.branch,
            graduationYear: input.graduationYear,
          },
        });
      } else if (input.role === Role.COMPANY) {
        await tx.company.create({
          data: {
            userId: newUser.id,
            name: input.companyName || '',
            website: input.website,
            industry: input.industry,
          },
        });
      } else if (input.role === Role.COLLEGE) {
        await tx.college.create({
          data: {
            userId: newUser.id,
            name: input.collegeName || '',
            code: input.code?.toUpperCase() || `COL-${Date.now()}`,
          },
        });
      }

      return newUser;
    });

    return this.getUserProfile(user.id);
  }

  static async login(email: string, password: string) {
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
      include: {
        student: true,
        company: true,
        college: true,
      },
    });

    if (!user) {
      const error: any = new Error('Invalid email or password');
      error.statusCode = 401;
      throw error;
    }

    const isMatch = await comparePassword(password, user.passwordHash);
    if (!isMatch) {
      const error: any = new Error('Invalid email or password');
      error.statusCode = 401;
      throw error;
    }

    if (user.status === UserStatus.SUSPENDED) {
      const error: any = new Error('User account is suspended');
      error.statusCode = 403;
      throw error;
    }

    const tokenPayload = {
      userId: user.id,
      email: user.email,
      role: user.role,
    };

    const accessToken = generateAccessToken(tokenPayload);
    const refreshToken = generateRefreshToken(tokenPayload);

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    await prisma.refreshToken.create({
      data: {
        userId: user.id,
        token: refreshToken,
        expiresAt,
      },
    });

    const { passwordHash, ...userWithoutPassword } = user;

    return {
      user: userWithoutPassword,
      accessToken,
      refreshToken,
    };
  }

  static async refreshTokens(refreshToken: string) {
    try {
      const decoded = verifyRefreshToken(refreshToken);

      const storedToken = await prisma.refreshToken.findUnique({
        where: { token: refreshToken },
        include: { user: true },
      });

      if (!storedToken || storedToken.expiresAt < new Date()) {
        if (storedToken) {
          await prisma.refreshToken.delete({ where: { id: storedToken.id } });
        }
        const error: any = new Error('Invalid or expired refresh token');
        error.statusCode = 401;
        throw error;
      }

      if (storedToken.user.status === UserStatus.SUSPENDED) {
        const error: any = new Error('User account is suspended');
        error.statusCode = 403;
        throw error;
      }

      const tokenPayload = {
        userId: storedToken.user.id,
        email: storedToken.user.email,
        role: storedToken.user.role,
      };

      const newAccessToken = generateAccessToken(tokenPayload);
      const newRefreshToken = generateRefreshToken(tokenPayload);

      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 7);

      await prisma.$transaction([
        prisma.refreshToken.delete({ where: { id: storedToken.id } }),
        prisma.refreshToken.create({
          data: {
            userId: storedToken.user.id,
            token: newRefreshToken,
            expiresAt,
          },
        }),
      ]);

      return {
        accessToken: newAccessToken,
        refreshToken: newRefreshToken,
      };
    } catch (err: any) {
      if (err.statusCode) throw err;
      const error: any = new Error('Invalid or expired refresh token');
      error.statusCode = 401;
      throw error;
    }
  }

  static async logout(refreshToken: string) {
    await prisma.refreshToken.deleteMany({
      where: { token: refreshToken },
    });
  }

  static async getUserProfile(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        role: true,
        status: true,
        createdAt: true,
        updatedAt: true,
        student: true,
        company: true,
        college: true,
      },
    });

    if (!user) {
      const error: any = new Error('User not found');
      error.statusCode = 404;
      throw error;
    }

    return user;
  }
}
