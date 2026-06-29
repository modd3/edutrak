import { randomUUID } from 'crypto';
import prisma from '../database/client';
import logger from '../utils/logger';
import { features } from 'process';

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
  }) {
    // Ensure the referenced plan exists to avoid FK constraint errors
    const plan = await (prisma as any).plan.findUnique({ where: { id: data.planId } });
    if (!plan) {
      logger.error(`Plan not found for id ${data.planId}`);
      throw new Error('Plan not found');
    }

    return await (prisma as any).tenantSubscription.create({
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
        include: { plan: {include: {features: true}}, school: { select: { id: true, name: true } } },
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

  async transitionSubscriptionStatus(id: string, nextStatus: string, graceEndsAt?: string) {
    const subscription = await (prisma as any).tenantSubscription.findUnique({ where: { id } });
    if (!subscription) throw new Error('Subscription not found');

    const allowed = ALLOWED_TRANSITIONS[subscription.status] ?? [];
    if (!allowed.includes(nextStatus)) {
      throw new Error(`Invalid status transition: ${subscription.status} -> ${nextStatus}`);
    }

    return await (prisma as any).tenantSubscription.update({
      where: { id },
      data: {
        status: nextStatus,
        graceEndsAt: graceEndsAt ? new Date(graceEndsAt) : subscription.graceEndsAt,
        canceledAt: nextStatus === 'CANCELED' ? new Date() : null,
      },
      include: { plan: true, school: true },
    });
  }
}
