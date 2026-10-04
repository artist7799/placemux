import { z } from 'zod';
import { OfferStatus } from '@prisma/client';

export const issueOfferSchema = z.object({
  body: z.object({
    applicationId: z.string().uuid('Invalid Application ID format'),
    positionTitle: z.string().min(2, 'Position title is required'),
    salary: z.string().min(1, 'Salary details are required'),
    joiningDate: z.string().datetime().or(z.string().regex(/^\d{4}-\d{2}-\d{2}/)),
    offerLetterUrl: z.string().url().optional().or(z.literal('')),
    validUntil: z.string().optional().nullable(),
  }),
});

export const respondOfferSchema = z.object({
  body: z.object({
    status: z.enum(['ACCEPTED', 'REJECTED'], {
      errorMap: () => ({ message: 'Status must be ACCEPTED or REJECTED' }),
    }),
  }),
});
