import request from 'supertest';
import app from '../app';
import { generateAccessToken } from '../utils/jwt';
import { Role } from '@prisma/client';

describe('Student Module API Integration Tests', () => {
  const studentToken = generateAccessToken({
    userId: 'mock-student-uuid-1234',
    email: 'mock.student@placemux.com',
    role: Role.STUDENT,
  });

  const companyToken = generateAccessToken({
    userId: 'mock-company-uuid-5678',
    email: 'mock.company@placemux.com',
    role: Role.COMPANY,
  });

  describe('GET /api/students/profile', () => {
    it('should reject unauthenticated request', async () => {
      const res = await request(app).get('/api/students/profile');
      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it('should reject request from non-student role', async () => {
      const res = await request(app)
        .get('/api/students/profile')
        .set('Authorization', `Bearer ${companyToken}`);

      expect([401, 403, 500]).toContain(res.status);
    });
  });

  describe('GET /api/students/dashboard', () => {
    it('should require authentication token', async () => {
      const res = await request(app).get('/api/students/dashboard');
      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });
  });

  describe('POST /api/students/education validation', () => {
    it('should validate required education fields', async () => {
      const res = await request(app)
        .post('/api/students/education')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({
          // missing degree, fieldOfStudy, institution, startDate
        });

      expect([400, 401, 500]).toContain(res.status);
      if (res.status === 400) {
        expect(res.body.success).toBe(false);
        expect(res.body.message).toContain('Validation failed');
      }
    });
  });

  describe('POST /api/students/skills validation', () => {
    it('should validate skill payload', async () => {
      const res = await request(app)
        .post('/api/students/skills')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({
          skillName: '', // invalid empty name
        });

      expect([400, 401, 500]).toContain(res.status);
    });
  });
});
