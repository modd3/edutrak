import { Request, Response } from 'express';
import { ResponseUtil } from '../utils/response';
import { BillingAccountService } from '../services/billing-account.service';

const billingAccountService = new BillingAccountService();

export class BillingAccountController {
  async upsert(req: Request, res: Response): Promise<Response> {
    try {
      const account = await billingAccountService.upsertBillingAccount(req.body);
      return ResponseUtil.success(res, 'Billing account saved successfully', account);
    } catch (error: any) {
      return ResponseUtil.error(res, error.message, 400);
    }
  }

  async getBySchool(req: Request, res: Response): Promise<Response> {
    try {
      const account = await billingAccountService.getBillingAccountBySchool(req.params.schoolId);
      if (!account) return ResponseUtil.notFound(res, 'Billing account');
      return ResponseUtil.success(res, 'Billing account retrieved successfully', account);
    } catch (error: any) {
      return ResponseUtil.serverError(res, error.message);
    }
  }

  async list(req: Request, res: Response): Promise<Response> {
    try {
      const { schoolId, page, limit } = req.query;
      const result = await billingAccountService.listBillingAccounts({
        schoolId: schoolId as string | undefined,
        page: page ? Number(page) : undefined,
        limit: limit ? Number(limit) : undefined,
      });
      return ResponseUtil.paginated(res, 'Billing accounts retrieved successfully', result.accounts, result.pagination);
    } catch (error: any) {
      return ResponseUtil.serverError(res, error.message);
    }
  }
}