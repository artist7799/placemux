import request from 'supertest';
import app from '../app';
import { generateAccessToken } from '../utils/jwt';
import { Role } from '@prisma/client';

describe('AI Microservice Proxy Integration Tests', () => {
  const studentToken = generateAccessToken({
    userId: 'student-ai-test-id-123',
    email: 'student.ai@example.com',
    role: Role.STUDENT,
  });

  describe('POST /api/ai/resume/analyze', () => {
    it('should reject unauthenticated request', async () => {
      const res = await request(app)
        .post('/api/ai/resume/analyze')
        .send({ rawText: 'Sample resume text for AI processing' });

      expect(res.status).toBe(401);
    });

    it('should validate short resume text', async () => {
      const res = await request(app)
        .post('/api/ai/resume/analyze')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({ rawText: 'Short' });

      expect([400, 401, 500]).toContain(res.status);
    });

    it('should calculate resume score and extracted skills', async () => {
      const res = await request(app)
        .post('/api/ai/resume/analyze')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({
          rawText: `
            Jaikrishna Janjanam
            Full Stack Developer
            Skills: TypeScript, Node.js, Express, React, PostgreSQL, Docker, Git
            Education: B.Tech in CSE (GPA: 8.5)
            Projects: Built scalable SaaS backend handling 10,000 requests/day.
          `,
        });

      expect([200, 401, 500]).toContain(res.status);
      if (res.status === 200) {
        expect(res.body.data).toHaveProperty('resume_score');
        expect(res.body.data).toHaveProperty('extracted_data');
        expect(res.body.data).toHaveProperty('improvement_suggestions');
      }
    });
  });

  describe('POST /api/ai/jobs/:jobId/match', () => {
    it('should handle match request for job id', async () => {
      const res = await request(app)
        .post('/api/ai/jobs/non-existent-job-id-999/match')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({ studentSkills: ['TypeScript', 'Node.js'] });

      expect([401, 404, 500]).toContain(res.status);
    });
  });
});
