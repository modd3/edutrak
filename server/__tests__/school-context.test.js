"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const school_context_1 = require("../src/middleware/school-context");
const client_1 = __importDefault(require("../src/database/client"));
jest.mock('../src/database/client', () => ({
    __esModule: true,
    default: {
        school: {
            findUnique: jest.fn(),
        },
    },
}));
jest.mock('../src/services/subscription.service', () => ({
    SubscriptionService: jest.fn().mockImplementation(() => ({
        getSubscriptions: jest.fn(),
    })),
}));
describe('school context override', () => {
    const createResponse = () => {
        const res = {};
        res.status = jest.fn().mockReturnValue(res);
        res.json = jest.fn().mockReturnValue(res);
        return res;
    };
    beforeEach(() => {
        jest.clearAllMocks();
    });
    it('sets req.schoolId from X-School-Override for super admins', async () => {
        client_1.default.school.findUnique.mockResolvedValue({ id: 'school-123' });
        const req = {
            user: { id: 'super-1', role: 'SUPER_ADMIN' },
            headers: { 'x-school-override': 'school-123' },
        };
        const res = createResponse();
        const next = jest.fn();
        await (0, school_context_1.enforceSchoolContext)(req, res, next);
        expect(client_1.default.school.findUnique).toHaveBeenCalledWith({
            where: { id: 'school-123' },
            select: { id: true },
        });
        expect(req.isSuperAdmin).toBe(true);
        expect(req.schoolId).toBe('school-123');
        expect(next).toHaveBeenCalledTimes(1);
    });
    it('scopes where clauses for super admins when override schoolId is present', () => {
        expect((0, school_context_1.buildSchoolWhereClause)({ isActive: true }, 'school-123', true)).toEqual({
            isActive: true,
            schoolId: 'school-123',
        });
    });
});
//# sourceMappingURL=school-context.test.js.map