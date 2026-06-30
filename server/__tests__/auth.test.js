"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.adminToken = void 0;
const supertest_1 = __importDefault(require("supertest"));
const app_1 = __importDefault(require("../src/app"));
const prismaClient_1 = __importDefault(require("../src/prismaClient"));
const hash_1 = require("../src/utils/hash");
let adminToken;
beforeAll(async () => {
    await prismaClient_1.default.user.deleteMany();
    const adminPassword = await (0, hash_1.hashPassword)('admin123');
    await prismaClient_1.default.user.create({
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
    await prismaClient_1.default.$disconnect();
});
describe('Authentication Flow', () => {
    test('Login admin should return token', async () => {
        const res = await (0, supertest_1.default)(app_1.default)
            .post('/api/v1/auth/login')
            .send({ email: 'admin@school.com', password: 'admin123' });
        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        expect(res.body.token).toBeDefined();
        exports.adminToken = adminToken = res.body.token;
    });
    test('Reject invalid login', async () => {
        const res = await (0, supertest_1.default)(app_1.default)
            .post('/api/v1/auth/login')
            .send({ email: 'wrong@user.com', password: 'wrong' });
        expect(res.status).toBe(401);
    });
});
//# sourceMappingURL=auth.test.js.map