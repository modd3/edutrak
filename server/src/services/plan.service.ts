import { PrismaClient, BillingInterval, PlanFeature } from '@prisma/client';
import { BaseService } from './base.service';
import prisma from '../database/client';
import { UpsertPlanFeatureInput } from '@/validation/plan-feature.validation';
import { CreatePlanInput, UpdatePlanInput } from '../validation/plan.validation';
import { isValidFeatureKey } from '../config/feature-registry';
import logger from '../utils/logger';

export interface PlanFilters {
  page?: number;
  limit?: number;
  isActive?: boolean;
}

/*export interface CreatePlanData {
  key: string;
  name: string;
  description?: string;
  priceMinor: number;
  currency?: string;
  billingInterval: BillingInterval;
  features?: UpsertPlanFeatureInput[];
  isActive?: boolean;
}
*/
/*export interface UpdatePlanData {
  name?: string;
  description?: string;
  priceMinor?: number;
  currency?: string;
  billingInterval?: BillingInterval;
  features?: UpsertPlanFeatureInput[];
  isActive?: boolean;
}
*/
export class PlanService extends BaseService {
  constructor() {
    super();
  }

  async getPlans(filters: PlanFilters = {}) {
    const page = filters.page ?? 1;
    const limit = filters.limit ?? 20;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (filters.isActive !== undefined) where.isActive = filters.isActive;

    const [plans, total] = await Promise.all([
      prisma.plan.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        include: { features: true },
      }),
      prisma.plan.count({ where }),
    ]);

    return {
      plans,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  }

  async getPlanById(id: string) {
    return await prisma.plan.findUnique({
      where: { id },
      include: { features: true },
    });
  }

  async createPlan(data: CreatePlanInput) {
    // Check if plan key is already taken
    const existing = await prisma.plan.findUnique({ where: { key: data.key } });
    if (existing) {
      throw new Error(`Plan with key "${data.key}" already exists`);
    }

    return await prisma.plan.create({
      data: {
        key: data.key,
        name: data.name,
        description: data.description,
        priceMinor: data.priceMinor,
        currency: data.currency ?? 'KES',
        billingInterval: data.billingInterval,
        isActive: data.isActive ?? true,
        features: data.features?.length
        ? {
            create: data.features.map(f => ({
              featureKey: f.featureKey,
              enabled: f.enabled ?? true,
              limitType: f.limitType ?? 'BOOLEAN',
              limitValue: f.limitValue ?? null,
            })),
          }
        : undefined,
      },
      include: { features: true },
    });
  }

  async updatePlan(id: string, data: UpdatePlanInput) {
    const plan = await prisma.plan.findUnique({ where: { id } });
    if (!plan) {
      throw new Error('Plan not found');
    }

    return await prisma.$transaction(async (tx) => {
      // 1. Update plan-level fields (key is intentionally never updatable)
      await tx.plan.update({
        where: { id },
        data: {
          name: data.name ?? plan.name,
          description: data.description ?? plan.description,
          priceMinor: data.priceMinor ?? plan.priceMinor,
          currency: data.currency ?? plan.currency,
          billingInterval: data.billingInterval ?? plan.billingInterval,
          isActive: data.isActive ?? plan.isActive,
        },
      });

      // 2. If features were provided, upsert each one in the same transaction.
      //    This does NOT remove features that are omitted from the array —
      //    it's a merge, not a replace. Use removeFeature() for deletions.
      if (data.features?.length) {
        for (const f of data.features) {
          if (!isValidFeatureKey(f.featureKey)) {
            logger.warn('Unregistered feature key used on plan update', {
              planId: id,
              featureKey: f.featureKey,
            });
          }

          await tx.planFeature.upsert({
            where: {
              planId_featureKey: { planId: id, featureKey: f.featureKey },
            },
            update: {
              enabled: f.enabled,
              limitType: f.limitType,
              limitValue: f.limitValue ?? null,
            },
            create: {
              planId: id,
              featureKey: f.featureKey,
              enabled: f.enabled,
              limitType: f.limitType,
              limitValue: f.limitValue ?? null,
            },
          });
        }
      }

      logger.info('Plan updated', {
        planId: id,
        fieldsChanged: Object.keys(data).filter(k => k !== 'features'),
        featuresUpdated: data.features?.length ?? 0,
      });

      // 3. Return the fresh plan with its current feature set
      return tx.plan.findUnique({
        where: { id },
        include: { features: true },
      });
    });
  }
  

  async deletePlan(id: string) {
    const plan = await prisma.plan.findUnique({
      where: { id },
      include: { subscriptions: true },
    });

    if (!plan) {
      throw new Error('Plan not found');
    }

    if (plan.subscriptions && plan.subscriptions.length > 0) {
      throw new Error('Cannot delete plan with active subscriptions');
    }

    return await prisma.plan.delete({ where: { id } });
  }
}
