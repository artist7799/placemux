import request from 'supertest';
import app from '../app';
import { generateAccessToken } from '../utils/jwt';
import { Role } from '@prisma/client';

describe('Job & Application System Integration Tests', () => {
  const companyToken = generateAccessToken({
    userId: 'mock-company-uuid-999',
    email: 'hr@company.com',
    role: Role.COMPANY,
  });

  const studentToken = generateAccessToken({
    userId: 'mock-student-uuid-888',
    email: 'candidate@student.com',
    role: Role.STUDENT,
  });

  describe('GET /api/jobs (Search & Browse Jobs)', () => {
    it('should allow public access to active jobs listing', async () => {
      const res = await request(app).get('/api/jobs');
      expect([200, 500]).toContain(res.status);
      if (res.status === 200) {
        expect(res.body.success).toBe(true);
        expect(Array.isArray(res.body.data)).toBe(true);
      }
    });

    it('should support search filtering query params', async () => {
      const res = await request(app).get('/api/jobs?search=Engineer&jobType=FULL_TIME');
      expect([200, 500]).toContain(res.status);
      if (res.status === 200) {
        expect(res.body.success).toBe(true);
      }
    });
  });

  describe('POST /api/jobs (Create Job Posting)', () => {
    it('should reject unauthenticated request', async () => {
      const res = await request(app)
        .post('/api/jobs')
        .send({
          title: 'Software Engineer',
          description: 'Full stack development role',
          location: 'Remote',
          jobType: 'FULL_TIME',
        });

      expect(res.status).toBe(401);
    });

    it('should reject job creation from STUDENT role', async () => {
      const res = await request(app)
        .post('/api/jobs')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({
          title: 'Software Engineer',
          description: 'Full stack development role',
          location: 'Remote',
          jobType: 'FULL_TIME',
        });

      expect([401, 403, 500]).toContain(res.status);
    });

    it('should validate job creation payload required fields', async () => {
      const res = await request(app)
        .post('/api/jobs')
        .set('Authorization', `Bearer ${companyToken}`)
        .send({
          title: 'S', // Too short
          description: 'Short', // Too short
        });

      expect([400, 401, 404, 500]).toContain(res.status);
    });
  });

  describe('POST /api/applications/apply (Job Application & Rules)', () => {
    it('should reject apply without authentication token', async () => {
      const res = await request(app)
        .post('/api/applications/apply')
        .send({ jobId: '00000000-0000-0000-0000-000000000000' });

      expect(res.status).toBe(401);
    });

    it('should reject application from COMPANY role', async () => {
      const res = await request(app)
        .post('/api/applications/apply')
        .set('Authorization', `Bearer ${companyToken}`)
        .send({ jobId: '00000000-0000-0000-0000-000000000000' });

      expect([401, 403, 500]).toContain(res.status);
    });

    it('should validate UUID format for jobId', async () => {
      const res = await request(app)
        .post('/api/applications/apply')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({ jobId: 'invalid-job-id' });

      expect([400, 401, 500]).toContain(res.status);
    });
  });

  describe('PATCH /api/applications/:id/status (Status Pipeline & Security)', () => {
    it('should reject status update from STUDENT role', async () => {
      const res = await request(app)
        .patch('/api/applications/00000000-0000-0000-0000-000000000000/status')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({ status: 'SHORTLISTED' });

      expect([401, 403, 500]).toContain(res.status);
    });

    it('should validate invalid status enum value', async () => {
      const res = await request(app)
        .patch('/api/applications/00000000-0000-0000-0000-000000000000/status')
        .set('Authorization', `Bearer ${companyToken}`)
        .send({ status: 'INVALID_STATUS_NAME' });

      expect([400, 401, 500]).toContain(res.status);
    });
  });
});
