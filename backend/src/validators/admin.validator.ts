import { z } from 'zod';
import { UserStatus, Role, JobStatus } from '@prisma/client';

export const updateUserStatusSchema = z.object({
  status: z.nativeEnum(UserStatus).optional(),
  role: z.nativeEnum(Role).optional(),
});

export const verifyCompanySchema = z.object({
  isVerified: z.boolean(),
});

export const updateJobStatusSchema = z.object({
  status: z.nativeEnum(JobStatus),
});
