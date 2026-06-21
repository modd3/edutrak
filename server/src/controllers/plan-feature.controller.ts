// src/controllers/plan-feature.controller.ts
import { Request, Response } from 'express';
import { z } from 'zod';
import { ResponseUtil } from '../utils/response';
import { planFeatureService } from '../services/plan-feature.service';
import { upsertPlanFeatureSchema, bulkSetPlanFeaturesSchema } from '../validation/plan-feature.validation';
import { FEATURE_REGISTRY } from '../config/feature-registry';

export class PlanFeatureController {
  async list(req: Request, res: Response) {
    try {
      const features = await planFeatureService.listFeatures(req.params.planId);
      return ResponseUtil.success(res, 'Plan features retrieved', features, features.length);
    } catch (e: any) {
      return ResponseUtil.error(res, e.message, e.message.includes('not found') ? 404 : 400);
    }
  }

  async upsert(req: Request, res: Response) {
    try {
      const data = upsertPlanFeatureSchema.parse(req.body);
      const feature = await planFeatureService.upsertFeature(req.params.planId, data);
      return ResponseUtil.success(res, 'Plan feature saved', feature);
    } catch (e: any) {
      if (e instanceof z.ZodError) return ResponseUtil.validationError(res, JSON.stringify(e.issues));
      return ResponseUtil.error(res, e.message, 400);
    }
  }

  async bulkSet(req: Request, res: Response) {
    try {
      const { features } = bulkSetPlanFeaturesSchema.parse(req.body);
      const result = await planFeatureService.bulkSetFeatures(req.params.planId, features);
      return ResponseUtil.success(res, `Saved ${result.length} features`, result);
    } catch (e: any) {
      if (e instanceof z.ZodError) return ResponseUtil.validationError(res, JSON.stringify(e.issues));
      return ResponseUtil.error(res, e.message, 400);
    }
  }

  async remove(req: Request, res: Response) {
    try {
      await planFeatureService.removeFeature(req.params.planId, req.params.featureKey);
      return ResponseUtil.success(res, 'Plan feature removed');
    } catch (e: any) {
      return ResponseUtil.error(res, e.message, e.message.includes('not found') ? 404 : 400);
    }
  }

  async getRegistry(_req: Request, res: Response) {
    return ResponseUtil.success(res, 'Feature registry retrieved', FEATURE_REGISTRY);
  }

  async compare(req: Request, res: Response) {
    try {
      const { planA, planB } = req.query;
      const result = await planFeatureService.comparePlans(planA as string, planB as string);
      return ResponseUtil.success(res, 'Plan comparison retrieved', result);
    } catch (e: any) {
      return ResponseUtil.error(res, e.message, 400);
    }
  }
}