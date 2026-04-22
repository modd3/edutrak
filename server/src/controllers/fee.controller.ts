// src/controllers/fee.controller.ts
import { Response } from 'express';
import { z } from 'zod';
import { FeeService } from '../services/fee.service';
import { ResponseUtil } from '../utils/response';
import { RequestWithUser } from '../middleware/school-context';
import {
  createFeeStructureSchema,
  updateFeeStructureSchema,
  addFeeItemSchema,
  updateFeeItemSchema,
  generateInvoiceSchema,
  bulkGenerateInvoicesSchema,
  updateInvoiceSchema,
  recordPaymentSchema,
  reversePaymentSchema,
  getFeeStructuresQuerySchema,
  getInvoicesQuerySchema,
  getPaymentsQuerySchema,
  feeReportQuerySchema,
} from '../validation/fee.validation';
import logger from '../utils/logger';

export class FeeController {
  // ── Fee Structures ─────────────────────────────────────────────────────────

  async createFeeStructure(req: RequestWithUser, res: Response) {
    try {
      const data = createFeeStructureSchema.parse(req.body);
      const service = FeeService.withRequest(req);
      const structure = await service.createFeeStructure(data);
      return ResponseUtil.created(res, 'Fee structure created successfully', structure);
    } catch (error: any) {
      if (error instanceof z.ZodError) return ResponseUtil.validationError(res, JSON.stringify(error.issues));
      logger.error('Error creating fee structure', { error: error.message });
      return ResponseUtil.error(res, error.message, 400);
    }
  }

  async getFeeStructures(req: RequestWithUser, res: Response) {
    try {
      const query = getFeeStructuresQuerySchema.parse(req.query);
      const service = FeeService.withRequest(req);
      const result = await service.getFeeStructures(query);
      return ResponseUtil.paginated(res, 'Fee structures retrieved', result.structures, result.pagination);
    } catch (error: any) {
      if (error instanceof z.ZodError) return ResponseUtil.validationError(res, JSON.stringify(error.issues));
      return ResponseUtil.serverError(res, error.message);
    }
  }

  async getFeeStructureById(req: RequestWithUser, res: Response) {
    try {
      const { id } = req.params;
      const service = FeeService.withRequest(req);
      const structure = await service.getFeeStructureById(id);
      if (!structure) return ResponseUtil.notFound(res, 'Fee structure');
      return ResponseUtil.success(res, 'Fee structure retrieved', structure);
    } catch (error: any) {
      return ResponseUtil.serverError(res, error.message);
    }
  }

  async updateFeeStructure(req: RequestWithUser, res: Response) {
    try {
      const { id } = req.params;
      const data = updateFeeStructureSchema.parse(req.body);
      const service = FeeService.withRequest(req);
      const structure = await service.updateFeeStructure(id, data);
      return ResponseUtil.success(res, 'Fee structure updated', structure);
    } catch (error: any) {
      if (error instanceof z.ZodError) return ResponseUtil.validationError(res, JSON.stringify(error.issues));
      return ResponseUtil.error(res, error.message, 400);
    }
  }

  // ── Fee Items ──────────────────────────────────────────────────────────────

  async addFeeItem(req: RequestWithUser, res: Response) {
    try {
      const { structureId } = req.params;
      const data = addFeeItemSchema.parse(req.body);
      const service = FeeService.withRequest(req);
      const item = await service.addFeeItem(structureId, data);
      return ResponseUtil.created(res, 'Fee item added', item);
    } catch (error: any) {
      if (error instanceof z.ZodError) return ResponseUtil.validationError(res, JSON.stringify(error.issues));
      return ResponseUtil.error(res, error.message, 400);
    }
  }

  async updateFeeItem(req: RequestWithUser, res: Response) {
    try {
      const { itemId } = req.params;
      const data = updateFeeItemSchema.parse(req.body);
      const service = FeeService.withRequest(req);
      const item = await service.updateFeeItem(itemId, data);
      return ResponseUtil.success(res, 'Fee item updated', item);
    } catch (error: any) {
      if (error instanceof z.ZodError) return ResponseUtil.validationError(res, JSON.stringify(error.issues));
      return ResponseUtil.error(res, error.message, 400);
    }
  }

  async deleteFeeItem(req: RequestWithUser, res: Response) {
    try {
      const { itemId } = req.params;
      const service = FeeService.withRequest(req);
      await service.deleteFeeItem(itemId);
      return ResponseUtil.success(res, 'Fee item deleted');
    } catch (error: any) {
      return ResponseUtil.error(res, error.message, 400);
    }
  }

  // ── Invoices ───────────────────────────────────────────────────────────────

