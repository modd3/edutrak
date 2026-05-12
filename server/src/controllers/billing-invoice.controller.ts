import { Request, Response } from 'express';
import { ResponseUtil } from '../utils/response';
import { BillingInvoiceService } from '../services/billing-invoice.service';

const billingInvoiceService = new BillingInvoiceService();

export class BillingInvoiceController {
  async createInvoice(req: Request, res: Response): Promise<Response> {
    try {
      const invoice = await billingInvoiceService.createInvoice(req.body);
      return ResponseUtil.created(res, 'Billing invoice created successfully', invoice);
    } catch (error: any) {
      return ResponseUtil.error(res, error.message, 400);
    }
  }

  async listInvoices(req: Request, res: Response): Promise<Response> {
    try {
      const result = await billingInvoiceService.listInvoices({
        schoolId: req.query.schoolId as string | undefined,
        status: req.query.status as string | undefined,
        page: req.query.page ? Number(req.query.page) : undefined,
        limit: req.query.limit ? Number(req.query.limit) : undefined,
      });
      return ResponseUtil.paginated(res, 'Billing invoices retrieved successfully', result.invoices, result.pagination);
    } catch (error: any) {
      return ResponseUtil.serverError(res, error.message);
    }
  }

  async recordPayment(req: Request, res: Response): Promise<Response> {
    try {
      const payment = await billingInvoiceService.recordPayment(req.body);
      return ResponseUtil.created(res, 'Billing payment recorded successfully', payment);
    } catch (error: any) {
      return ResponseUtil.error(res, error.message, 400);
    }
  }
}
