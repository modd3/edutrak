// src/controllers/fee.controller.ts
import { Response } from 'express';
import { z } from 'zod';
import { FeeService } from '../services/fee.service';
import { feeAnalyticsService } from '../services/fee/analytics.service';
import { auditService } from '../services/audit.service';
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
  initiateOnlinePaymentSchema,
  configurePaymentProviderSchema,
  updatePaymentProviderSchema,
  upsertLateFeesConfigSchema,
  createPaymentPlanSchema,
  sendReminderSchema,
} from '../validation/fee.validation';
import logger from '../utils/logger';
import { LateFeesService } from '../services/fee/late-fees.service';
import { PaymentPlanService } from '../services/fee/payment-plan.service';
import { ReminderService } from '../services/fee/reminder.service';
import { ReconciliationService } from '../services/fee/reconciliation.service';

const auditLog = (req: RequestWithUser, action: string, entityType: string, entityId: string, details: string, metadata?: Record<string, unknown>) => {
  auditService.log({
    schoolId: req.schoolId,
    actorId: req.user!.userId,
    actorRole: req.user!.role,
    action,
    entityType,
    entityId,
    details,
    metadata,
    ipAddress: req.ip,
    userAgent: req.headers['user-agent'],
  }).catch((err) => logger.warn('Audit log failed', { error: err.message }));
};

export class FeeController {
  // ── Fee Structures ─────────────────────────────────────────────────────────

  async createFeeStructure(req: RequestWithUser, res: Response) {
    try {
      const data = createFeeStructureSchema.parse(req.body);
      const service = FeeService.withRequest(req);
      const structure = await service.createFeeStructure(data);

      auditLog(req, 'CREATE_FEE_STRUCTURE', 'FeeStructure', structure.id, `Created fee structure: ${structure.name}`, { academicYearId: data.academicYearId });

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

      auditLog(req, 'UPDATE_FEE_STRUCTURE', 'FeeStructure', id, `Updated fee structure ${id}`);

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

      auditLog(req, 'ADD_FEE_ITEM', 'FeeItem', item.id, `Added fee item to structure ${structureId}`, { structureId, itemName: data.name });

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

      auditLog(req, 'UPDATE_FEE_ITEM', 'FeeItem', itemId, `Updated fee item ${itemId}`);

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

      auditLog(req, 'DELETE_FEE_ITEM', 'FeeItem', itemId, `Deleted fee item ${itemId}`);

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

      auditLog(req, 'GENERATE_INVOICE', 'Invoice', invoice.id, `Generated invoice for student ${data.studentId}`, { studentId: data.studentId, amount: invoice.totalAmount });

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

      auditLog(req, 'BULK_GENERATE_INVOICES', 'Invoice', '', `Bulk generated ${result.generated} invoices, skipped ${result.skipped}`, { generated: result.generated, skipped: result.skipped });

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
      const { schoolId, isSuperAdmin } = req as any;
      
      const service = FeeService.withRequest(req);
      const invoice = await service.getInvoiceById(id);
      
      if (!invoice) {
        logger.warn('Invoice not found', { 
          invoiceId: id, 
          schoolId,
          isSuperAdmin,
          path: req.path 
        });
        return ResponseUtil.notFound(res, 'Invoice');
      }
      
      return ResponseUtil.success(res, 'Invoice retrieved', invoice);
    } catch (error: any) {
      logger.error('Error fetching invoice', { 
        error: error.message, 
        invoiceId: req.params.id,
        stack: error.stack 
      });
      return ResponseUtil.serverError(res, error.message);
    }
  }

