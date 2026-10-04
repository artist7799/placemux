import { z } from 'zod';
import { JobType, JobStatus } from '@prisma/client';

export const createJobSchema = z.object({
  body: z.object({
    title: z.string().min(2, 'Job title is required'),
    description: z.string().min(10, 'Job description must be at least 10 characters'),
    location: z.string().min(2, 'Location is required'),
    jobType: z.nativeEnum(JobType, {
      errorMap: () => ({ message: 'Job type must be FULL_TIME, PART_TIME, INTERNSHIP, or CONTRACT' }),
    }),
    salaryRange: z.string().optional(),
    requirements: z.array(z.string()).optional().default([]),
    minCgpa: z.number().min(0).max(10).optional().default(0.0),
    eligibleBranches: z.array(z.string()).optional().default([]),
    graduationYears: z.array(z.number().int()).optional().default([]),
    requiredSkillNames: z.array(z.string()).optional().default([]),
  }),
});

export const updateJobSchema = z.object({
  body: z.object({
    title: z.string().min(2).optional(),
    description: z.string().min(10).optional(),
    location: z.string().min(2).optional(),
    jobType: z.nativeEnum(JobType).optional(),
    salaryRange: z.string().optional(),
    requirements: z.array(z.string()).optional(),
    minCgpa: z.number().min(0).max(10).optional(),
    eligibleBranches: z.array(z.string()).optional(),
    graduationYears: z.array(z.number().int()).optional(),
    status: z.nativeEnum(JobStatus).optional(),
    requiredSkillNames: z.array(z.string()).optional(),
  }),
});

export const updateJobStatusSchema = z.object({
  body: z.object({
    status: z.nativeEnum(JobStatus, {
      errorMap: () => ({ message: 'Status must be DRAFT, ACTIVE, or CLOSED' }),
    }),
  }),
});
