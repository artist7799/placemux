import { z } from 'zod';
import { QuestionType } from '@prisma/client';

export const createAssessmentSchema = z.object({
  body: z.object({
    title: z.string().min(2, 'Assessment title is required'),
    description: z.string().optional(),
    durationMinutes: z.number().int().min(1, 'Duration must be at least 1 minute').default(60),
    passingScore: z.number().min(0).max(100).default(60.0),
    jobId: z.string().uuid().optional().nullable(),
  }),
});

export const createQuestionSchema = z.object({
  body: z.object({
    type: z.nativeEnum(QuestionType, {
      errorMap: () => ({ message: 'Question type must be MCQ, MULTI_SELECT, APTITUDE, TECHNICAL, SQL, or CODING' }),
    }),
    prompt: z.string().min(5, 'Question prompt must be at least 5 characters'),
    options: z.array(z.string()).optional(),
    correctAnswer: z.any(), // JSON string, array, or scalar
    points: z.number().min(0.5).default(1.0),
  }),
});

export const addQuestionToAssessmentSchema = z.object({
  body: z.object({
    questionId: z.string().uuid(),
    order: z.number().int().optional().default(0),
  }),
});

export const submitAnswersSchema = z.object({
  body: z.object({
    responses: z.array(
      z.object({
        questionId: z.string().uuid(),
        answerGiven: z.any(),
      })
    ).min(1, 'At least one response is required'),
  }),
});
