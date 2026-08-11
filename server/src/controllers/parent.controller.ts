// src/controllers/parent.controller.ts
import { Request, Response } from 'express';
import { ParentService } from '../services/parent.service';
import { FeeService } from '../services/fee.service';
import { asyncHandler } from '../utils/async-handler';

export class ParentController {
  private parentService = new ParentService();
  private feeService = new FeeService();

  /**
   * GET /api/parent/children
   * Get all children for the authenticated parent
   */
  getMyChildren = asyncHandler(async (req: Request, res: Response) => {
    const children = await this.parentService.getMyChildren();
    res.json({ data: children });
  });

  /**
   * GET /api/parent/invoices
   * Get fee invoices for all my children
   */
  getMyChildrenInvoices = asyncHandler(async (req: Request, res: Response) => {
    const { 
      page = '1', 
      limit = '20', 
      status, 
      academicYearId, 
      termId, 
      isOverdue 
    } = req.query;

    const query = {
      page: parseInt(page as string),
      limit: parseInt(limit as string),
      status: status as string,
      academicYearId: academicYearId as string,
      termId: termId as string,
      isOverdue: isOverdue === 'true',
    };

    const result = await this.parentService.getMyChildrenInvoices(query);
    res.json(result);
  });

  /**
   * GET /api/parent/invoices/:id
   * Get a specific invoice (if it belongs to my children)
   */
  getMyChildInvoice = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const invoice = await this.parentService.getMyChildInvoice(id);
    
    if (!invoice) {
      return res.status(404).json({ error: 'Invoice not found or access denied' });
    }

    res.json({ data: invoice });
  });

  /**
   * GET /api/parent/payments
   * Get payment history for all my children
   */
  getMyChildrenPayments = asyncHandler(async (req: Request, res: Response) => {
    const { 
      page = '1', 
      limit = '20', 
      method, 
      status, 
      startDate, 
      endDate, 
      invoiceId 
    } = req.query;

    const query = {
      page: parseInt(page as string),
      limit: parseInt(limit as string),
      method: method as string,
      status: status as string,
      startDate: startDate as string,
      endDate: endDate as string,
      invoiceId: invoiceId as string,
    };

    const result = await this.parentService.getMyChildrenPayments(query);
    res.json(result);
  });

  /**
   * GET /api/parent/summary
   * Get payment summary for all my children
   */
  getMyChildrenSummary = asyncHandler(async (req: Request, res: Response) => {
    const summary = await this.parentService.getMyChildrenPaymentSummary();
    res.json({ data: summary });
  });

  /**
   * POST /api/parent/invoices/:id/pay-online
   * Initiate online payment for an invoice (parent-specific)
   */
  initiateOnlinePayment = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const { provider, phoneNumber, callbackUrl } = req.body;

    // First verify that this invoice belongs to one of my children
    const invoice = await this.parentService.getMyChildInvoice(id);
    if (!invoice) {
      return res.status(404).json({ error: 'Invoice not found or access denied' });
    }

    // Use the fee service to initiate the payment
    const paymentData = {
      invoiceId: id,
      provider: provider || 'MPESA',
      phoneNumber,
      callbackUrl: callbackUrl || `${process.env.BASE_URL || ''}/webhooks/payments/callback`,
    };

    const result = await this.feeService.initiateOnlinePayment(paymentData);
    res.json(result);
  });

  /**
   * GET /api/parent/invoices/:id/payment-status
   * Check payment status for an invoice
   */
  getPaymentStatus = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;

    // First verify that this invoice belongs to one of my children
    const invoice = await this.parentService.getMyChildInvoice(id);
    if (!invoice) {
      return res.status(404).json({ error: 'Invoice not found or access denied' });
    }

    // Get the most recent payment for this invoice
    const recentPayment = invoice.payments?.[0];
    
    const response = {
      invoiceId: id,
      status: invoice.status,
      balanceAmount: Number(invoice.balanceAmount),
      paidAmount: Number(invoice.paidAmount),
      lastPayment: recentPayment ? {
        id: recentPayment.id,
        receiptNo: recentPayment.receiptNo,
        amount: Number(recentPayment.amount),
        method: recentPayment.method,
        status: recentPayment.status,
        paidAt: recentPayment.paidAt,
      } : null,
    };

    res.json({ data: response });
  });
}

export const parentController = new ParentController();