  async generateInvoice(req: RequestWithUser, res: Response) {
    try {
      const data = generateInvoiceSchema.parse(req.body);
      const service = FeeService.withRequest(req);
      const invoice = await service.generateInvoice(data);
      return ResponseUtil.created(res, 'Invoice generated successfully', invoice);
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        const message = error.issues
        .map((issue) => `${issue.path.join(".")}: ${issue.message}`)
        .join("//")
        .replace('\"', '');
        logger.error('Error generating invoice', { error: message });
        return ResponseUtil.validationError(res, JSON.stringify(message, null, 2));
      }
    //  if (error instanceof z.ZodError) return ResponseUtil.validationError(res, JSON.stringify(error.issues, null, 2));
      // Duplicate invoice is a conflict, not a server error
      if (error.message.includes('already exists')) return ResponseUtil.conflict(res, error.message);
      return ResponseUtil.error(res, error.message, 400);
    }
  }

  async bulkGenerateInvoices(req: RequestWithUser, res: Response) {
    try {
      const data = bulkGenerateInvoicesSchema.parse(req.body);
      const service = FeeService.withRequest(req);
      const result = await service.bulkGenerateInvoices(data);
      return ResponseUtil.created(res, `Generated ${result.generated} invoices, skipped ${result.skipped}`, result);
    } catch (error: any) {
      if (error instanceof z.ZodError) return ResponseUtil.validationError(res, JSON.stringify(error.issues));
      logger.error('Error bulk generating invoices', { error: error.message });
      return ResponseUtil.error(res, error.message, 400);
    }
  }

  async getInvoices(req: RequestWithUser, res: Response) {
    try {
      const query = getInvoicesQuerySchema.parse(req.query);
     // if (query.status.toString() == 'All') query.status = undefined;
      console.log("Query: ", query);
      const service = FeeService.withRequest(req);
      const result = await service.getInvoices(query);
      return ResponseUtil.paginated(res, 'Invoices retrieved', result.invoices, result.pagination);
    } catch (error: any) {
      if (error instanceof z.ZodError) return ResponseUtil.validationError(res, JSON.stringify(error.issues));
      return ResponseUtil.serverError(res, error.message);
    }
  }

  async getInvoiceById(req: RequestWithUser, res: Response) {
    try {
      const { id } = req.params;
      const service = FeeService.withRequest(req);
      const invoice = await service.getInvoiceById(id);
      if (!invoice) return ResponseUtil.notFound(res, 'Invoice');
      return ResponseUtil.success(res, 'Invoice retrieved', invoice);
    } catch (error: any) {
      return ResponseUtil.serverError(res, error.message);
    }
  }

  async updateInvoice(req: RequestWithUser, res: Response) {
    try {
      const { id } = req.params;
      const data = updateInvoiceSchema.parse(req.body);
      const service = FeeService.withRequest(req);
      const invoice = await service.updateInvoice(id, data);
      return ResponseUtil.success(res, 'Invoice updated', invoice);
    } catch (error: any) {
      if (error instanceof z.ZodError) return ResponseUtil.validationError(res, JSON.stringify(error.issues));
      return ResponseUtil.error(res, error.message, 400);
    }
  }

  async cancelInvoice(req: RequestWithUser, res: Response) {
    try {
      const { id } = req.params;
      const service = FeeService.withRequest(req);
      const invoice = await service.cancelInvoice(id);
      return ResponseUtil.success(res, 'Invoice cancelled', invoice);
    } catch (error: any) {
      return ResponseUtil.error(res, error.message, 400);
    }
  }

  // ── Payments ───────────────────────────────────────────────────────────────

  async recordPayment(req: RequestWithUser, res: Response) {
    try {
      const data = recordPaymentSchema.parse(req.body);
      const service = FeeService.withRequest(req);
      const payment = await service.recordPayment(data);
      return ResponseUtil.created(res, 'Payment recorded successfully', payment);
    } catch (error: any) {
      if (error instanceof z.ZodError) return ResponseUtil.validationError(res, JSON.stringify(error.issues));
      logger.error('Error recording payment', { error: error.message });
      return ResponseUtil.error(res, error.message, 400);
    }
  }

  async getPayments(req: RequestWithUser, res: Response) {
    try {
      const query = getPaymentsQuerySchema.parse(req.query);
      const service = FeeService.withRequest(req);
      const result = await service.getPayments(query);
      return ResponseUtil.paginated(res, 'Payments retrieved', result.payments, result.pagination);
    } catch (error: any) {
      if (error instanceof z.ZodError) return ResponseUtil.validationError(res, JSON.stringify(error.issues));
      return ResponseUtil.serverError(res, error.message);
    }
  }

  async getPaymentById(req: RequestWithUser, res: Response) {
    try {
      const { id } = req.params;
      const service = FeeService.withRequest(req);
      const payment = await service.getPaymentById(id);
      if (!payment) return ResponseUtil.notFound(res, 'Payment');
      return ResponseUtil.success(res, 'Payment retrieved', payment);
    } catch (error: any) {
      return ResponseUtil.serverError(res, error.message);
    }
  }

  async reversePayment(req: RequestWithUser, res: Response) {
    try {
      const { id } = req.params;
      const data = reversePaymentSchema.parse(req.body);
      const service = FeeService.withRequest(req);
      const payment = await service.reversePayment(id, data);
      return ResponseUtil.success(res, 'Payment reversed', payment);
    } catch (error: any) {
      if (error instanceof z.ZodError) return ResponseUtil.validationError(res, JSON.stringify(error.issues));
      return ResponseUtil.error(res, error.message, 400);
    }
  }

  // ── Reports ────────────────────────────────────────────────────────────────

  async getFeeCollectionReport(req: RequestWithUser, res: Response) {
    try {
      const query = feeReportQuerySchema.parse(req.query);
      const service = FeeService.withRequest(req);
      const report = await service.getFeeCollectionReport(query);
      return ResponseUtil.success(res, 'Fee collection report generated', report);
    } catch (error: any) {
      if (error instanceof z.ZodError) return ResponseUtil.validationError(res, JSON.stringify(error.issues));
      return ResponseUtil.serverError(res, error.message);
    }
  }

  async getDefaultersReport(req: RequestWithUser, res: Response) {
    try {
      const query = feeReportQuerySchema.parse(req.query);
      const service = FeeService.withRequest(req);
      const report = await service.getDefaultersReport(query);
      return ResponseUtil.success(res, 'Fee defaulters report generated', report, report.length);
    } catch (error: any) {
      if (error instanceof z.ZodError) return ResponseUtil.validationError(res, JSON.stringify(error.issues));
      return ResponseUtil.serverError(res, error.message);
    }
  }
}

export const feeController = new FeeController();