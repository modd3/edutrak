import prisma from '../database/client';

export type EntitlementDecision = {
  allowed: boolean;
  reason?: string;
};

// Thrown by UserCreationService when a role's plan limit (students.max,
// teachers.max, ...) is already reached. Controllers should catch this
// specifically and respond 402, rather than treating it like a generic
// validation error.
export class ResourceLimitError extends Error {
  constructor(public readonly role: string, message: string) {
    super(message);
    this.name = 'ResourceLimitError';
  }
}

const SUBSCRIPTION_ACCESS_STATES = new Set(['TRIALING', 'ACTIVE', 'PAST_DUE']);

// Single source of truth for "creating a User with this role counts against
// a COUNT-type plan feature". Every code path that creates a User (or a
// role-specific profile like Teacher/Student) MUST check through here -
// this map used to be duplicated per-controller, which is exactly how the
// teachers.max limit ended up silently bypassed by a second teacher-creation
// route that nobody remembered to gate. Add new roles here, not inline in a
// controller.
export const ROLE_RESOURCE_LIMITS: Record<string, { metricKey: string; countFn: (schoolId: string) => Promise<number> }> = {
  STUDENT: {
    metricKey: 'students.max',
    countFn: (schoolId: string) => (prisma as any).student.count({ where: { schoolId } }),
  },
  TEACHER: {
    metricKey: 'teachers.max',
    // Teacher has no direct schoolId column - it's scoped via its User.
    countFn: (schoolId: string) => (prisma as any).teacher.count({ where: { user: { schoolId } } }),
  },
};

class EntitlementService {
  async canUseFeature(schoolId: string, featureKey: string): Promise<EntitlementDecision> {
    if (!schoolId) {
      return { allowed: false, reason: 'School context required' };
    }

    const subscription = await (prisma as any).tenantSubscription.findFirst({
      where: { schoolId },
      orderBy: { createdAt: 'desc' },
      include: {
        plan: {
          include: {
            features: {
              where: { featureKey },
            },
          },
        },
      },
    });

    if (!subscription) {
      return { allowed: false, reason: 'No subscription found' };
    }

    if (!SUBSCRIPTION_ACCESS_STATES.has(subscription.status)) {
      return { allowed: false, reason: `Subscription status ${subscription.status} does not allow feature usage` };
    }

    const feature = subscription.plan?.features?.[0];
    if (!feature) {
      return { allowed: false, reason: `Feature ${featureKey} is not enabled on current plan` };
    }

    if (!feature.enabled) {
      return { allowed: false, reason: `Feature ${featureKey} is disabled on current plan` };
    }

    return { allowed: true };
  }

  async withinResourceLimit(
  schoolId: string,
  metricKey: string,
  countFn: () => Promise<number>,
  requestedUnits: number = 1
): Promise<EntitlementDecision> {
  const subscription = await (prisma as any).tenantSubscription.findFirst({
    where: { schoolId },
    orderBy: { createdAt: 'desc' },
    include: { plan: { include: { features: { where: { featureKey: metricKey } } } } },
  });

  if (!subscription || !SUBSCRIPTION_ACCESS_STATES.has(subscription.status)) {
    return { allowed: false, reason: 'Subscription not active' };
  }

  const feature = subscription.plan?.features?.[0];
  if (!feature?.enabled || feature.limitType !== 'COUNT') return { allowed: true };

  const currentCount = await countFn();
  const limitValue = feature.limitValue ?? 0;
  if (currentCount + requestedUnits > limitValue) {
    return { allowed: false, reason: `Limit reached: ${currentCount}/${limitValue} (${metricKey})` };
  }
  return { allowed: true };
}

  /**
   * Checks whether creating `requestedUnits` more Users of `role` would
   * exceed that role's plan limit (students.max / teachers.max). Returns
   * { allowed: true } for roles with no configured limit, and bypasses
   * entirely for super admins acting outside a single school's context -
   * same rule as requireFeature. Use this from every controller that can
   * create a User of a limited role, instead of re-deriving the check.
   */
  async checkRoleResourceLimit(
    schoolId: string | undefined,
    role: string | undefined,
    isSuperAdmin: boolean,
    requestedUnits: number = 1
  ): Promise<EntitlementDecision> {
    const limit = ROLE_RESOURCE_LIMITS[role ?? ''];
    if (!limit || !schoolId || isSuperAdmin) return { allowed: true };
    return this.withinResourceLimit(schoolId, limit.metricKey, () => limit.countFn(schoolId), requestedUnits);
  }

async incrementUsage(schoolId: string, metricKey: string, units: number = 1) {
  const now = new Date();
  const periodStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const periodEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

  await (prisma as any).usageMetric.upsert({
    where: { schoolId_metricKey_periodStart_periodEnd: { schoolId, metricKey, periodStart, periodEnd } },
    update: { usedUnits: { increment: units } },
    create: { schoolId, metricKey, periodStart, periodEnd, usedUnits: units },
  });
}

  async withinQuota(schoolId: string, metricKey: string, requestedUnits: number): Promise<EntitlementDecision> {
    if (!schoolId) return { allowed: false, reason: 'School context required' };
    if (requestedUnits <= 0) return { allowed: true };

    const subscription = await (prisma as any).tenantSubscription.findFirst({
      where: { schoolId },
      orderBy: { createdAt: 'desc' },
      include: {
        plan: {
          include: {
            features: {
              where: { featureKey: metricKey },
            },
          },
        },
      },
    });

    if (!subscription || !SUBSCRIPTION_ACCESS_STATES.has(subscription.status)) {
      return { allowed: false, reason: 'Subscription not active for quota checks' };
    }

    const feature = subscription.plan?.features?.[0];
    if (!feature || !feature.enabled) {
      return { allowed: false, reason: `Quota feature ${metricKey} unavailable` };
    }

    if (feature.limitType === 'BOOLEAN') {
      return { allowed: true };
    }

    const now = new Date();
    const periodStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const periodEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

    const usage = await (prisma as any).usageMetric.findFirst({
      where: { schoolId, metricKey, periodStart, periodEnd },
    });

    const usedUnits = usage?.usedUnits ?? 0;
    const limitValue = feature.limitValue ?? 0;

    if (usedUnits + requestedUnits > limitValue) {
      return { allowed: false, reason: `Quota exceeded for ${metricKey}: ${usedUnits}/${limitValue}` };
    }

    return { allowed: true };
  }
}

export const entitlementService = new EntitlementService();