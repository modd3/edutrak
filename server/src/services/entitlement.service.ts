import prisma from '../database/client';

export type EntitlementDecision = {
  allowed: boolean;
  reason?: string;
};

const SUBSCRIPTION_ACCESS_STATES = new Set(['TRIALING', 'ACTIVE', 'GRACE']);

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
