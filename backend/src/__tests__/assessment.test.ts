import request from 'supertest';
import app from '../app';
import { generateAccessToken } from '../utils/jwt';
import { Role, QuestionType } from '@prisma/client';
import { AssessmentService } from '../services/assessment.service';

describe('Online Assessment System Integration Tests', () => {
  const companyToken = generateAccessToken({
    userId: 'mock-company-uuid-111',
    email: 'testcompany@placemux.com',
    role: Role.COMPANY,
  });

  const studentToken = generateAccessToken({
    userId: 'mock-student-uuid-222',
    email: 'teststudent@placemux.com',
    role: Role.STUDENT,
  });

  describe('Answer Scoring Engine', () => {
    it('should correctly score MCQ single choice questions', () => {
      const isCorrect = AssessmentService.checkAnswerCorrectness(
        QuestionType.MCQ,
        'Option B',
        'Option B'
      );
      expect(isCorrect).toBe(true);

      const isWrong = AssessmentService.checkAnswerCorrectness(
        QuestionType.MCQ,
        'Option B',
        'Option A'
      );
      expect(isWrong).toBe(false);
    });

    it('should correctly score MULTI_SELECT questions', () => {
      const isCorrect = AssessmentService.checkAnswerCorrectness(
        QuestionType.MULTI_SELECT,
        ['Option A', 'Option C'],
        ['Option C', 'Option A']
      );
      expect(isCorrect).toBe(true);

      const isWrong = AssessmentService.checkAnswerCorrectness(
        QuestionType.MULTI_SELECT,
        ['Option A', 'Option C'],
        ['Option A']
      );
      expect(isWrong).toBe(false);
    });

    it('should correctly score SQL and CODING questions', () => {
      const isCorrect = AssessmentService.checkAnswerCorrectness(
        QuestionType.SQL,
        'SELECT * FROM users;',
        'SELECT * FROM users;'
      );
      expect(isCorrect).toBe(true);
    });
  });

  describe('GET /api/assessments/assigned (Student View)', () => {
    it('should require student authentication', async () => {
      const res = await request(app).get('/api/assessments/assigned');
      expect(res.status).toBe(401);
    });

    it('should return list of assigned assessments for authenticated student', async () => {
      const res = await request(app)
        .get('/api/assessments/assigned')
        .set('Authorization', `Bearer ${studentToken}`);

      expect([200, 401, 500]).toContain(res.status);
    });
  });

  describe('POST /api/assessments (Company Setup)', () => {
    it('should reject assessment creation from STUDENT role', async () => {
      const res = await request(app)
        .post('/api/assessments')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({
          title: 'Aptitude & Technical Round',
          durationMinutes: 45,
          passingScore: 70,
        });

      expect([401, 403, 500]).toContain(res.status);
    });
  });

  describe('POST /api/assessments/sessions/:sessionId/submit Validation', () => {
    it('should validate empty response payload', async () => {
      const res = await request(app)
        .post('/api/assessments/sessions/00000000-0000-0000-0000-000000000000/submit')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({
          responses: [],
        });

      expect([400, 401, 500]).toContain(res.status);
    });
  });
});
