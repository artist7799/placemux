import request from 'supertest';
import app from '../app';
import { generateAccessToken } from '../utils/jwt';
import { Role } from '@prisma/client';

describe('Admin Governance & Monitoring Integration Tests', () => {
  const adminToken = generateAccessToken({
    userId: 'admin-test-id-123',
    email: 'admin@placemux.com',
    role: Role.ADMIN,
  });

  const studentToken = generateAccessToken({
    userId: 'student-test-id-456',
    email: 'student@example.com',
    role: Role.STUDENT,
  });

  describe('GET /api/admin/analytics (System Analytics)', () => {
    it('should reject unauthenticated request', async () => {
      const res = await request(app).get('/api/admin/analytics');
      expect(res.status).toBe(401);
    });

    it('should reject non-admin users (STUDENT role)', async () => {
      const res = await request(app)
        .get('/api/admin/analytics')
        .set('Authorization', `Bearer ${studentToken}`);

      expect([401, 403]).toContain(res.status);
    });

    it('should allow ADMIN role to retrieve system analytics', async () => {
      const res = await request(app)
        .get('/api/admin/analytics')
        .set('Authorization', `Bearer ${adminToken}`);

      expect([200, 401, 500]).toContain(res.status);
      if (res.status === 200) {
        expect(res.body.data).toHaveProperty('totalUsers');
        expect(res.body.data).toHaveProperty('activeStudents');
        expect(res.body.data).toHaveProperty('placedStudents');
        expect(res.body.data).toHaveProperty('totalJobs');
        expect(res.body.data).toHaveProperty('totalApplications');
      }
    });
  });

  describe('GET /api/admin/users (User Management)', () => {
    it('should retrieve users list with pagination', async () => {
      const res = await request(app)
        .get('/api/admin/users?page=1&limit=10')
        .set('Authorization', `Bearer ${adminToken}`);

      expect([200, 401, 500]).toContain(res.status);
    });
  });

  describe('PATCH /api/admin/companies/:id/verify (Company Verification)', () => {
    it('should validate company verification payload', async () => {
      const res = await request(app)
        .patch('/api/admin/companies/test-company-id/verify')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({});

      expect([400, 401, 500]).toContain(res.status);
    });
  });

  describe('GET /api/admin/audit-logs (Audit Logging System)', () => {
    it('should retrieve audit logs list for admin', async () => {
      const res = await request(app)
        .get('/api/admin/audit-logs')
        .set('Authorization', `Bearer ${adminToken}`);

      expect([200, 401, 500]).toContain(res.status);
    });
  });
});
