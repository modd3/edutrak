import { Request, Response } from 'express';
import { ResponseUtil } from '../utils/response';
import { PlanService } from '../services/plan.service';

const planService = new PlanService();

export class PlanController {
  async getPlans(req: Request, res: Response): Promise<Response> {
    try {
      const page = req.query.page ? Number(req.query.page) : undefined;
      const limit = req.query.limit ? Number(req.query.limit) : undefined;
      const isActive = req.query.isActive === 'true' ? true : req.query.isActive === 'false' ? false : undefined;

      const result = await planService.getPlans({ page, limit, isActive });
      return ResponseUtil.paginated(res, 'Plans retrieved successfully', result.plans, result.pagination);
    } catch (error: any) {
      return ResponseUtil.serverError(res, error.message);
    }
  }

  async getPlanById(req: Request, res: Response): Promise<Response> {
    try {
      const plan = await planService.getPlanById(req.params.id);
      if (!plan) return ResponseUtil.notFound(res, 'Plan');
      return ResponseUtil.success(res, 'Plan retrieved successfully', plan);
    } catch (error: any) {
      return ResponseUtil.serverError(res, error.message);
    }
  }

  async create(req: Request, res: Response): Promise<Response> {
    try {
      const plan = await planService.createPlan(req.body);
      return ResponseUtil.created(res, 'Plan created successfully', plan);
    } catch (error: any) {
      return ResponseUtil.error(res, error.message, 400);
    }
  }

  async update(req: Request, res: Response): Promise<Response> {
    try {
      const plan = await planService.updatePlan(req.params.id, req.body);
      return ResponseUtil.success(res, 'Plan updated successfully', plan);
    } catch (error: any) {
      return ResponseUtil.error(res, error.message, 400);
    }
  }

  async delete(req: Request, res: Response): Promise<Response> {
    try {
      await planService.deletePlan(req.params.id);
      return ResponseUtil.success(res, 'Plan deleted successfully', null);
    } catch (error: any) {
      return ResponseUtil.error(res, error.message, 400);
    }
  }
}
