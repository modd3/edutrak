// src/validation/plan-feature.validation.ts

import { features } from 'process';
import {z} from 'zod';

export const upsertPlanFeatureSchema = z.object({
    featureKey: z.string().min(1).max(100),
    enabled: z.boolean().default(true),
    limitType: z.enum(['BOOLEAN', 'COUNT']).default('BOOLEAN'),
    limitValue: z.number().int().positive().optional(),
}).refine(
    d => d.limitType === 'BOOLEAN' || d.limitValue !== undefined,
    {message: 'Limit Value is required when limit type is COUNT!'}
);
 
export const bulkSetPlanFeaturesSchema = z. object({
    features: z.array(upsertPlanFeatureSchema).min(1),
});

export type UpsertPlanFeatureInput = z.infer<typeof upsertPlanFeatureSchema>;
export type BulkSetPlanFeaturesInput = z.infer<typeof bulkSetPlanFeaturesSchema>;