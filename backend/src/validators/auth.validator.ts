import { z } from 'zod';
import { Role } from '@prisma/client';

export const registerSchema = z.object({
  body: z.object({
    email: z.string().email('Invalid email format'),
    password: z.string().min(6, 'Password must be at least 6 characters long'),
    role: z.nativeEnum(Role, {
      errorMap: () => ({ message: 'Role must be STUDENT, COMPANY, COLLEGE, or ADMIN' }),
    }),
    // Student specific fields
    firstName: z.string().optional(),
    lastName: z.string().optional(),
    phone: z.string().optional(),
    cgpa: z.number().optional(),
    branch: z.string().optional(),
    graduationYear: z.number().optional(),

    // Company specific fields
    companyName: z.string().optional(),
    website: z.string().optional(),
    industry: z.string().optional(),

    // College specific fields
    collegeName: z.string().optional(),
    code: z.string().optional(),
  }).refine((data) => {
    if (data.role === Role.STUDENT) {
      return !!data.firstName && !!data.lastName;
    }
    if (data.role === Role.COMPANY) {
      return !!data.companyName;
    }
    if (data.role === Role.COLLEGE) {
      return !!data.collegeName && !!data.code;
    }
    return true;
  }, {
    message: 'Required profile details missing for the selected role',
  }),
});

export const loginSchema = z.object({
  body: z.object({
    email: z.string().email('Invalid email format'),
    password: z.string().min(1, 'Password is required'),
  }),
});

export const refreshTokenSchema = z.object({
  body: z.object({
    refreshToken: z.string().min(1, 'Refresh token is required'),
  }),
});