  async updateInvoice(req: RequestWithUser, res: Response) {
    try {
      const { id } = req.params;
      const data = updateInvoiceSchema.parse(req.body);
      const service = FeeService.withRequest(req);
      const invoice = await service.updateInvoice(id, data);

      auditLog(req, 'UPDATE_INVOICE', 'Invoice', id, `Updated invoice ${id}`);

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

      auditLog(req, 'CANCEL_INVOICE', 'Invoice', id, `Cancelled invoice ${id}`);

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

      auditLog(req, 'RECORD_PAYMENT', 'Payment', payment.id, `Recorded payment of ${payment.amount} for invoice ${data.invoiceId}`, { invoiceId: data.invoiceId, amount: payment.amount, method: data.method });

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

      auditLog(req, 'REVERSE_PAYMENT', 'Payment', id, `Reversed payment ${id}`, { reason: data.reason });

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

  async cloneFeeStructure(req: RequestWithUser, res: Response) {
    try {
      const { sourceFeeStructureId, toAcademicYearId, toTermId, newName } = req.body;
      if (!sourceFeeStructureId || !toAcademicYearId) {
        return ResponseUtil.validationError(res, 'sourceFeeStructureId and toAcademicYearId are required');
      }
      const service = FeeService.withRequest(req);
      const cloned = await service.cloneFeeStructure({ sourceFeeStructureId, toAcademicYearId, toTermId, newName });
      return ResponseUtil.created(res, 'Fee structure cloned successfully', cloned);
    } catch (error: any) {
      return ResponseUtil.serverError(res, error.message);
    }
  }

  // ══════════════════════════════════════════════════════════════════════════
  // ONLINE PAYMENTS
  // ══════════════════════════════════════════════════════════════════════════

  /**
   * Initiate an online payment (M-Pesa STK Push) for an invoice.
   * POST /api/fees/invoices/:id/pay-online
   */
  async initiateOnlinePayment(req: RequestWithUser, res: Response) {
    try {
      const data = initiateOnlinePaymentSchema.parse(req.body);
      const service = FeeService.withRequest(req);
      const result = await service.initiateOnlinePayment(data);
      return ResponseUtil.success(res, 'Payment initiated', result);
    } catch (error: any) {
      if (error instanceof z.ZodError) return ResponseUtil.validationError(res, JSON.stringify(error.issues));
      logger.error('Error initiating online payment', { error: error.message });
      return ResponseUtil.error(res, error.message, 400);
    }
  }

  // ══════════════════════════════════════════════════════════════════════════
  // PAYMENT PROVIDER CONFIGURATION
  // ══════════════════════════════════════════════════════════════════════════

  /**
   * Configure a payment provider for the school.
   * POST /api/fees/providers/configure
   */
  async configurePaymentProvider(req: RequestWithUser, res: Response) {
    try {
      const data = configurePaymentProviderSchema.parse(req.body);
      const service = FeeService.withRequest(req);
      const config = await service.configurePaymentProvider(data);
      return ResponseUtil.created(res, 'Payment provider configured', config);
    } catch (error: any) {
      if (error instanceof z.ZodError) return ResponseUtil.validationError(res, JSON.stringify(error.issues));
      logger.error('Error configuring payment provider', { error: error.message });
      return ResponseUtil.error(res, error.message, 400);
    }
  }

  /**
   * Update a payment provider configuration.
   * PATCH /api/fees/providers/:providerId
   */
  async updatePaymentProvider(req: RequestWithUser, res: Response) {
    try {
      const { providerId } = req.params;
      const data = updatePaymentProviderSchema.parse(req.body);
      const service = FeeService.withRequest(req);
      const config = await service.updatePaymentProvider(providerId, data);
      return ResponseUtil.success(res, 'Payment provider updated', config);
    } catch (error: any) {
      if (error instanceof z.ZodError) return ResponseUtil.validationError(res, JSON.stringify(error.issues));
      logger.error('Error updating payment provider', { error: error.message });
      return ResponseUtil.error(res, error.message, 400);
    }
  }

  /**
   * Get all configured payment providers for the school.
   * GET /api/fees/providers
   */
  async getPaymentProviders(req: RequestWithUser, res: Response) {
    try {
      const service = FeeService.withRequest(req);
      const providers = await service.getPaymentProviders();
      return ResponseUtil.success(res, 'Payment providers retrieved', providers);
    } catch (error: any) {
      logger.error('Error getting payment providers', { error: error.message });
      return ResponseUtil.serverError(res, error.message);
    }
  }

  /**
   * Remove a payment provider configuration.
   * DELETE /api/fees/providers/:providerId
   */
  async deletePaymentProvider(req: RequestWithUser, res: Response) {
    try {
      const { providerId } = req.params;
      const service = FeeService.withRequest(req);
      await service.deletePaymentProvider(providerId);
      return ResponseUtil.success(res, 'Payment provider removed');
    } catch (error: any) {
      logger.error('Error removing payment provider', { error: error.message });
      return ResponseUtil.error(res, error.message, 400);
    }
  }

  // ══════════════════════════════════════════════════════════════════════════
  // LATE FEES
  // ══════════════════════════════════════════════════════════════════════════

  async getLateFeesConfig(req: RequestWithUser, res: Response) {
    try {
      const service = LateFeesService.withRequest(req);
      const { schoolId } = req;
      if (!schoolId) return ResponseUtil.error(res, 'School context required', 400);
      const config = await service.getConfig(schoolId);
      return ResponseUtil.success(res, 'Late fee config retrieved', config);
    } catch (error: any) {
      return ResponseUtil.serverError(res, error.message);
    }
  }

  async upsertLateFeesConfig(req: RequestWithUser, res: Response) {
    try {
      const data = upsertLateFeesConfigSchema.parse(req.body);
      const service = LateFeesService.withRequest(req);
      const { schoolId } = req;
      if (!schoolId) return ResponseUtil.error(res, 'School context required', 400);
      const config = await service.upsertConfig(schoolId, data);
      return ResponseUtil.success(res, 'Late fee config updated', config);
    } catch (error: any) {
      if (error instanceof z.ZodError) return ResponseUtil.validationError(res, JSON.stringify(error.issues));
      return ResponseUtil.error(res, error.message, 400);
    }
  }

  async applyLateFees(req: RequestWithUser, res: Response) {
    try {
      const service = LateFeesService.withRequest(req);
      const { schoolId } = req;
      if (!schoolId) return ResponseUtil.error(res, 'School context required', 400);
      const results = await service.applyLateFees(schoolId);
      return ResponseUtil.success(res, `Late fees applied to ${results.length} invoices`, results);
    } catch (error: any) {
      return ResponseUtil.serverError(res, error.message);
    }
  }

  // ══════════════════════════════════════════════════════════════════════════
  // PAYMENT PLANS
  // ══════════════════════════════════════════════════════════════════════════

  async createPaymentPlan(req: RequestWithUser, res: Response) {
    try {
      const data = createPaymentPlanSchema.parse(req.body);
      const service = PaymentPlanService.withRequest(req);
      const plan = await service.createPlan(data);
      return ResponseUtil.created(res, 'Payment plan created', plan);
    } catch (error: any) {
      if (error instanceof z.ZodError) return ResponseUtil.validationError(res, JSON.stringify(error.issues));
      return ResponseUtil.error(res, error.message, 400);
    }
  }

  async getPaymentPlan(req: RequestWithUser, res: Response) {
    try {
      const { invoiceId } = req.params;
      const service = PaymentPlanService.withRequest(req);
      const plan = await service.getPlan(invoiceId);
      if (!plan) return ResponseUtil.notFound(res, 'Payment plan');
      return ResponseUtil.success(res, 'Payment plan retrieved', plan);
    } catch (error: any) {
      return ResponseUtil.serverError(res, error.message);
    }
  }

  async getSchoolPaymentPlans(req: RequestWithUser, res: Response) {
    try {
      const service = PaymentPlanService.withRequest(req);
      const { schoolId } = req;
      if (!schoolId) return ResponseUtil.error(res, 'School context required', 400);
      const plans = await service.getSchoolPlans(schoolId);
      return ResponseUtil.success(res, 'Payment plans retrieved', plans);
    } catch (error: any) {
      return ResponseUtil.serverError(res, error.message);
    }
  }

  async cancelPaymentPlan(req: RequestWithUser, res: Response) {
    try {
      const { invoiceId } = req.params;
      const service = PaymentPlanService.withRequest(req);
      await service.cancelPlan(invoiceId);
      return ResponseUtil.success(res, 'Payment plan cancelled');
    } catch (error: any) {
      return ResponseUtil.error(res, error.message, 400);
    }
  }

  // ══════════════════════════════════════════════════════════════════════════
  // REMINDERS
  // ══════════════════════════════════════════════════════════════════════════

  async sendReminder(req: RequestWithUser, res: Response) {
    try {
      const data = sendReminderSchema.parse(req.body);
      const service = ReminderService.withRequest(req);
      const result = await service.sendReminder(data.invoiceId, data.reminderType, data.method);
      return ResponseUtil.success(res, 'Reminder processed', result);
    } catch (error: any) {
      if (error instanceof z.ZodError) return ResponseUtil.validationError(res, JSON.stringify(error.issues));
      return ResponseUtil.error(res, error.message, 400);
    }
  }

  async processReminders(req: RequestWithUser, res: Response) {
    try {
      const service = ReminderService.withRequest(req);
      const { schoolId } = req;
      if (!schoolId) return ResponseUtil.error(res, 'School context required', 400);
      const results = await service.processPendingReminders(schoolId);
      return ResponseUtil.success(res, `Processed ${results.length} reminders`, results);
    } catch (error: any) {
      return ResponseUtil.serverError(res, error.message);
    }
  }

  async getReminderHistory(req: RequestWithUser, res: Response) {
    try {
      const { invoiceId } = req.params;
      const service = ReminderService.withRequest(req);
      const history = await service.getReminderHistory(invoiceId);
      return ResponseUtil.success(res, 'Reminder history retrieved', history);
    } catch (error: any) {
      return ResponseUtil.serverError(res, error.message);
    }
  }

  async getReminderStats(req: RequestWithUser, res: Response) {
    try {
      const service = ReminderService.withRequest(req);
      const { schoolId } = req;
      if (!schoolId) return ResponseUtil.error(res, 'School context required', 400);
      const stats = await service.getSchoolReminderStats(schoolId);
      return ResponseUtil.success(res, 'Reminder stats retrieved', stats);
    } catch (error: any) {
      return ResponseUtil.serverError(res, error.message);
    }
  }

  // ══════════════════════════════════════════════════════════════════════════
  // ANALYTICS
  // ══════════════════════════════════════════════════════════════════════════

  async getAnalytics(req: RequestWithUser, res: Response) {
    try {
      const { schoolId } = req;
      if (!schoolId) return ResponseUtil.error(res, 'School context required', 400);

      const { from, to, academicYearId, termId } = req.query as any;

      const data = await feeAnalyticsService.getAnalytics({
        schoolId,
        from: from ? new Date(from) : undefined,
        to: to ? new Date(to) : undefined,
        academicYearId,
        termId,
      });

      return ResponseUtil.success(res, 'Fee analytics retrieved', data);
    } catch (error: any) {
      logger.error('Error fetching fee analytics', { error: error.message });
      return ResponseUtil.serverError(res, error.message);
    }
  }

  async getCashFlowReport(req: RequestWithUser, res: Response) {
    try {
      const { schoolId } = req;
      if (!schoolId) return ResponseUtil.error(res, 'School context required', 400);

      const { from, to } = req.query as any;

      const data = await feeAnalyticsService.getCashFlowReport({
        schoolId,
        from: from ? new Date(from) : undefined,
        to: to ? new Date(to) : undefined,
      });

      return ResponseUtil.success(res, 'Cash flow report retrieved', data);
    } catch (error: any) {
      logger.error('Error fetching cash flow report', { error: error.message });
      return ResponseUtil.serverError(res, error.message);
    }
  }

  async detectAnomalies(req: RequestWithUser, res: Response) {
    try {
      const { schoolId } = req;
      if (!schoolId) return ResponseUtil.error(res, 'School context required', 400);

      const days = req.query.days ? Number(req.query.days) : 30;

      const data = await feeAnalyticsService.detectAnomalies(schoolId, days);
      return ResponseUtil.success(res, 'Anomalies detected', data);
    } catch (error: any) {
      logger.error('Error detecting anomalies', { error: error.message });
      return ResponseUtil.serverError(res, error.message);
    }
  }

  // ══════════════════════════════════════════════════════════════════════════
  // RECONCILIATION
  // ══════════════════════════════════════════════════════════════════════════

  /**
   * Upload a bank statement CSV for reconciliation.
   * POST /api/fees/reconciliation/upload
   */
  async uploadStatement(req: RequestWithUser, res: Response) {
    try {
      const service = ReconciliationService.withRequest(req);
      const { schoolId } = req;
      if (!schoolId) return ResponseUtil.error(res, 'School context required', 400);

      // Get CSV content from body or file upload
      const csvContent = req.body.csvContent || (req.file ? req.file.buffer.toString('utf-8') : null);
      const bankName = req.body.bankName;

      if (!csvContent) {
        return ResponseUtil.validationError(res, 'CSV content is required (send as csvContent or file upload)');
      }

      const result = await service.uploadStatement(csvContent, schoolId, bankName);
      return ResponseUtil.success(res, 'Bank statement processed', result);
    } catch (error: any) {
      logger.error('Error processing bank statement', { error: error.message });
      return ResponseUtil.serverError(res, error.message);
    }
  }

  /**
   * Confirm reconciliation matches and create payments.
   * POST /api/fees/reconciliation/confirm
   */
  async confirmReconciliation(req: RequestWithUser, res: Response) {
    try {
      // Accepts: { matches: Array<{ invoiceId: string; amount: number }> }
      const { matches } = req.body;
      if (!matches || !Array.isArray(matches) || matches.length === 0) {
        return ResponseUtil.validationError(res, 'matches array is required');
      }
      for (const m of matches) {
        if (!m.invoiceId || typeof m.amount !== 'number' || m.amount <= 0) {
          return ResponseUtil.validationError(res, 'Each match must have invoiceId and a positive amount');
        }
      }
      const service = ReconciliationService.withRequest(req);
      const { schoolId } = req;
      if (!schoolId) return ResponseUtil.error(res, 'School context required', 400);
      const result = await service.confirmMatches(matches, schoolId);
      return ResponseUtil.success(res, `Confirmed ${result.confirmed} payments`, result);
    } catch (error: any) {
      logger.error('Error confirming reconciliation', { error: error.message });
      return ResponseUtil.serverError(res, error.message);
    }
  }

  /**
   * Generate a reconciliation report for a date range.
   * GET /api/fees/reconciliation/report?from=2025-01-01&to=2025-12-31
   */
  async getReconciliationReport(req: RequestWithUser, res: Response) {
    try {
      const service = ReconciliationService.withRequest(req);
      const { schoolId } = req;
      if (!schoolId) return ResponseUtil.error(res, 'School context required', 400);

      const fromDate = req.query.from ? new Date(req.query.from as string) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      const toDate = req.query.to ? new Date(req.query.to as string) : new Date();

      const report = await service.generateReport(schoolId, fromDate, toDate);
      return ResponseUtil.success(res, 'Reconciliation report generated', report);
    } catch (error: any) {
      logger.error('Error generating reconciliation report', { error: error.message });
      return ResponseUtil.serverError(res, error.message);
    }
  }
}

export const feeController = new FeeController();
