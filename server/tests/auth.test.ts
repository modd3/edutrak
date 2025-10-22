import request from 'supertest';
import app from '../src/app';
import prisma from '../src/prismaClient';
import { hashPassword } from '../src/utils/hash';

let adminToken: string;

beforeAll(async () => {
  // Clean DB
  await prisma.user.deleteMany();

  // Create admin user manually
  const adminPassword = await hashPassword('admin123');
  await prisma.user.create({
    data: {
      email: 'admin@school.com',
      password: adminPassword,
      firstName: 'Admin',
      lastName: 'User',
      role: 'ADMIN',
    },
  });
});

afterAll(async () => {
  await prisma.$disconnect();
});

describe('Authentication Flow', () => {
  test('Login admin should return token', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'admin@school.com', password: 'admin123' });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.token).toBeDefined();

    adminToken = res.body.token;
  });

  test('Reject invalid login', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'wrong@user.com', password: 'wrong' });

    expect(res.status).toBe(401);
  });
});

export { adminToken };
