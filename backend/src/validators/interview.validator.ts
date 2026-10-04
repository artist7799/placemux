import { z } from 'zod';
import { InterviewMode, InterviewStatus } from '@prisma/client';

export const scheduleInterviewSchema = z.object({
  body: z.object({
    applicationId: z.string().uuid('Invalid Application ID format'),
    scheduledAt: z.string().datetime().or(z.string().regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/)),
    durationMinutes: z.number().int().min(15).default(45),
    mode: z.nativeEnum(InterviewMode).default(InterviewMode.ONLINE),
    meetingLink: z.string().url().optional().or(z.literal('')),
  }),
});

export const interviewFeedbackSchema = z.object({
  body: z.object({
    rating: z.number().int().min(1).max(5),
    comments: z.string().min(2, 'Comments are required'),
    recommendation: z.enum(['SELECT', 'REJECT', 'HOLD']),
  }),
});
