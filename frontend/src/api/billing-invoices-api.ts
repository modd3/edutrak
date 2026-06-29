import api from './client';
import { BillingInvoice, BillingPayment, PaginatedResponse } from '@/types';

export interface BillingInvoicesFilter {
  status?: string;
  page?: number;
  limit?: number;
}

export const billingInvoicesApi = {
  /**
   * Get billing invoices for the authenticated admin's school
   */
  getMyInvoices: async (filters?: BillingInvoicesFilter): Promise<PaginatedResponse<BillingInvoice>> => {
    const params = new URLSearchParams();
    if (filters?.status) params.set('status', filters.status);
    if (filters?.page) params.set('page', String(filters.page));
    if (filters?.limit) params.set('limit', String(filters.limit));

    const response = await api.get(`/billing/invoices/my?${params.toString()}`);
    return response.data;
  },

  /**
   * List all billing invoices (SUPER_ADMIN)
   */
  listInvoices: async (filters?: BillingInvoicesFilter & { schoolId?: string }): Promise<PaginatedResponse<BillingInvoice>> => {
    const params = new URLSearchParams();
    if (filters?.schoolId) params.set('schoolId', filters.schoolId);
    if (filters?.status) params.set('status', filters.status);
    if (filters?.page) params.set('page', String(filters.page));
    if (filters?.limit) params.set('limit', String(filters.limit));

    const response = await api.get(`/billing/invoices?${params.toString()}`);
    return response.data;
  },

  /**
   * Pay an invoice via M-Pesa STK Push
   */
  payInvoice: async (invoiceId: string, phoneNumber: string): Promise<{
    success: boolean;
    message: string;
    data: { checkoutRequestId: string; transactionRef: string; amount: number };
  }> => {
    const response = await api.post('/billing/payments/pay-invoice', { invoiceId, phoneNumber });
    return response.data;
  },
};