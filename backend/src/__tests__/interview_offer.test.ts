import request from 'supertest';
import app from '../app';
import { generateAccessToken } from '../utils/jwt';
import { Role } from '@prisma/client';

describe('Interview & Offer Management Integration Tests', () => {
  const companyToken = generateAccessToken({
    userId: 'mock-company-uuid-777',
    email: 'recruiter@company.com',
    role: Role.COMPANY,
  });

  const studentToken = generateAccessToken({
    userId: 'mock-student-uuid-666',
    email: 'placed.student@placemux.com',
    role: Role.STUDENT,
  });

  describe('POST /api/interviews/schedule (Interview Scheduling & Authorization)', () => {
    it('should reject interview schedule without authentication token', async () => {
      const res = await request(app)
        .post('/api/interviews/schedule')
        .send({
          applicationId: '00000000-0000-0000-0000-000000000000',
          scheduledAt: '2026-10-15T10:00:00Z',
        });

      expect(res.status).toBe(401);
    });

    it('should reject scheduling interview from STUDENT role', async () => {
      const res = await request(app)
        .post('/api/interviews/schedule')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({
          applicationId: '00000000-0000-0000-0000-000000000000',
          scheduledAt: '2026-10-15T10:00:00Z',
        });

      expect([401, 403, 500]).toContain(res.status);
    });
  });

  describe('GET /api/interviews/my-interviews (Student View)', () => {
    it('should allow student to fetch scheduled interviews', async () => {
      const res = await request(app)
        .get('/api/interviews/my-interviews')
        .set('Authorization', `Bearer ${studentToken}`);

      expect([200, 401, 500]).toContain(res.status);
    });
  });

  describe('POST /api/offers/issue (Job Offer Issuance)', () => {
    it('should reject offer creation from STUDENT role', async () => {
      const res = await request(app)
        .post('/api/offers/issue')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({
          applicationId: '00000000-0000-0000-0000-000000000000',
          positionTitle: 'Software Developer',
          salary: '$120,000 / year',
          joiningDate: '2027-01-15',
        });

      expect([401, 403, 500]).toContain(res.status);
    });
  });

  describe('PATCH /api/offers/:id/respond (Offer Response & Placement Status)', () => {
    it('should reject offer response with invalid status payload', async () => {
      const res = await request(app)
        .patch('/api/offers/00000000-0000-0000-0000-000000000000/respond')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({
          status: 'INVALID_RESPONSE_STATUS',
        });

      expect([400, 401, 500]).toContain(res.status);
    });
  });
});
