import { z } from 'zod';
import { PlacementStatus } from '@prisma/client';

export const updateProfileSchema = z.object({
  body: z.object({
    firstName: z.string().min(1, 'First name is required').optional(),
    lastName: z.string().min(1, 'Last name is required').optional(),
    phone: z.string().optional(),
    avatarUrl: z.string().url('Invalid avatar URL').optional().or(z.literal('')),
    gender: z.string().optional(),
    bio: z.string().optional(),
    address: z.string().optional(),
    cgpa: z.number().min(0).max(10).optional(),
    branch: z.string().optional(),
    graduationYear: z.number().int().optional(),
    placementStatus: z.nativeEnum(PlacementStatus).optional(),
  }),
});

export const educationSchema = z.object({
  body: z.object({
    degree: z.string().min(1, 'Degree is required'),
    fieldOfStudy: z.string().min(1, 'Field of study is required'),
    institution: z.string().min(1, 'Institution name is required'),
    startDate: z.string().datetime().or(z.string().regex(/^\d{4}-\d{2}-\d{2}$/)),
    endDate: z.string().datetime().or(z.string().regex(/^\d{4}-\d{2}-\d{2}$/)).optional().nullable(),
    grade: z.string().optional(),
    isCurrent: z.boolean().optional(),
  }),
});

export const addSkillSchema = z.object({
  body: z.object({
    skillName: z.string().min(1, 'Skill name is required'),
    category: z.string().optional(),
    proficiency: z.enum(['BEGINNER', 'INTERMEDIATE', 'ADVANCED', 'EXPERT']).optional(),
  }),
});

export const projectSchema = z.object({
  body: z.object({
    title: z.string().min(1, 'Project title is required'),
    description: z.string().min(1, 'Project description is required'),
    technologies: z.array(z.string()).min(1, 'At least one technology is required'),
    repoUrl: z.string().url('Invalid repository URL').optional().or(z.literal('')),
    demoUrl: z.string().url('Invalid demo URL').optional().or(z.literal('')),
    startDate: z.string().optional().nullable(),
    endDate: z.string().optional().nullable(),
  }),
});

export const certificationSchema = z.object({
  body: z.object({
    title: z.string().min(1, 'Certification title is required'),
    issuingOrganization: z.string().min(1, 'Issuing organization is required'),
    issueDate: z.string().datetime().or(z.string().regex(/^\d{4}-\d{2}-\d{2}$/)),
    expirationDate: z.string().optional().nullable(),
    credentialUrl: z.string().url('Invalid credential URL').optional().or(z.literal('')),
  }),
});

export const resumeSchema = z.object({
  body: z.object({
    fileUrl: z.string().min(1, 'File URL is required'),
    fileText: z.string().optional(),
  }),
});
