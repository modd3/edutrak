"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const supertest_1 = __importDefault(require("supertest"));
const app_1 = __importDefault(require("../src/app"));
const auth_test_1 = require("./auth.test");
describe('User Management (Admin only)', () => {
    test('Admin can create a teacher', async () => {
        const res = await (0, supertest_1.default)(app_1.default)
            .post('/api/v1/users')
            .set('Authorization', `Bearer ${auth_test_1.adminToken}`)
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
        const teacherLogin = await (0, supertest_1.default)(app_1.default)
            .post('/api/v1/auth/login')
            .send({ email: 'teacher1@school.com', password: 'teach123' });
        const teacherToken = teacherLogin.body.token;
        const res = await (0, supertest_1.default)(app_1.default)
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
        const res = await (0, supertest_1.default)(app_1.default)
            .get('/api/v1/users')
            .set('Authorization', `Bearer ${auth_test_1.adminToken}`);
        expect(res.status).toBe(200);
        expect(res.body.users.length).toBeGreaterThan(0);
    });
});
//# sourceMappingURL=user.test.js.map