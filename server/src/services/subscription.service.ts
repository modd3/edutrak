import { randomUUID } from 'crypto';
import prisma from '../database/client';
import logger from '../utils/logger';

const ALLOWED_TRANSITIONS: Record<string, string[]> = {
  TRIALING: ['ACTIVE', 'CANCELED', 'EXPIRED'],
  ACTIVE: ['PAST_DUE', 'GRACE', 'CANCELED', 'SUSPENDED'],
  PAST_DUE: ['GRACE', 'SUSPENDED', 'ACTIVE', 'CANCELED'],
  GRACE: ['ACTIVE', 'SUSPENDED', 'CANCELED'],
  SUSPENDED: ['ACTIVE', 'CANCELED', 'EXPIRED'],
  CANCELED: [],
  EXPIRED: ['ACTIVE'],
};

export class SubscriptionService {
  async createSubscription(data: {
    schoolId: string;
    planId: string;
    startsAt: string;
    currentPeriodStart: string;
    currentPeriodEnd: string;
    trialEndsAt?: string;
  }, createdByUserId?: string) {
    const plan = await (prisma as any).plan.findUnique({ where: { id: data.planId } });
    if (!plan) {
      logger.error(`Plan not found for id ${data.planId}`);
      throw new Error('Plan not found');
    }

    // Auto-create billing account if one doesn't exist
    const existingAccount = await (prisma as any).billingAccount.findUnique({
      where: { schoolId: data.schoolId },
    });
    if (!existingAccount) {
      const school = await (prisma as any).school.findUnique({
        where: { id: data.schoolId },
        select: { name: true },
      });
      await (prisma as any).billingAccount.create({
        data: {
          id: randomUUID(),
          schoolId: data.schoolId,
          legalName: school?.name || data.schoolId,
          preferredCurrency: plan.currency || 'KES',
        },
      });
    }

    const subscription = await (prisma as any).tenantSubscription.create({
      data: {
        id: randomUUID(),
        schoolId: data.schoolId,
        planId: data.planId,
        status: data.trialEndsAt ? 'TRIALING' : 'ACTIVE',
        startsAt: new Date(data.startsAt),
        currentPeriodStart: new Date(data.currentPeriodStart),
        currentPeriodEnd: new Date(data.currentPeriodEnd),
        trialEndsAt: data.trialEndsAt ? new Date(data.trialEndsAt) : null,
      },
      include: { plan: true, school: true },
    });

    // Audit logging
    if (createdByUserId) {
      await (prisma as any).auditLog.create({
        data: {
          schoolId: data.schoolId,
          actorId: createdByUserId,
          actorRole: 'ADMIN',
          action: 'SUBSCRIPTION_CREATED',
          entityType: 'TenantSubscription',
          entityId: subscription.id,
          entityName: `Subscription for ${subscription.school?.name || data.schoolId}`,
          details: `Created subscription with plan ${plan.name}`,
        },
      });
    }

    return subscription;
  }

