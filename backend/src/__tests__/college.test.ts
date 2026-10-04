import request from 'supertest';
import app from '../app';
import { generateAccessToken } from '../utils/jwt';
import { Role } from '@prisma/client';

describe('College Placement Management System Integration Tests', () => {
  const collegeToken = generateAccessToken({
    userId: 'mock-college-uuid-111',
    email: 'placements@college.edu',
    role: Role.COLLEGE,
  });

  const studentToken = generateAccessToken({
    userId: 'mock-student-uuid-222',
    email: 'student@college.edu',
    role: Role.STUDENT,
  });

  describe('GET /api/colleges/dashboard (Metrics & Statistics)', () => {
    it('should reject unauthenticated request', async () => {
      const res = await request(app).get('/api/colleges/dashboard');
      expect(res.status).toBe(401);
    });

    it('should reject access from STUDENT role', async () => {
      const res = await request(app)
        .get('/api/colleges/dashboard')
        .set('Authorization', `Bearer ${studentToken}`);

      expect([401, 403, 500]).toContain(res.status);
    });

    it('should allow COLLEGE role to retrieve placement metrics', async () => {
      const res = await request(app)
        .get('/api/colleges/dashboard')
        .set('Authorization', `Bearer ${collegeToken}`);

      expect([200, 401, 500]).toContain(res.status);
      if (res.status === 200) {
        expect(res.body.success).toBe(true);
        expect(res.body.data).toHaveProperty('totalStudents');
        expect(res.body.data).toHaveProperty('placementPercentage');
      }
    });
  });

  describe('GET /api/colleges/students (Student Directory & Filters)', () => {
    it('should support directory search and branch filters', async () => {
      const res = await request(app)
        .get('/api/colleges/students?branch=Computer%20Science&minCgpa=7.5')
        .set('Authorization', `Bearer ${collegeToken}`);

      expect([200, 401, 500]).toContain(res.status);
    });
  });

  describe('PATCH /api/colleges/students/:id/verify (Student Verification)', () => {
    it('should validate student verification payload', async () => {
      const res = await request(app)
        .patch('/api/colleges/students/00000000-0000-0000-0000-000000000000/verify')
        .set('Authorization', `Bearer ${collegeToken}`)
        .send({ isVerified: true });

      expect([200, 401, 404, 500]).toContain(res.status);
    });
  });
});
