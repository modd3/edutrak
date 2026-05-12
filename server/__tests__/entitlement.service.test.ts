import { entitlementService } from '../src/services/entitlement.service';
import prisma from '../src/database/client';

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

const mockedPrisma = prisma as any;

describe('EntitlementService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('allows feature for ACTIVE subscription with enabled feature', async () => {
    mockedPrisma.tenantSubscription.findFirst.mockResolvedValue({
      status: 'ACTIVE',
      plan: { features: [{ featureKey: 'fees.core', enabled: true }] },
    });

    const result = await entitlementService.canUseFeature('school-1', 'fees.core');

    expect(result.allowed).toBe(true);
  });

  test('denies feature for SUSPENDED subscription', async () => {
    mockedPrisma.tenantSubscription.findFirst.mockResolvedValue({
      status: 'SUSPENDED',
      plan: { features: [{ featureKey: 'fees.core', enabled: true }] },
    });

    const result = await entitlementService.canUseFeature('school-1', 'fees.core');

    expect(result.allowed).toBe(false);
    expect(result.reason).toContain('SUSPENDED');
  });

  test('denies quota when limit exceeded', async () => {
    mockedPrisma.tenantSubscription.findFirst.mockResolvedValue({
      status: 'ACTIVE',
      plan: { features: [{ featureKey: 'students.max', enabled: true, limitType: 'COUNT', limitValue: 100 }] },
    });
    mockedPrisma.usageMetric.findFirst.mockResolvedValue({ usedUnits: 95 });

    const result = await entitlementService.withinQuota('school-1', 'students.max', 10);

    expect(result.allowed).toBe(false);
    expect(result.reason).toContain('Quota exceeded');
  });

  test('allows quota when usage is within limit', async () => {
    mockedPrisma.tenantSubscription.findFirst.mockResolvedValue({
      status: 'GRACE',
      plan: { features: [{ featureKey: 'students.max', enabled: true, limitType: 'COUNT', limitValue: 100 }] },
    });
    mockedPrisma.usageMetric.findFirst.mockResolvedValue({ usedUnits: 60 });

    const result = await entitlementService.withinQuota('school-1', 'students.max', 10);

    expect(result.allowed).toBe(true);
  });
});
