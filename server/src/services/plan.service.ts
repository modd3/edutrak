import { PrismaClient, BillingInterval } from '@prisma/client';
import { BaseService } from './base.service';
import prisma from '../database/client';

export interface PlanFilters {
  page?: number;
  limit?: number;
  isActive?: boolean;
}

export interface CreatePlanData {
  key: string;
  name: string;
  description?: string;
  priceMinor: number;
  currency?: string;
  billingInterval: BillingInterval;
  isActive?: boolean;
}

export interface UpdatePlanData {
  name?: string;
  description?: string;
  priceMinor?: number;
  currency?: string;
  billingInterval?: BillingInterval;
  isActive?: boolean;
}

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

  async createPlan(data: CreatePlanData) {
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
      },
      include: { features: true },
    });
  }

  async updatePlan(id: string, data: UpdatePlanData) {
    const plan = await prisma.plan.findUnique({ where: { id } });
    if (!plan) {
      throw new Error('Plan not found');
    }

    return await prisma.plan.update({
      where: { id },
      data: {
        name: data.name ?? plan.name,
        description: data.description ?? plan.description,
        priceMinor: data.priceMinor ?? plan.priceMinor,
        currency: data.currency ?? plan.currency,
        billingInterval: data.billingInterval ?? plan.billingInterval,
        isActive: data.isActive ?? plan.isActive,
      },
      include: { features: true },
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
