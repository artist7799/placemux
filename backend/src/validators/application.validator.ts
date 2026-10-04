import { z } from 'zod';
import { ApplicationStatus } from '@prisma/client';

export const applyJobSchema = z.object({
  body: z.object({
    jobId: z.string().uuid('Invalid Job ID format'),
  }),
});

export const updateApplicationStatusSchema = z.object({
  body: z.object({
    status: z.nativeEnum(ApplicationStatus, {
      errorMap: () => ({
        message:
          'Status must be APPLIED, SHORTLISTED, ASSESSMENT, ASSESSMENT_PASSED, INTERVIEW, SELECTED, OFFERED, ACCEPTED, REJECTED, or WITHDRAWN',
      }),
    }),
    remarks: z.string().optional(),
  }),
});
