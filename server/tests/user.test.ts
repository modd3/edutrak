import request from 'supertest';
import app from '../src/app';
import prisma from '../src/prismaClient';
import { adminToken } from './auth.test';

describe('User Management (Admin only)', () => {
  test('Admin can create a teacher', async () => {
    const res = await request(app)
      .post('/api/v1/users')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        email: 'teacher1@school.com',
        password: 'teach123',
        firstName: 'Alice',
        lastName: 'Mwangi',
        role: 'TEACHER',
      });

    expect(res.status).toBe(201);
    expect(res.body.user.email).toBe('teacher1@school.com');
  });

  test('Non-admin cannot create user', async () => {
    // Create a teacher login first
    const teacherLogin = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'teacher1@school.com', password: 'teach123' });

    const teacherToken = teacherLogin.body.token;

    const res = await request(app)
      .post('/api/v1/users')
      .set('Authorization', `Bearer ${teacherToken}`)
      .send({
        email: 'student1@school.com',
        password: 'stud123',
        firstName: 'John',
        lastName: 'Doe',
        role: 'STUDENT',
      });

    expect(res.status).toBe(403);
  });

  test('Admin can fetch all users', async () => {
    const res = await request(app)
      .get('/api/v1/users')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.users.length).toBeGreaterThan(0);
  });
});
