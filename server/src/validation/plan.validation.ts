// src/validation/plan.validation.ts
import { z } from 'zod';
import { upsertPlanFeatureSchema } from './plan-feature.validation';

export const createPlanSchema = z.object({
  key: z.string().min(1).max(50).regex(/^[a-z0-9_-]+$/, 'lowercase, numbers, - or _ only'),
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  priceMinor: z.number().int().min(0),
  currency: z.string().length(3).default('KES'),
  billingInterval: z.enum(['MONTHLY', 'QUARTERLY', 'YEARLY']),
  isActive: z.boolean().default(true),
  features: z.array(upsertPlanFeatureSchema).optional(), // ← create plan + features together
});

export const updatePlanSchema = createPlanSchema.partial().omit({ key: true });

export type CreatePlanInput = z.infer<typeof createPlanSchema>;
export type UpdatePlanInput = z.infer<typeof updatePlanSchema>;