"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const entitlement_service_1 = require("../src/services/entitlement.service");
const client_1 = __importDefault(require("../src/database/client"));
jest.mock('../src/database/client', () => ({
    __esModule: true,
    default: {
        tenantSubscription: {
            findFirst: jest.fn(),
        },
        usageMetric: {
            findFirst: jest.fn(),
        },
    },
}));
const mockedPrisma = client_1.default;
describe('EntitlementService', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });
    test('allows feature for ACTIVE subscription with enabled feature', async () => {
        mockedPrisma.tenantSubscription.findFirst.mockResolvedValue({
            status: 'ACTIVE',
            plan: { features: [{ featureKey: 'fees.core', enabled: true }] },
        });
        const result = await entitlement_service_1.entitlementService.canUseFeature('school-1', 'fees.core');
        expect(result.allowed).toBe(true);
    });
    test('denies feature for SUSPENDED subscription', async () => {
        mockedPrisma.tenantSubscription.findFirst.mockResolvedValue({
            status: 'SUSPENDED',
            plan: { features: [{ featureKey: 'fees.core', enabled: true }] },
        });
        const result = await entitlement_service_1.entitlementService.canUseFeature('school-1', 'fees.core');
        expect(result.allowed).toBe(false);
        expect(result.reason).toContain('SUSPENDED');
    });
    test('denies quota when limit exceeded', async () => {
        mockedPrisma.tenantSubscription.findFirst.mockResolvedValue({
            status: 'ACTIVE',
            plan: { features: [{ featureKey: 'students.max', enabled: true, limitType: 'COUNT', limitValue: 100 }] },
        });
        mockedPrisma.usageMetric.findFirst.mockResolvedValue({ usedUnits: 95 });
        const result = await entitlement_service_1.entitlementService.withinQuota('school-1', 'students.max', 10);
        expect(result.allowed).toBe(false);
        expect(result.reason).toContain('Quota exceeded');
    });
    test('allows quota when usage is within limit', async () => {
        mockedPrisma.tenantSubscription.findFirst.mockResolvedValue({
            status: 'GRACE',
            plan: { features: [{ featureKey: 'students.max', enabled: true, limitType: 'COUNT', limitValue: 100 }] },
        });
        mockedPrisma.usageMetric.findFirst.mockResolvedValue({ usedUnits: 60 });
        const result = await entitlement_service_1.entitlementService.withinQuota('school-1', 'students.max', 10);
        expect(result.allowed).toBe(true);
    });
});
//# sourceMappingURL=entitlement.service.test.js.map