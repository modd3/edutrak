// src/services/plan-feature.service.ts
import prisma from '../database/client';
import logger from '../utils/logger';
import { isValidFeatureKey } from '../config/feature-registry';
import { UpsertPlanFeatureInput } from '../validation/plan-feature.validation';

export class PlanFeatureService {

  async listFeatures(planId: string) {
    const plan = await prisma.plan.findUnique({ where: { id: planId } });
    if (!plan) throw new Error('Plan not found');

    return prisma.planFeature.findMany({
      where: { planId },
      orderBy: { featureKey: 'asc' },
    });
  }

  async upsertFeature(planId: string, data: UpsertPlanFeatureInput) {
    const plan = await prisma.plan.findUnique({ where: { id: planId } });
    if (!plan) throw new Error('Plan not found');

    if (!isValidFeatureKey(data.featureKey)) {
      logger.warn('Unregistered feature key used', { featureKey: data.featureKey, planId });
    }

    const feature = await prisma.planFeature.upsert({
      where: { planId_featureKey: { planId, featureKey: data.featureKey } },
      update: {
        enabled: data.enabled,
        limitType: data.limitType,
        limitValue: data.limitValue ?? null,
      },
      create: {
        planId,
        featureKey: data.featureKey,
        enabled: data.enabled,
        limitType: data.limitType,
        limitValue: data.limitValue ?? null,
      },
    });

    logger.info('Plan feature upserted', { planId, featureKey: data.featureKey });
    return feature;
  }

  async bulkSetFeatures(planId: string, features: UpsertPlanFeatureInput[]) {
    const plan = await prisma.plan.findUnique({ where: { id: planId } });
    if (!plan) throw new Error('Plan not found');

    return prisma.$transaction(
      features.map(f =>
        prisma.planFeature.upsert({
          where: { planId_featureKey: { planId, featureKey: f.featureKey } },
          update: { enabled: f.enabled, limitType: f.limitType, limitValue: f.limitValue ?? null },
          create: { planId, featureKey: f.featureKey, enabled: f.enabled, limitType: f.limitType, limitValue: f.limitValue ?? null },
        })
      )
    );
  }

  async removeFeature(planId: string, featureKey: string) {
    const feature = await prisma.planFeature.findUnique({
      where: { planId_featureKey: { planId, featureKey } },
    });
    if (!feature) throw new Error('Feature not found on this plan');

    await prisma.planFeature.delete({ where: { planId_featureKey: { planId, featureKey } } });
    logger.info('Plan feature removed', { planId, featureKey });
  }

  /** Useful for upgrade/downgrade comparison screens */
  async comparePlans(planIdA: string, planIdB: string) {
    const [a, b] = await Promise.all([
      prisma.plan.findUnique({ where: { id: planIdA }, include: { features: true } }),
      prisma.plan.findUnique({ where: { id: planIdB }, include: { features: true } }),
    ]);
    if (!a || !b) throw new Error('One or both plans not found');

    const aMap = new Map(a.features.map(f => [f.featureKey, f]));
    const bMap = new Map(b.features.map(f => [f.featureKey, f]));
    const allKeys = new Set([...aMap.keys(), ...bMap.keys()]);

    return Array.from(allKeys).map(key => ({
      featureKey: key,
      planA: aMap.get(key) ?? null,
      planB: bMap.get(key) ?? null,
    }));
  }
}

export const planFeatureService = new PlanFeatureService();