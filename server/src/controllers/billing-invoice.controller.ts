import { Request, Response } from 'express';
import { ResponseUtil } from '../utils/response';
import { BillingInvoiceService } from '../services/billing-invoice.service';
import { PaymentProviderFactory } from '../services/payment-provider/PaymentProviderFactory';
import prisma from '../database/client';
import { randomUUID } from 'crypto';
import logger from '../utils/logger';

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

  /**
   * Get invoices for the authenticated admin's school.
   * GET /billing/invoices/my
   */
  async getMyInvoices(req: Request, res: Response): Promise<Response> {
    try {
      const schoolId = (req as any).user?.schoolId;
      if (!schoolId) {
        return ResponseUtil.error(res, 'School context required', 400);
      }

      const result = await billingInvoiceService.getMyInvoices(schoolId, {
        status: req.query.status as string | undefined,
        page: req.query.page ? Number(req.query.page) : undefined,
        limit: req.query.limit ? Number(req.query.limit) : undefined,
      });
      return ResponseUtil.paginated(res, 'Billing invoices retrieved successfully', result.invoices, result.pagination);
    } catch (error: any) {
      return ResponseUtil.serverError(res, error.message);
    }
  }

  /**
   * Pay an invoice via M-Pesa STK Push.
   * POST /billing/payments/pay-invoice
   */
  async payInvoice(req: Request, res: Response): Promise<Response> {
    try {
      const schoolId = (req as any).user?.schoolId;
      if (!schoolId) {
        return ResponseUtil.error(res, 'School context required', 400);
      }

      const { invoiceId, phoneNumber } = req.body;
      if (!invoiceId || !phoneNumber) {
        return ResponseUtil.error(res, 'invoiceId and phoneNumber are required', 400);
      }

      // Verify the invoice belongs to this school and is OPEN
      const invoice = await (prisma as any).billingInvoice.findUnique({
        where: { id: invoiceId },
        include: { subscription: true },
      });

      if (!invoice) {
        return ResponseUtil.notFound(res, 'Invoice');
      }

      if (invoice.schoolId !== schoolId) {
        return ResponseUtil.error(res, 'Invoice does not belong to your school', 403);
      }

      if (invoice.status !== 'OPEN') {
        return ResponseUtil.error(res, `Invoice is already ${invoice.status}`, 400);
      }

      const remaining = invoice.totalMinor - invoice.amountPaidMinor;
      if (remaining <= 0) {
        return ResponseUtil.error(res, 'Invoice is already fully paid', 400);
      }

      // Initiate M-Pesa STK Push
      const provider = await PaymentProviderFactory.getProvider(schoolId, 'MPESA');
      const transactionRef = `BILL-${invoice.invoiceNumber}-${Date.now()}`;

      const session = await provider.initiatePayment({
        amount: remaining,
        currency: invoice.currency || 'KES',
        transactionRef,
        description: `Payment for invoice ${invoice.invoiceNumber}`,
        phoneNumber,
        callbackUrl: `${process.env.BASE_URL || ''}/webhooks/payments/mpesa/callback`,
        metadata: {
          billingInvoiceId: invoiceId,
          schoolId,
          subscriptionId: invoice.subscriptionId,
        },
      });

      // Record the pending billing payment
      await (prisma as any).billingPayment.create({
        data: {
          id: randomUUID(),
          schoolId,
          subscriptionId: invoice.subscriptionId,
          billingInvoiceId: invoiceId,
          provider: 'MPESA',
          providerReference: session.providerTransactionId,
          amountMinor: remaining,
          currency: invoice.currency || 'KES',
          status: 'PENDING',
          metadata: {
            transactionRef,
            merchantRequestId: session.merchantRequestId,
            checkoutRequestId: session.providerTransactionId,
          },
        },
      });

      logger.info('Billing payment initiated via M-Pesa', {
        invoiceId,
        amount: remaining,
        checkoutRequestId: session.providerTransactionId,
      });

      return ResponseUtil.success(res, 'M-Pesa STK Push sent. Check your phone to enter PIN.', {
        checkoutRequestId: session.providerTransactionId,
        transactionRef,
        amount: remaining,
      });
    } catch (error: any) {
      logger.error('Failed to initiate billing payment', { error: error.message });
      return ResponseUtil.error(res, error.message, 400);
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