  async getSubscriptions(filters: { schoolId?: string; status?: string; page?: number; limit?: number }) {
    const page = filters.page ?? 1;
    const limit = filters.limit ?? 20;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (filters.schoolId) where.schoolId = filters.schoolId;
    if (filters.status) where.status = filters.status;

    const [subscriptions, total] = await Promise.all([
      (prisma as any).tenantSubscription.findMany({
        where,
        include: { plan: { include: { features: true } }, school: { select: { id: true, name: true } } },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      (prisma as any).tenantSubscription.count({ where }),
    ]);

    return {
      subscriptions,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    };
  }

  async getSubscriptionById(id: string) {
    return await (prisma as any).tenantSubscription.findUnique({
      where: { id },
      include: { plan: true, school: true },
    });
  }

  async getSubscriptionBySchool(schoolId: string) {
    return await (prisma as any).tenantSubscription.findFirst({
      where: { schoolId },
      orderBy: { createdAt: 'desc' },
      include: {
        plan: { include: { features: true } },
        school: true,
        invoices: {
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
      },
    });
  }

  async transitionSubscriptionStatus(
    id: string,
    nextStatus: string,
    graceEndsAt?: string,
    schoolId?: string,
    changedByUserId?: string
  ) {
    const subscription = await (prisma as any).tenantSubscription.findUnique({ where: { id } });
    if (!subscription) throw new Error('Subscription not found');

    // Validate school access for ADMIN
    if (schoolId && subscription.schoolId !== schoolId) {
      throw new Error('You do not have access to this subscription');
    }

    const allowed = ALLOWED_TRANSITIONS[subscription.status] ?? [];
    if (!allowed.includes(nextStatus)) {
      throw new Error(`Invalid status transition: ${subscription.status} -> ${nextStatus}`);
    }

    const updateData: any = {
      status: nextStatus,
      graceEndsAt: graceEndsAt ? new Date(graceEndsAt) : subscription.graceEndsAt,
      canceledAt: nextStatus === 'CANCELED' ? new Date() : null,
    };

    const updated = await (prisma as any).tenantSubscription.update({
      where: { id },
      data: updateData,
      include: { plan: true, school: true },
    });

    // Audit logging
    if (changedByUserId) {
      await (prisma as any).auditLog.create({
        data: {
          schoolId: subscription.schoolId,
          actorId: changedByUserId,
          actorRole: 'ADMIN',
          action: 'SUBSCRIPTION_STATUS_CHANGED',
          entityType: 'TenantSubscription',
          entityId: id,
          entityName: `Subscription for ${subscription.school?.name || subscription.schoolId}`,
          details: `Changed status from ${subscription.status} to ${nextStatus}`,
        },
      });
    }

    return updated;
  }

  async changePlan(
    subscriptionId: string,
    newPlanId: string,
    trialEndsAt?: string,
    schoolId?: string,
    changedByUserId?: string
  ) {
    const subscription = await (prisma as any).tenantSubscription.findUnique({
      where: { id: subscriptionId },
      include: { plan: true, school: true },
    });
    if (!subscription) throw new Error('Subscription not found');

    // Validate school access for ADMIN
    if (schoolId && subscription.schoolId !== schoolId) {
      throw new Error('You do not have access to this subscription');
    }

    // Validate new plan exists
    const newPlan = await (prisma as any).plan.findUnique({ where: { id: newPlanId } });
    if (!newPlan) {
      throw new Error('New plan not found');
    }
    if (!newPlan.isActive) {
      throw new Error('Selected plan is not active');
    }

    // If same plan, no change needed
    if (subscription.planId === newPlanId) {
      throw new Error('Subscription is already on this plan');
    }

    const now = new Date();
    const oldPlanName = subscription.plan?.name || 'Unknown';

    // Determine subscription period reset
    // Start new period from now when changing plans
    const currentPeriodStart = now;
    let currentPeriodEnd: Date;
    
    // Calculate period end based on billing interval
    if (newPlan.billingInterval === 'MONTHLY') {
      currentPeriodEnd = new Date(now);
      currentPeriodEnd.setMonth(currentPeriodEnd.getMonth() + 1);
    } else if (newPlan.billingInterval === 'QUARTERLY') {
      currentPeriodEnd = new Date(now);
      currentPeriodEnd.setMonth(currentPeriodEnd.getMonth() + 3);
    } else if (newPlan.billingInterval === 'YEARLY') {
      currentPeriodEnd = new Date(now);
      currentPeriodEnd.setFullYear(currentPeriodEnd.getFullYear() + 1);
    } else {
      currentPeriodEnd = new Date(now);
      currentPeriodEnd.setMonth(currentPeriodEnd.getMonth() + 1);
    }

    // Determine new status
    const hasTrial = !!trialEndsAt;
    const newStatus = hasTrial ? 'TRIALING' : 'ACTIVE';

    const updated = await (prisma as any).tenantSubscription.update({
      where: { id: subscriptionId },
      data: {
        planId: newPlanId,
        status: newStatus,
        startsAt: now,
        currentPeriodStart: currentPeriodStart,
        currentPeriodEnd: currentPeriodEnd,
        trialEndsAt: hasTrial ? new Date(trialEndsAt) : null,
        renewalCount: { increment: 1 },
      },
      include: { plan: true, school: true },
    });

    // Audit logging
    if (changedByUserId) {
      await (prisma as any).auditLog.create({
        data: {
          schoolId: subscription.schoolId,
          actorId: changedByUserId,
          actorRole: 'ADMIN',
          action: 'SUBSCRIPTION_PLAN_CHANGED',
          entityType: 'TenantSubscription',
          entityId: subscriptionId,
          entityName: `Subscription for ${subscription.school?.name || subscription.schoolId}`,
          details: `Changed plan from ${oldPlanName} to ${newPlan.name}${hasTrial ? ' with trial' : ''}`,
        },
      });
    }

    return updated;
  }

  async renewSubscription(
    subscriptionId: string,
    trialEndsAt?: string,
    schoolId?: string,
    changedByUserId?: string
  ) {
    const subscription = await (prisma as any).tenantSubscription.findUnique({
      where: { id: subscriptionId },
      include: { plan: true },
    });
    if (!subscription) throw new Error('Subscription not found');

    // Validate school access for ADMIN
    if (schoolId && subscription.schoolId !== schoolId) {
      throw new Error('You do not have access to this subscription');
    }

    // Only allow renewal from expired or terminal states
    const canRenew = ['EXPIRED', 'CANCELED'].includes(subscription.status);
    if (!canRenew) {
      throw new Error(`Cannot renew subscription with status: ${subscription.status}`);
    }

    const now = new Date();
    let currentPeriodEnd: Date;

    // Calculate new period based on plan billing interval
    if (subscription.plan.billingInterval === 'MONTHLY') {
      currentPeriodEnd = new Date(now);
      currentPeriodEnd.setMonth(currentPeriodEnd.getMonth() + 1);
    } else if (subscription.plan.billingInterval === 'QUARTERLY') {
      currentPeriodEnd = new Date(now);
      currentPeriodEnd.setMonth(currentPeriodEnd.getMonth() + 3);
    } else if (subscription.plan.billingInterval === 'YEARLY') {
      currentPeriodEnd = new Date(now);
      currentPeriodEnd.setFullYear(currentPeriodEnd.getFullYear() + 1);
    } else {
      currentPeriodEnd = new Date(now);
      currentPeriodEnd.setMonth(currentPeriodEnd.getMonth() + 1);
    }

    const hasTrial = !!trialEndsAt;
    const newStatus = hasTrial ? 'TRIALING' : 'ACTIVE';

    const updated = await (prisma as any).tenantSubscription.update({
      where: { id: subscriptionId },
      data: {
        status: newStatus,
        startsAt: now,
        currentPeriodStart: now,
        currentPeriodEnd: currentPeriodEnd,
        trialEndsAt: hasTrial ? new Date(trialEndsAt) : null,
        canceledAt: null,
        renewalCount: { increment: 1 },
      },
      include: { plan: true, school: true },
    });

    // Audit logging
    if (changedByUserId) {
      await (prisma as any).auditLog.create({
        data: {
          schoolId: subscription.schoolId,
          actorId: changedByUserId,
          actorRole: 'ADMIN',
          action: 'SUBSCRIPTION_RENEWED',
          entityType: 'TenantSubscription',
          entityId: subscriptionId,
          entityName: `Subscription for ${subscription.school?.name || subscription.schoolId}`,
          details: `Renewed subscription (was ${subscription.status})${hasTrial ? ' with trial' : ''}`,
        },
      });
    }

    return updated;
  }
}