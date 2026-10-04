import { z } from 'zod';

export const updateCollegeProfileSchema = z.object({
  body: z.object({
    name: z.string().min(2, 'College name is required').optional(),
    code: z.string().min(2, 'College code is required').optional(),
    address: z.string().optional(),
    contactEmail: z.string().email('Invalid email format').optional(),
    contactPhone: z.string().optional(),
  }),
});

export const verifyStudentSchema = z.object({
  body: z.object({
    isVerified: z.boolean(),
  }),
});
